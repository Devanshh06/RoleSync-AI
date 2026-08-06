import apiClient from './client';

/**
 * GET /users
 * @param {object} [filters] — { department, status, search }
 * @returns {Array} List of users
 */
export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.department) params.append('department', filters.department);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  const { data } = await apiClient.get(`/users?${params.toString()}`);
  return data;
};

/**
 * GET /users/:id
 * @param {string} id
 * @returns {object} User detail
 */
export const getUserById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
};

/**
 * POST /users
 * @param {object} userData — { name, email, department, designation, contact, userType }
 * @returns {object} Created user
 */
export const createUser = async (userData) => {
  const { data } = await apiClient.post('/users', userData);
  return data;
};

/**
 * PUT /users/:id
 * @param {string} id
 * @param {object} userData — fields to update
 * @returns {object} Updated user
 */
export const updateUser = async (id, userData) => {
  const { data } = await apiClient.put(`/users/${id}`, userData);
  return data;
};
