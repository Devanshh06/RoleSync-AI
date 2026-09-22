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

// Allowed attachment MIME types for Document Vault upload
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'text/plain',
  'text/csv',
]);

function isAllowedAttachment(attachment) {
  if (!attachment || !attachment.filename) return false;
  // Skip inline images (CID attachments like email signatures)
  if (attachment.contentDisposition === 'inline' && attachment.contentId) return false;
  if (attachment.size && attachment.size > 25 * 1024 * 1024) return false; // Skip > 25MB
  return ALLOWED_ATTACHMENT_TYPES.has(attachment.contentType);
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
            Carefully analyze the following email and extract the MAIN actionable task assigned to the recipient.
            
            CRITICAL RULES:
            1. ONLY extract a task if the email is STRICTLY related to one of these areas:
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
            
            3. CREATE MAXIMUM 1 OR 2 TASKS. Do not create a task for every sentence. Determine the single overarching actionable goal of this email. Use the Email Subject heavily to determine what the main task should be.
            
            4. Only create tasks for ACTIONABLE items — things the recipient needs to DO. 
               Do NOT create tasks for FYI-only information.

            5. DEADLINE EXTRACTION: If the email mentions any deadline, due date, or submission date
               (e.g., "submit by 25th September", "before next Friday", "deadline: 30/09/2026"),
               extract it and return it as a date string in YYYY-MM-DD format in the "deadline" field.
               If no deadline is mentioned, set "deadline" to null.
               Today's date is: ${new Date().toISOString().split('T')[0]}

            Email Subject: ${subject}
            From: ${from}
            Body: ${truncatedContent}

            Return a JSON array of tasks (maximum length 2). If there are no actionable college tasks, return [].
            Schema for each task:
            {
              "title": "Short descriptive title of the task based primarily on the email subject",
              "description": "Detailed description including what needs to be done, any deadlines mentioned, and relevant context from the body",
              "priority": "Medium" | "High" | "Urgent" | "Low",
              "deadline": "YYYY-MM-DD" | null
            }
          `;

          const systemInstruction = "You are a strict academic task extraction assistant for college faculty. You carefully analyze emails to find the single most important actionable task. You extract at most 1 or 2 tasks total, prioritizing the email subject. You also extract deadlines when mentioned. For non-academic or FYI emails, always return []. You return valid JSON arrays.";
          const responseSchema = {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] },
                deadline: { type: "string", nullable: true }
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

              // Build task row with optional deadline
              const taskRow = {
                title: task.title,
                description: (task.description || '') + `\n\n📧 ${emailTag}`,
                priority: task.priority || 'Medium',
                assigned_to: staffId,
                status: 'Not Started',
                date_assigned: new Date().toISOString().split('T')[0]
              };

              // Add deadline if AI extracted one
              if (task.deadline && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline)) {
                taskRow.deadline = task.deadline;
                console.log(`[Gmail Sync] Job ${jobId}: Extracted deadline ${task.deadline} for "${task.title}"`);
              }

              const { error: insertError } = await supabase
                .from('tasks')
                .insert(taskRow);

              if (insertError) {
                console.error(`[Gmail Sync] Job ${jobId}: Error inserting task:`, insertError);
              } else {
                job.tasksCreated.push(task.title);
              }
            }
          }

          // ─── Upload attachments to Document Vault ─────────────
          const attachments = parsed.attachments || [];
          const validAttachments = attachments.filter(isAllowedAttachment);

          for (const attachment of validAttachments) {
            try {
              const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
              const storagePath = `email-attachments/${staffId}/${safeFileName}`;

              // Upload to Supabase Storage
              const { error: uploadErr } = await supabase.storage
                .from('document-vault')
                .upload(storagePath, attachment.content, {
                  contentType: attachment.contentType,
                  cacheControl: '3600',
                  upsert: false,
                });

              if (uploadErr) {
                console.error(`[Gmail Sync] Job ${jobId}: Failed to upload attachment "${attachment.filename}":`, uploadErr.message);
                continue;
              }

              // Get public URL
              const { data: urlData } = supabase.storage
                .from('document-vault')
                .getPublicUrl(storagePath);

              // Insert into documents table
              const { error: docErr } = await supabase
                .from('documents')
                .insert({
                  title: `📎 ${attachment.filename} (from: ${subject})`,
                  description: `Auto-imported from email: "${subject}" sent by ${from}`,
                  file_url: urlData?.publicUrl || '',
                  file_name: attachment.filename,
                  uploaded_by: staffId,
                  target_scope: 'specific',
                });

              if (docErr) {
                console.error(`[Gmail Sync] Job ${jobId}: Failed to insert document row for "${attachment.filename}":`, docErr.message);
              } else {
                console.log(`[Gmail Sync] Job ${jobId}: Uploaded attachment "${attachment.filename}" to vault.`);
              }
            } catch (attErr) {
              console.error(`[Gmail Sync] Job ${jobId}: Attachment processing error:`, attErr.message);
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

// ─── Sync All Users (for cron) ────────────────────────────

async function syncAllUsers() {
  console.log('[Gmail Auto-Sync] Starting hourly sync for all configured users...');
  try {
    const { data: staffList, error } = await supabase
      .from('staff')
      .select('id, gmail_address, gmail_app_password')
      .not('gmail_address', 'is', null)
      .not('gmail_app_password', 'is', null);

    if (error) {
      console.error('[Gmail Auto-Sync] Failed to fetch staff list:', error.message);
      return;
    }

    if (!staffList || staffList.length === 0) {
      console.log('[Gmail Auto-Sync] No users with Gmail credentials configured. Skipping.');
      return;
    }

    console.log(`[Gmail Auto-Sync] Found ${staffList.length} user(s) to sync.`);

    for (const staff of staffList) {
      const jobId = generateJobId();
      syncJobs.set(jobId, {
        status: 'running',
        staffId: staff.id,
        tasksCreated: [],
        totalProcessed: 0,
        totalEmails: 0,
        error: null,
        startedAt: Date.now(),
        completedAt: null
      });

      try {
        await processEmailSync(jobId, staff.id, staff);
        console.log(`[Gmail Auto-Sync] Completed sync for ${staff.gmail_address}. Tasks created: ${syncJobs.get(jobId)?.tasksCreated.length || 0}`);
      } catch (err) {
        console.error(`[Gmail Auto-Sync] Failed sync for ${staff.gmail_address}:`, err.message);
        const job = syncJobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = err.message;
          job.completedAt = Date.now();
        }
      }
    }

    console.log('[Gmail Auto-Sync] Hourly sync completed for all users.');
  } catch (err) {
    console.error('[Gmail Auto-Sync] Critical error:', err.message);
  }
}

export { syncAllUsers };
export default router;
