import { supabase } from '../lib/supabaseClient';

/**
 * Register a new staff member.
 * Password hashing should be done server-side in production.
 * For now we store a simple hash placeholder — your backend will handle real auth.
 */
export async function registerStaff({ fullName, email, password, department, designation, contact }) {
  // In production, hash the password server-side. This is a placeholder.
  const { data, error } = await supabase
    .from('staff')
    .insert([
      {
        full_name: fullName,
        email: email.toLowerCase().trim(),
        password_hash: password, // TODO: Replace with server-side hashed password
        department,
        designation,
        contact,
        user_type: 'Faculty',
        status: 'Active',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Look up a staff member by email.
 */
export async function getStaffByEmail(email) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all staff members (for co-coordinator selection dropdowns).
 */
export async function fetchAllStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('id, full_name, email, department, designation, avatar_url')
    .eq('status', 'Active')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Update a staff member's profile.
 */
export async function updateStaffProfile(staffId, updates) {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
