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
 * Add flagging configurations
 * @param {Array} configs - Array of flagging configuration objects to add
 * @returns {Promise<Object>} Response from add API
 */
export const addFlaggingConfigs = async (configs) => {
  try {
    const response = await api.post('/FlaggingConfig/add', {
      configs: configs
    });
    return response.data;
  } catch (error) {
    console.error('Error adding flagging configurations:', error);
    throw error;
  }
};

