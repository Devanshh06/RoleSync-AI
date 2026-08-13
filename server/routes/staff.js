import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// GET /api/staff — all staff
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('staff')
    .select('id, full_name, email, department, designation, user_type, status, avatar_url')
    .order('full_name');

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/staff/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
