import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

// GET /api/handovers/:staffId — all handover requests involving this staff
router.get('/:staffId', async (req, res) => {
  const { staffId } = req.params;

  const { data, error } = await supabase
    .from('handover_requests')
    .select(`
      *,
      predecessor:staff!handover_requests_predecessor_id_fkey(id, full_name, email, department, designation, avatar_url),
      successor:staff!handover_requests_successor_id_fkey(id, full_name, email, department, designation, avatar_url)
    `)
    .or(`predecessor_id.eq.${staffId},successor_id.eq.${staffId}`)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/handovers — create a handover request
router.post('/', async (req, res) => {
  const { predecessor_id, successor_id } = req.body;

  const { data, error } = await supabase
    .from('handover_requests')
    .insert([{ predecessor_id, successor_id }])
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Request already exists.' });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
});

// PATCH /api/handovers/:id/status — approve or reject
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;

  const { data, error } = await supabase
    .from('handover_requests')
    .update({ status })
    .eq('id', req.params.id)
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
