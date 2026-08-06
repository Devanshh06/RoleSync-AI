import apiClient from './client';

/**
 * POST /auth/login
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: object }}
 */
export const login = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
};

/**
 * GET /auth/me
 * @returns {object} Current authenticated user
 */
export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};
