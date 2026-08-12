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

// ─── Utility ─────────────────────────────────────────────────
const isValidUUID = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// ─── Tasks CRUD ────────────────────────────────────────────

/**
 * Fetch all tasks assigned to a specific staff member,
 * joined with category and co-coordinators.
 */
export async function fetchTasks(staffId) {
  if (!isValidUUID(staffId)) return []; // Prevent error with mock demo users (u1, u2)

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
 * Fetch tasks for a predecessor (someone who is handing over)
 */
export async function fetchPredecessorTasks(predecessorId) {
  if (!isValidUUID(predecessorId)) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      category:task_categories(*)
    `)
    .eq('assigned_to', predecessorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch tasks filtered by category.
 */
export async function fetchTasksByCategory(staffId, categoryId) {
  if (!isValidUUID(staffId)) return [];

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

// ─── Reporting & AI (Replaced from Mock) ───────────────────

/**
 * Fetch basic admin metrics for dashboard
 */
export async function getAdminMetrics() {
  const { count: totalTasks, error: err1 } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: completedTasks, error: err2 } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Done');

  const { data: staffData, error: err3 } = await supabase
    .from('staff')
    .select('department');

  if (err1 || err2 || err3) throw new Error('Failed to fetch metrics');

  // Compute departmental stats (mocking progress by just returning dummy 75% for now if real data not robust)
  const depts = {};
  staffData.forEach(s => {
    if (s.department) depts[s.department] = 75; // Ideally computed from tasks completion per dept
  });

  return {
    totalHandovers: totalTasks || 0,
    completedHandovers: completedTasks || 0,
    pendingHandovers: (totalTasks || 0) - (completedTasks || 0),
    departments: Object.keys(depts).map(d => ({ name: d, progress: depts[d] }))
  };
}

/**
 * Generate a simulated AI Brief string by aggregating a user's tasks
 */
export async function generateAIBrief(staffId) {
  if (!isValidUUID(staffId)) throw new Error('Invalid ID');
  const tasks = await fetchPredecessorTasks(staffId);
  const pending = tasks.filter(t => t.status !== 'Done');
  const completed = tasks.filter(t => t.status === 'Done');

  return `### AI Handover Brief
**Generated: ${new Date().toLocaleDateString()}**

**1. Pending Actions:**
${pending.length > 0 ? pending.map(t => `- ${t.title}`).join('\n') : '- No pending actions.'}

**2. Key Accomplishments:**
${completed.length > 0 ? completed.map(t => `- ${t.title}`).join('\n') : '- No recorded accomplishments.'}

**3. Notes from Predecessor:**
"Automated summary of active workload."
`;
}

/**
 * Search documents/tasks via simple ilike (since we don't have vector search hooked up)
 */
export async function searchRAGDocuments(query) {
  if (!query) return [];
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description')
    .ilike('title', `%${query}%`)
    .limit(5);

  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    title: d.title,
    snippet: (d.description || '').substring(0, 50) + '...',
    confidence: 0.95
  }));
}

