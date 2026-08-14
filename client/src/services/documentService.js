import { supabase } from '../lib/supabaseClient';

// ─── Utility ─────────────────────────────────────────────────
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/**
 * Fetch all vault documents with uploader info and targets.
 */
export async function fetchDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      uploader:staff!documents_uploaded_by_fkey(id, full_name, email, department, avatar_url),
      targets:document_targets(staff:staff(id, full_name, email))
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Upload a document to Supabase Storage and create DB entry.
 * Auto-creates tasks for target staff.
 */
export async function uploadVaultDocument(file, title, description, targetScope, targetStaffIds = [], uploaderId) {
  if (!file) throw new Error('No file provided');

  // 1. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `vault/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vault-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('vault-documents')
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  // 2. Insert document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert([{
      title,
      description: description || null,
      file_url: fileUrl,
      file_name: file.name,
      uploaded_by: uploaderId,
      target_scope: targetScope,
    }])
    .select('*')
    .single();

  if (docError) throw docError;

  // 3. Insert targets if specific
  let resolvedTargetIds = [];
  if (targetScope === 'specific' && targetStaffIds.length > 0) {
    resolvedTargetIds = targetStaffIds;
    const targetRows = targetStaffIds.map(staffId => ({
      document_id: doc.id,
      staff_id: staffId,
    }));
    await supabase.from('document_targets').insert(targetRows);
  } else if (targetScope === 'all') {
    const { data: allStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('status', 'Active');
    resolvedTargetIds = (allStaff || []).map(s => s.id);
  }

  // 4. Auto-create tasks for each target
  if (resolvedTargetIds.length > 0) {
    const taskRows = resolvedTargetIds.map(staffId => ({
      title: `📄 Review: ${title}`,
      description: description || `A document "${title}" has been shared with you. Please review it.`,
      assigned_to: staffId,
      created_by: uploaderId,
      status: 'Not Started',
      priority: 'Medium',
      date_assigned: new Date().toISOString().split('T')[0],
      document_url: fileUrl,
      document_name: file.name,
    }));
    await supabase.from('tasks').insert(taskRows);
  }

  return doc;
}

/**
 * Delete a vault document.
 */
export async function deleteDocument(docId) {
  if (!isValidUUID(docId)) throw new Error('Invalid document ID');

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', docId);

  if (error) throw error;
}
