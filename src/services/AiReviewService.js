import api from "./api";

/**
 * AI Review Service
 * Handles all AI review related API calls
 */

// Get AI Review status for a test order
export const getAiReviewStatus = async (testOrderId) => {
  try {
    const response = await api.get(`/ai-review/${testOrderId}`);
    // Backend returns: { TestOrderId, AiReviewEnabled }
    return {
      testOrderId: response.data.TestOrderId,
      aiReviewEnabled: response.data.AiReviewEnabled || false
    };
  } catch (error) {
    const errorMessage = error.response?.data?.message || '';
    const errorDetail = error.response?.data?.error || '';
    
    // Check if it's a database/SQL error (unexpected)
    const isDatabaseError = errorDetail && (
      errorDetail.includes('column') || 
      errorDetail.includes('does not exist') ||
      errorDetail.includes('42703') ||
      errorDetail.includes('SQL') ||
      errorDetail.includes('database')
    );
    
    // If 404, the test order might not have AI review enabled yet - return default (expected)
    if (error.response?.status === 404) {
      return { testOrderId, aiReviewEnabled: false };
    }
    
    // If 400 with "not found" message, it's expected behavior
    if (error.response?.status === 400 && 
        (errorMessage.toLowerCase().includes('not found') || 
         errorMessage.toLowerCase().includes('test order not found'))) {
      return { testOrderId, aiReviewEnabled: false };
    }
    
    // If 400 with database error, log it as it's a backend issue
    // NOTE: This is a backend SQL error - the query is trying to access a column that doesn't exist
    // (e.g., "column t0.CreatedAt does not exist"). This needs to be fixed in the backend repository/query.
    if (error.response?.status === 400 && isDatabaseError) {
      console.error(`[BACKEND ERROR] AI review status database error for order ${testOrderId}:`, {
        message: errorMessage,
        error: errorDetail,
        status: error.response.status,
        url: error.config?.url,
        note: 'This is a backend SQL error. Please check the repository query - it may be referencing a non-existent column (e.g., CreatedAt).'
      });
      // Still return false to not break the UI, but log the error for debugging
      return { testOrderId, aiReviewEnabled: false };
    }
    
    // For other 400 errors, assume it's expected (AI review not enabled)
    if (error.response?.status === 400) {
      return { testOrderId, aiReviewEnabled: false };
    }
    
    // For server errors (500+), log as warning
    if (error.response && error.response.status >= 500) {
      console.warn(`AI review status server error for order ${testOrderId}:`, {
        status: error.response.status,
        message: errorMessage,
        error: errorDetail
      });
    }
    
    // Default: return false (AI review not enabled)
    return { testOrderId, aiReviewEnabled: false };
  }
};

// Set AI Review mode (enable/disable) for a test order
export const setAiReviewMode = async (testOrderId, enable) => {
  try {
    // Ensure enable is a boolean (true or false)
    const enableValue = enable === true || enable === 'true' || enable === 1;
    
    const url = `/ai-review/${testOrderId}?enable=${enableValue}`;
    console.log('Setting AI review mode:', { url, testOrderId, enable: enableValue });
    
    const response = await api.put(url, null);
    
    console.log('Set AI review mode response:', response.data);
    
    // Backend returns: { TestOrderId, AiReviewEnabled }
    return {
      testOrderId: response.data.TestOrderId,
      aiReviewEnabled: response.data.AiReviewEnabled || false
    };
  } catch (error) {
    console.error('Error setting AI review mode:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      testOrderId,
      enable
    });
    throw error;
  }
};

