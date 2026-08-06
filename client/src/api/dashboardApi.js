import apiClient from './client';

/**
 * GET /dashboard/summary
 * @returns {object} { totalRoles, pendingChecklistItems, openTasks, ... }
 */
export const getDashboardSummary = async () => {
  const { data } = await apiClient.get('/dashboard/summary');
  return data;
};

/**
 * GET /dashboard/handovers
 * @returns {Array} Ongoing handovers with completion percentages
 */
export const getDashboardHandovers = async () => {
  const { data } = await apiClient.get('/dashboard/handovers');
  return data;
};
