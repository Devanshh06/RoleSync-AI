import { supabase } from '../lib/supabaseClient';

const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Fetch all links with uploader info and targets.
 */
export async function fetchLinks() {
  const { data, error } = await supabase
    .from('links')
    .select(`
      *,
      uploader:staff!links_uploaded_by_fkey(id, full_name, email, department, avatar_url),
      targets:link_targets(staff:staff(id, full_name, email))
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Upload a link to the database.
 */
export async function uploadLink(title, url, description, targetScope, targetStaffIds = [], uploaderId) {
  if (!url) throw new Error('No URL provided');
  if (!title) throw new Error('No Title provided');

  // Ensure URL has http/https protocol
  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  // 1. Insert link record
  const { data: link, error: linkError } = await supabase
    .from('links')
    .insert([{
      title: title.trim(),
      url: formattedUrl,
      description: description ? description.trim() : null,
      uploaded_by: uploaderId,
      target_scope: targetScope,
    }])
    .select('*')
    .single();

  if (linkError) throw linkError;

  // 2. Insert targets if specific
  if (targetScope === 'specific' && targetStaffIds.length > 0) {
    const targetRows = targetStaffIds.map(staffId => ({
      link_id: link.id,
      staff_id: staffId,
    }));
    await supabase.from('link_targets').insert(targetRows);
  }

  return link;
}

/**
 * Delete a link.
 */
export async function deleteLink(linkId) {
  if (!isValidUUID(linkId)) throw new Error('Invalid link ID');

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
}
