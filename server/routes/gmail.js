import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { generateAIContent } from '../utils/aiClient.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── In-memory sync job tracker ────────────────────────────
// Map<jobId, { status, staffId, tasksCreated, totalProcessed, totalEmails, error, startedAt, completedAt }>
const syncJobs = new Map();

// Auto-cleanup jobs older than 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [id, job] of syncJobs) {
    if (job.completedAt && job.completedAt < cutoff) {
      syncJobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ─── Helpers ───────────────────────────────────────────────

function extractEmailText(parsed) {
  if (parsed.text) return parsed.text;
  if (parsed.html) {
    return parsed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function generateJobId() {
  return crypto.randomUUID();
}

// ─── 1. Save Credentials ──────────────────────────────────

router.post('/save-credentials', async (req, res) => {
  const { staffId, gmailAddress, gmailAppPassword } = req.body;
  if (!staffId || !gmailAddress || !gmailAppPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic validation of app password (should be 16 chars without spaces)
  const cleanedPassword = gmailAppPassword.replace(/\s/g, '');
  if (cleanedPassword.length !== 16) {
    return res.status(400).json({ error: 'Invalid App Password length. Must be 16 characters.' });
  }

  const { error } = await supabase
    .from('staff')
    .update({
      gmail_address: gmailAddress,
      gmail_app_password: cleanedPassword
    })
    .eq('id', staffId);

  if (error) {
    console.error('Error saving credentials:', error);
    return res.status(500).json({ error: 'Failed to save credentials' });
  }

  res.json({ success: true, message: 'Credentials saved successfully' });
});

// ─── 2. Sync Emails (Background) ──────────────────────────

router.post('/sync', async (req, res) => {
  const { staffId, days } = req.body;
  if (!staffId) return res.status(400).json({ error: 'Missing staffId' });

  // Get staff credentials
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('gmail_address, gmail_app_password')
    .eq('id', staffId)
    .single();

  if (staffError || !staff) {
    return res.status(404).json({ error: 'Staff not found' });
  }

  if (!staff.gmail_address || !staff.gmail_app_password) {
    return res.status(400).json({ error: 'Gmail credentials not configured for this user.' });
  }

  // Create a sync job and return immediately
  const jobId = generateJobId();
  syncJobs.set(jobId, {
    status: 'running',
    staffId,
    tasksCreated: [],
    totalProcessed: 0,
    totalEmails: 0,
    error: null,
    startedAt: Date.now(),
    completedAt: null
  });

  // Return 202 Accepted immediately — sync runs in background
  res.status(202).json({ jobId, message: 'Email sync started in background.' });

  // Fire-and-forget background processing
  processEmailSync(jobId, staffId, staff, days).catch(err => {
    console.error(`[Gmail Sync] Background job ${jobId} crashed:`, err);
    const job = syncJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err.message || 'Unknown error during sync';
      job.completedAt = Date.now();
    }
  });
});

// ─── 3. Sync Status (Polling) ─────────────────────────────

router.get('/sync-status/:jobId', (req, res) => {
  const job = syncJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Sync job not found or expired.' });
  }

  res.json({
    status: job.status,
    tasksCreated: job.tasksCreated,
    totalProcessed: job.totalProcessed,
    totalEmails: job.totalEmails,
    error: job.error
  });
});

// ─── Background Email Processing ──────────────────────────

async function processEmailSync(jobId, staffId, staff, days) {
  const job = syncJobs.get(jobId);

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: staff.gmail_address,
      pass: staff.gmail_app_password
    },
    logger: false
  });

  try {
    await client.connect();
    console.log(`[Gmail Sync] Job ${jobId}: Connected to IMAP for ${staff.gmail_address}`);

    const lock = await client.getMailboxLock('INBOX');
    try {
      // Get mailbox status to know total message count
      const mailboxStatus = client.mailbox;
      const totalMessages = mailboxStatus.exists;
      console.log(`[Gmail Sync] Job ${jobId}: Mailbox has ${totalMessages} total message(s)`);

      if (!totalMessages || totalMessages === 0) {
        job.status = 'completed';
        job.totalEmails = 0;
        job.completedAt = Date.now();
        await client.logout();
        return;
      }

      // Fetch the latest 5 emails by sequence number (highest seq = newest)
      const startSeq = Math.max(1, totalMessages - 4); // e.g., if 100 messages, fetch 96:100
      const fetchRange = `${startSeq}:${totalMessages}`;
      job.totalEmails = Math.min(5, totalMessages);
      console.log(`[Gmail Sync] Job ${jobId}: Fetching sequence range ${fetchRange} (latest ${job.totalEmails} emails)`);

      // Collect messages first, then process in reverse order (newest first)
      const messages = [];
      for await (const message of client.fetch(fetchRange, { source: true, envelope: true, uid: true })) {
        messages.push(message);
      }
      
      // Reverse so newest is processed first
      messages.reverse();
      console.log(`[Gmail Sync] Job ${jobId}: Fetched ${messages.length} email(s), now processing with AI...`);

      for (const message of messages) {
        try {
          const parsed = await simpleParser(message.source);
          const emailContent = extractEmailText(parsed);
          const subject = parsed.subject || 'No Subject';
          const from = parsed.from?.text || 'Unknown';

          // Truncate email body to avoid huge AI prompts (max 3000 chars)
          const truncatedContent = emailContent.substring(0, 3000);

          // Use AI to determine if there are actionable college/educational tasks
          const prompt = `
            Analyze the following email and extract any actionable tasks assigned to the recipient.
            
            CRITICAL RULES:
            1. ONLY extract tasks if the email is STRICTLY related to one of these areas:
               - College / University official work
               - Academic duties (syllabus, teaching, lectures, timetable)
               - Examinations (paper setting, invigilation, result processing)
               - Committee work (NAAC, IQAC, NBA, departmental committees)
               - Student-related duties (mentoring, attendance, assignments, projects)
               - Administrative duties from HOD, Principal, Dean, or management
               - Seminar, workshop, or conference organization
               - Research guidance, project supervision, or lab duties
               - Scholarship or internship coordination
               - Any official department communication requiring action
            
            2. You MUST return an EMPTY array [] if the email is ANY of the following:
               - Personal emails (friends, family, greetings)
               - Marketing / promotional emails
               - Social media notifications
               - Newsletter subscriptions
               - Online shopping / delivery notifications
               - Bank / financial notifications
               - Software update notifications
               - Generic automated notifications
               - Spam or irrelevant content
            
            3. Only create tasks for ACTIONABLE items — things the recipient needs to DO. 
               Do NOT create tasks for FYI-only information.

            Email Subject: ${subject}
            From: ${from}
            Body: ${truncatedContent}

            Return a JSON array of tasks. If there are no actionable college tasks, return [].
            Schema for each task:
            {
              "title": "Short descriptive title of the task",
              "description": "Detailed description including what needs to be done, any deadlines mentioned, and relevant context",
              "priority": "Medium" | "High" | "Urgent" | "Low"
            }
          `;

          const systemInstruction = "You are a strict academic task extraction assistant for college faculty. You ONLY extract actionable tasks from official college/educational emails. You return valid JSON arrays. For non-academic emails, always return [].";
          const responseSchema = {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] }
              },
              required: ["title", "description", "priority"]
            }
          };

          const aiResponse = await generateAIContent(prompt, { systemInstruction, responseSchema });

          let extractedTasks = [];
          try {
            const cleaned = aiResponse.replace(/```(?:json)?/gi, '').trim();
            extractedTasks = JSON.parse(cleaned);
          } catch (err) {
            console.error(`[Gmail Sync] Job ${jobId}: Failed to parse AI response for "${subject}":`, aiResponse);
          }

          // Insert extracted tasks into DB with duplicate prevention
          if (Array.isArray(extractedTasks) && extractedTasks.length > 0) {
            for (const task of extractedTasks) {
              const emailTag = `(Generated from email: ${subject})`;

              // Check for duplicate: same title + same email tag + same user
              const { data: existing } = await supabase
                .from('tasks')
                .select('id')
                .eq('assigned_to', staffId)
                .eq('title', task.title)
                .ilike('description', `%${emailTag}%`)
                .limit(1);

              if (existing && existing.length > 0) {
                console.log(`[Gmail Sync] Job ${jobId}: Skipping duplicate task "${task.title}"`);
                continue;
              }

              const { error: insertError } = await supabase
                .from('tasks')
                .insert({
                  title: task.title,
                  description: (task.description || '') + `\n\n📧 ${emailTag}`,
                  priority: task.priority || 'Medium',
                  assigned_to: staffId,
                  status: 'Not Started',
                  date_assigned: new Date().toISOString().split('T')[0]
                });

              if (insertError) {
                console.error(`[Gmail Sync] Job ${jobId}: Error inserting task:`, insertError);
              } else {
                job.tasksCreated.push(task.title);
              }
            }
          }

          // Mark email as read
          if (message.uid) {
            await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen'], { uid: true });
          }
        } catch (emailErr) {
          console.error(`[Gmail Sync] Job ${jobId}: Error processing single email:`, emailErr.message);
        }

        job.totalProcessed++;
      }

      job.status = 'completed';
      job.completedAt = Date.now();
      console.log(`[Gmail Sync] Job ${jobId}: Completed. ${job.tasksCreated.length} task(s) created from ${job.totalProcessed} email(s).`);

    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error(`[Gmail Sync] Job ${jobId}: IMAP sync error:`, err);
    job.status = 'failed';
    job.error = 'Failed to sync emails. Please check your App Password and ensure IMAP is enabled in Gmail settings.';
    job.completedAt = Date.now();
  }
}

export default router;
