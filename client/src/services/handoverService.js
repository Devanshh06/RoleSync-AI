import { supabase } from '../lib/supabaseClient';

// ─── Utility ─────────────────────────────────────────────────
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Request handover access from another staff member
 */
export async function requestAccess(predecessorId, successorId) {
  if (!isValidUUID(predecessorId) || !isValidUUID(successorId)) {
    throw new Error('Invalid user IDs for handover request');
  }

  const { data, error } = await supabase
    .from('handover_requests')
    .insert([{ predecessor_id: predecessorId, successor_id: successorId, status: 'Pending' }]);

  if (error) {
    if (error.code === '23505') {
      throw new Error('A request already exists between these users.');
    }
    throw error;
  }
  return data;
}

/**
 * Update the status of a request (Approve/Reject)
 */
export async function updateRequestStatus(requestId, status) {
  if (!isValidUUID(requestId)) throw new Error('Invalid request ID');

  const { data, error } = await supabase
    .from('handover_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) throw error;
  return data;
}

/**
 * Fetch all handovers involving the current user (either incoming or outgoing)
 */
export async function fetchMyHandovers(userId) {
  if (!isValidUUID(userId)) return [];

  const { data, error } = await supabase
    .from('handover_requests')
    .select(`
      *,
      predecessor:staff!handover_requests_predecessor_id_fkey(id, full_name, email, department, designation, avatar_url),
      successor:staff!handover_requests_successor_id_fkey(id, full_name, email, department, designation, avatar_url)
    `)
    .or(`predecessor_id.eq.${userId},successor_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
