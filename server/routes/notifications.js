import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// GET /api/notifications/:userId - Fetch all notifications for a user
router.get('/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(50); // limit to 50 most recent

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PUT /api/notifications/read-all/:userId - Mark all as read
router.put('/read-all/:userId', async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.params.userId)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
