import apiClient from './client';

// ── Checklist Items ──

/**
 * GET /checklist-items?roleAssignmentId=
 * @param {string} roleAssignmentId
 * @returns {Array} Checklist items for the assignment
 */
export const getChecklistItems = async (roleAssignmentId) => {
  const { data } = await apiClient.get(`/checklist-items?roleAssignmentId=${roleAssignmentId}`);
  return data;
};

/**
 * PUT /checklist-items/:id
 * @param {string} id
 * @param {object} updateData — { status, remark }
 * @returns {object} Updated checklist item
 */
export const updateChecklistItem = async (id, updateData) => {
  const { data } = await apiClient.put(`/checklist-items/${id}`, updateData);
  return data;
};

// ── Documents ──

/**
 * GET /documents?roleId=
 * @param {string} roleId
 * @returns {Array} Documents for the role
 */
export const getDocuments = async (roleId) => {
  const { data } = await apiClient.get(`/documents?roleId=${roleId}`);
  return data;
};

/**
 * POST /documents
 * @param {string} roleId
 * @param {FormData} formData — file + metadata (title, category)
 * @returns {object} Created document record
 */
export const uploadDocument = async (roleId, formData) => {
  formData.append('roleId', roleId);
  const { data } = await apiClient.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ── Tasks ──

/**
 * GET /tasks?roleId=
 * @param {string} roleId
 * @returns {Array} Tasks for the role
 */
export const getTasks = async (roleId) => {
  const { data } = await apiClient.get(`/tasks?roleId=${roleId}`);
  return data;
};

/**
 * POST /tasks
 * @param {object} taskData — { roleId, title, ownerId, deadline, notes }
 * @returns {object} Created task
 */
export const createTask = async (taskData) => {
  const { data } = await apiClient.post('/tasks', taskData);
  return data;
};

/**
 * PUT /tasks/:id
 * @param {string} id
 * @param {object} updateData — { status, title, notes, deadline }
 * @returns {object} Updated task
 */
export const updateTask = async (id, updateData) => {
  const { data } = await apiClient.put(`/tasks/${id}`, updateData);
  return data;
};
