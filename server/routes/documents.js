import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// GET /api/documents — list all documents with uploader info
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:staff!documents_uploaded_by_fkey(id, full_name, email, department, avatar_url),
      targets:document_targets(staff:staff(id, full_name, email))
    `)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/documents — create document + targets + auto-create tasks
router.post('/', async (req, res) => {
  const { title, description, file_url, file_name, uploaded_by, target_scope, target_staff_ids } = req.body;

  // 1. Insert the document
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert([{ title, description, file_url, file_name, uploaded_by, target_scope }])
    .select('*')
    .single();

  if (docError) return res.status(500).json({ error: docError.message });

  // 2. If specific targets, insert document_targets rows
  let targetIds = [];
  if (target_scope === 'specific' && target_staff_ids?.length > 0) {
    targetIds = target_staff_ids;
    const targetRows = target_staff_ids.map(staffId => ({
      document_id: doc.id,
      staff_id: staffId,
    }));
    await supabase.from('document_targets').insert(targetRows);
  } else if (target_scope === 'all') {
    // Fetch all active staff
    const { data: allStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('status', 'Active');
    targetIds = (allStaff || []).map(s => s.id);
  }

  // 3. Auto-create tasks for each target staff
  if (targetIds.length > 0) {
    const taskRows = targetIds.map(staffId => ({
      title: `📄 Review: ${title}`,
      description: description || `A document "${title}" has been shared with you. Please review it.`,
      assigned_to: staffId,
      created_by: uploaded_by,
      status: 'Not Started',
      priority: 'Medium',
      date_assigned: new Date().toISOString().split('T')[0],
      document_url: file_url,
      document_name: file_name,
    }));
    await supabase.from('tasks').insert(taskRows);
  }

  res.status(201).json(doc);
});

// DELETE /api/documents/:id — delete a document
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
