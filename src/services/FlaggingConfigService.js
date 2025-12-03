import api from './api';

/**
 * Get all flagging configurations
 * @returns {Promise<Array>} Array of flagging configuration objects
 */
export const getAllFlaggingConfigs = async () => {
  try {
    const response = await api.get('/FlaggingConfig/all');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching flagging configurations:', error);
    throw error;
  }
};

/**
 * Get flagging configuration by ID
 * @param {number} id - Configuration ID
 * @returns {Promise<Object>} Flagging configuration object
 */
export const getFlaggingConfigById = async (id) => {
  try {
    const response = await api.get(`/FlaggingConfig/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching flagging configuration:', error);
    throw error;
  }
};

/**
 * Sync flagging configurations (handles both add and update)
 * @param {Array} configs - Array of flagging configuration objects to sync
 * @returns {Promise<Object>} Response from sync API
 */
export const syncFlaggingConfigs = async (configs) => {
  try {
    const response = await api.post('/FlaggingConfig/sync', {
      configs: configs
    });
    return response.data;
  } catch (error) {
    console.error('Error syncing flagging configurations:', error);
    throw error;
  }
};

// Keep old method for backward compatibility
export const addFlaggingConfigs = syncFlaggingConfigs;