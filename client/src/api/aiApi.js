import apiClient from './client';

/**
 * POST /ai/generate-brief
 * @param {string} roleId
 * @returns {object} AI-generated handover brief
 */
export const generateBrief = async (roleId) => {
  const { data } = await apiClient.post('/ai/generate-brief', { roleId });
  return data;
};

/**
 * GET /ai/search?q=
 * @param {string} query — Natural language query
 * @returns {Array} Search results with type, title, snippet, score
 */
export const search = async (query) => {
  const { data } = await apiClient.get(`/ai/search?q=${encodeURIComponent(query)}`);
  return data;
};
