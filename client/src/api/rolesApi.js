import apiClient from './client';

// ── Roles ──

/**
 * GET /roles
 * @returns {Array} List of role types
 */
export const getRoles = async () => {
  const { data } = await apiClient.get('/roles');
  return data;
};

/**
 * POST /roles
 * @param {object} roleData — { name, type }
 * @returns {object} Created role
 */
export const createRole = async (roleData) => {
  const { data } = await apiClient.post('/roles', roleData);
  return data;
};

// ── Role Assignments ──

/**
 * GET /role-assignments
 * @param {object} [filters] — { userId, roleId, isActive }
 * @returns {Array} List of role assignments
 */
export const getRoleAssignments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.roleId) params.append('roleId', filters.roleId);
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
  const { data } = await apiClient.get(`/role-assignments?${params.toString()}`);
  return data;
};

/**
 * POST /role-assignments
 * @param {object} assignmentData — { roleId, userId, startDate }
 * @returns {object} Created assignment
 */
export const createRoleAssignment = async (assignmentData) => {
  const { data } = await apiClient.post('/role-assignments', assignmentData);
  return data;
};

/**
 * PUT /role-assignments/:id
 * @param {string} id
 * @param {object} updateData — { endDate, isActive }
 * @returns {object} Updated assignment
 */
export const updateRoleAssignment = async (id, updateData) => {
  const { data } = await apiClient.put(`/role-assignments/${id}`, updateData);
  return data;
};
