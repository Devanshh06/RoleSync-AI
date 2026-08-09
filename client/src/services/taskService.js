import { supabase } from '../lib/supabaseClient';

// ─── Categories ────────────────────────────────────────────

/**
 * Fetch all task categories.
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from('task_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ─── Tasks CRUD ────────────────────────────────────────────

/**
 * Fetch all tasks assigned to a specific staff member,
 * joined with category and co-coordinators.
 */
export async function fetchTasks(staffId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      category:task_categories(*),
      coordinators:task_coordinators(
        staff:staff(id, full_name, email, avatar_url)
      )
    `)
    .eq('assigned_to', staffId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch tasks filtered by category.
 */
export async function fetchTasksByCategory(staffId, categoryId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      category:task_categories(*),
      coordinators:task_coordinators(
        staff:staff(id, full_name, email, avatar_url)
      )
    `)
    .eq('assigned_to', staffId)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new task.
 * @param {Object} taskData - Task fields (title, description, category_id, etc.)
 * @param {string[]} coordinatorIds - Array of staff IDs for co-coordinators
 */
export async function createTask(taskData, coordinatorIds = []) {
  // 1. Insert the task
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert([taskData])
    .select(`
      *,
      category:task_categories(*)
    `)
    .single();

  if (taskError) throw taskError;

  // 2. Insert co-coordinators if any
  if (coordinatorIds.length > 0) {
    const coordinatorRows = coordinatorIds.map((staffId) => ({
      task_id: task.id,
      staff_id: staffId,
    }));

    const { error: coordError } = await supabase
      .from('task_coordinators')
      .insert(coordinatorRows);

    if (coordError) {
      console.error('Failed to add coordinators:', coordError);
      // Don't throw — the task was created, coordinators are optional
    }
  }

  return task;
}

/**
 * Update a task.
 */
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      category:task_categories(*),
      coordinators:task_coordinators(
        staff:staff(id, full_name, email, avatar_url)
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// ─── Coordinators ──────────────────────────────────────────

/**
 * Add co-coordinators to a task.
 */
export async function addCoordinators(taskId, staffIds) {
  const rows = staffIds.map((staffId) => ({
    task_id: taskId,
    staff_id: staffId,
  }));

  const { error } = await supabase
    .from('task_coordinators')
    .insert(rows);

  if (error) throw error;
}

/**
 * Remove a co-coordinator from a task.
 */
export async function removeCoordinator(taskId, staffId) {
  const { error } = await supabase
    .from('task_coordinators')
    .delete()
    .eq('task_id', taskId)
    .eq('staff_id', staffId);

  if (error) throw error;
}

// ─── Document Upload ───────────────────────────────────────

/**
 * Upload a document to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadDocument(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `tasks/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('task-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('task-documents')
    .getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    name: file.name,
  };
}