// Trigger AI Review for a test order
export const triggerAiReview = async (testOrderId) => {
  try {
    console.log('Triggering AI review for test order:', testOrderId);
    const response = await api.post(`/ai-review/${testOrderId}/trigger`);
    console.log('AI Review trigger response:', response.data);
    
    // Normalize response data to handle both camelCase and PascalCase
    const data = response.data;
    
    // Extract main fields
    const testOrderIdValue = data.testOrderId || data.TestOrderId;
    const statusValue = data.status || data.Status;
    const isAiReviewEnabledValue = data.isAiReviewEnabled !== undefined 
      ? data.isAiReviewEnabled 
      : (data.IsAiReviewEnabled !== undefined ? data.IsAiReviewEnabled : false);
    
    // Extract AI analysis fields
    const aiSummaryValue = data.aiSummary || data.AiSummary || null;
    const predictedStatusValue = data.predictedStatus || data.PredictedStatus || null;
    
    // Extract and normalize AI reviewed results
    const rawResults = data.aiReviewedResults || data.AiReviewedResults || [];
    const normalizedResults = rawResults.map(result => ({
      testResultId: result.testResultId || result.TestResultId,
      parameter: result.parameter || result.Parameter,
      valueNumeric: result.valueNumeric !== undefined ? result.valueNumeric : result.ValueNumeric,
      valueText: result.valueText || result.ValueText,
      unit: result.unit || result.Unit,
      referenceRange: result.referenceRange || result.ReferenceRange,
      resultStatus: result.resultStatus || result.ResultStatus,
      reviewedByAI: result.reviewedByAI !== undefined ? result.reviewedByAI : result.ReviewedByAI,
      aiReviewedDate: result.aiReviewedDate || result.AiReviewedDate
    }));
    
    return {
      testOrderId: testOrderIdValue,
      status: statusValue,
      isAiReviewEnabled: isAiReviewEnabledValue,
      aiSummary: aiSummaryValue,
      predictedStatus: predictedStatusValue,
      aiReviewedResults: normalizedResults
    };
  } catch (error) {
    console.error('Error triggering AI review:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      testOrderId
    });
    throw error;
  }
};

// Confirm AI Review results
export const confirmAiReviewResults = async (testOrderId, confirmedByUserId) => {
  try {
    // Ensure confirmedByUserId is a valid integer
    if (confirmedByUserId === null || confirmedByUserId === undefined) {
      throw new Error(`userId is required but was ${confirmedByUserId}`);
    }
    
    const userId = Number(confirmedByUserId);
    if (Number.isNaN(userId) || userId <= 0 || !Number.isInteger(userId)) {
      throw new Error(`Invalid userId: ${confirmedByUserId} (parsed as: ${userId})`);
    }

    const url = `/ai-review/${testOrderId}/confirm?confirmedByUserId=${userId}`;
    console.log('Confirming AI review results:', { 
      url, 
      testOrderId, 
      originalUserId: confirmedByUserId,
      parsedUserId: userId,
      userIdType: typeof confirmedByUserId
    });
    
    const response = await api.post(url, null);
    
    console.log('Confirm AI review results response:', response.data);
    
    // Backend returns: { TestOrderId/testOrderId, Status/status, ConfirmedResults/confirmedResults }
    return {
      testOrderId: response.data.testOrderId || response.data.TestOrderId,
      status: response.data.status || response.data.Status,
      confirmedResults: response.data.confirmedResults || response.data.ConfirmedResults || []
    };
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.response?.data?.message || error.message,
      error: error.response?.data?.error || error.response?.data?.Error,
      testOrderId,
      originalUserId: confirmedByUserId,
      userIdType: typeof confirmedByUserId
    };
    
    console.error('Error confirming AI review results:', errorDetails);
    
    // If it's a validation error from backend, provide more context
    if (error.response?.status === 400) {
      const backendError = error.response?.data?.error || error.response?.data?.Error || '';
      const backendMessage = error.response?.data?.message || error.response?.data?.Message || '';
      
      // Check for specific backend error messages
      if (backendError.includes('not been reviewed by AI') || backendMessage.includes('not been reviewed by AI')) {
        throw new Error('Test order has not been reviewed by AI yet. Please trigger AI review first.');
      }
      if (backendError.includes('No AI-reviewed results') || backendMessage.includes('No AI-reviewed results')) {
        throw new Error('No AI-reviewed results found to confirm, or all results have already been confirmed.');
      }
      if (backendError.includes('no results') || backendMessage.includes('no results')) {
        throw new Error('Test order has no results to confirm.');
      }
    }
    
    throw error;
  }
};