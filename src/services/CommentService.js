import api from './api';

/**
 * Get comments for test results (by test result IDs)
 * @param {Array<number>} testResultIds - Array of test result IDs
 * @returns {Promise<Array>} Array of comment objects
 */
export const getCommentsByTestResults = async (testResultIds) => {
  try {
    if (!testResultIds || testResultIds.length === 0) {
      return [];
    }
    const response = await api.post('/Comment/by-test-results', {
      testResultIds: testResultIds
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching comments by test results:', error);
    throw error;
  }
};

/**
 * Get comments by test order ID
 * @param {string} testOrderId - Test order ID (GUID)
 * @returns {Promise<Array>} Array of comment objects
 */
export const getCommentsByTestOrderId = async (testOrderId) => {
  try {
    if (!testOrderId) {
      return [];
    }
    const response = await api.get(`/Comment/by-test-order/${testOrderId}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching comments by test order ID:', error);
    throw error;
  }
};

/**
 * Add a new comment
 * @param {Object} commentData - Comment data
 * @param {string} commentData.testOrderId - Test order ID
 * @param {Array<number>} commentData.testResultId - Array of test result IDs
 * @param {string} commentData.message - Comment message
 * @returns {Promise<Object>} Response from add API
 */
export const addComment = async (commentData) => {
  try {
    const response = await api.post('/Comment/add', commentData);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {number} commentId - Comment ID
 * @param {string} message - Updated message
 * @returns {Promise<Object>} Response from update API
 */
export const updateComment = async (commentId, message) => {
  try {
    const response = await api.put(`/Comment/modify?commentId=${commentId}`, {
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Response from delete API
 */
export const deleteComment = async (commentId) => {
  try {
    const response = await api.delete(`/Comment/delete/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

