import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// GET /api/tasks/:staffId — all tasks for a staff member
router.get('/:staffId', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:task_categories(*), coordinators:task_coordinators(staff:staff(id, full_name, email, avatar_url))')
    .eq('assigned_to', req.params.staffId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/tasks/:staffId/stats — dashboard stats
router.get('/:staffId/stats', async (req, res) => {
  const { staffId } = req.params;

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, status, deadline')
    .eq('assigned_to', staffId);

  if (error) return res.status(500).json({ error: error.message });

  const now = new Date();
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Not Started' || t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Done').length,
    overdue: tasks.filter(t => t.deadline && t.status !== 'Done' && new Date(t.deadline) < now).length,
  };
  res.json(stats);
});

// GET /api/tasks/:staffId/upcoming?days=7 — tasks with upcoming deadlines
router.get('/:staffId/upcoming', async (req, res) => {
  const { staffId } = req.params;
  const days = parseInt(req.query.days) || 7;
  const now = new Date();
  const future = new Date(now.getTime() + days * 86400000);

  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:task_categories(*)')
    .eq('assigned_to', staffId)
    .neq('status', 'Done')
    .gte('deadline', now.toISOString().split('T')[0])
    .lte('deadline', future.toISOString().split('T')[0])
    .order('deadline', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/tasks/:staffId/recent?limit=10 — recently updated tasks
router.get('/:staffId/recent', async (req, res) => {
  const { staffId } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:task_categories(*)')
    .eq('assigned_to', staffId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/tasks/:staffId/gantt — tasks with date ranges for Gantt chart
router.get('/:staffId/gantt', async (req, res) => {
  const { staffId } = req.params;

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, priority, date_assigned, deadline, category:task_categories(name, color)')
    .eq('assigned_to', staffId)
    .not('deadline', 'is', null)
    .order('date_assigned', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/tasks — create task (supports HOD assigning to another faculty)
router.post('/', async (req, res) => {
  const { coordinatorIds, ...taskData } = req.body;

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert([taskData])
    .select('*, category:task_categories(*)')
    .single();

  if (taskError) return res.status(500).json({ error: taskError.message });

  if (coordinatorIds?.length > 0) {
    const rows = coordinatorIds.map(staffId => ({ task_id: task.id, staff_id: staffId }));
    await supabase.from('task_coordinators').insert(rows);
  }

  res.status(201).json(task);
});

// PATCH /api/tasks/:id — update a task
router.patch('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(req.body)
    .eq('id', req.params.id)
    .select('*, category:task_categories(*), coordinators:task_coordinators(staff:staff(id, full_name, email, avatar_url))')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/tasks/:id — delete a task
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// GET /api/tasks/:staffId/category/:categoryId — filter tasks by category
router.get('/:staffId/category/:categoryId', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, category:task_categories(*), coordinators:task_coordinators(staff:staff(id, full_name, email, avatar_url))')
    .eq('assigned_to', req.params.staffId)
    .eq('category_id', req.params.categoryId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
