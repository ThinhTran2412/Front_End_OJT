import api from "./api";

/**
 * Export test results to PDF for a specific test order
 * @param {string} testOrderId - The test order ID
 * @param {string} fileName - Optional file name (without extension)
 * @returns {Promise<{success: boolean, fileName: string}>}
 */
export const exportTestResultsToPdf = async (testOrderId, fileName = null) => {
  try {
    // Ensure testOrderId is a valid GUID string
    if (!testOrderId) {
      throw new Error('Test order ID is required');
    }

    // Convert to string and trim whitespace
    const testOrderIdStr = String(testOrderId).trim();

    // Validate GUID format (basic check)
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(testOrderIdStr)) {
      console.error('Invalid test order ID format:', testOrderIdStr);
      throw new Error('Invalid test order ID format');
    }

    const queryParams = new URLSearchParams();
    if (fileName) {
      queryParams.append('fileName', fileName);
    }

    const queryString = queryParams.toString();
    const url = `/TestResult/print/${testOrderIdStr}${queryString ? `?${queryString}` : ''}`;

    console.log('Exporting PDF - URL:', url, 'BaseURL:', api.defaults.baseURL);

    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Check if response is actually a PDF (not an error response)
    if (response.data.type && response.data.type !== 'application/pdf' && response.data.size === 0) {
      throw new Error('Invalid PDF response from server');
    }

    const blob = new Blob([response.data], {
      type: 'application/pdf'
    });
    
    const url_blob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_blob;
    
    const contentDisposition = response.headers['content-disposition'];
    let finalFileName = fileName ? `${fileName}.pdf` : `TestResult-${testOrderId}.pdf`;
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        finalFileName = fileNameMatch[1].replace(/['"]/g, '');
        // Ensure .pdf extension
        if (!finalFileName.endsWith('.pdf')) {
          finalFileName += '.pdf';
        }
      }
    }
    
    link.setAttribute('download', finalFileName);
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url_blob);
    
    return { success: true, fileName: finalFileName };
  } catch (error) {
    console.error('Error exporting test results to PDF:', error);
    
    // Provide more specific error messages
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 404) {
        throw new Error('Test order not found. Please check if the test order exists and is completed.');
      } else if (status === 400) {
        const message = data?.message || 'Invalid request. The test order may not be completed yet.';
        throw new Error(message);
      } else if (status === 403) {
        throw new Error('You do not have permission to export this test result.');
      } else if (status === 500) {
        throw new Error('Server error occurred while generating PDF. Please try again later.');
      } else {
        throw new Error(data?.message || `Failed to export PDF (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw error;
    }
  }
};

/**
 * Get test results for a specific test order
 * @param {string} testOrderId - The test order ID
 * @returns {Promise<Array>}
 */
export const getTestResultsByTestOrderId = async (testOrderId) => {
  try {
    // Use the dedicated endpoint to get test results
    const response = await api.get(`/TestOrder/${testOrderId}/test-results`);
    
    // Backend returns array of TestResultDto (PascalCase or camelCase)
    if (Array.isArray(response.data)) {
      // Map both PascalCase and camelCase to camelCase for frontend
      return response.data.map(r => ({
        testResultId: r.testResultId || r.TestResultId,
        testCode: r.testCode || r.TestCode || '',
        parameter: r.parameter || r.Parameter || '',
        valueNumeric: r.valueNumeric !== undefined ? r.valueNumeric : r.ValueNumeric,
        valueText: r.valueText !== undefined ? r.valueText : r.ValueText,
        unit: r.unit || r.Unit || '',
        referenceRange: r.referenceRange || r.ReferenceRange || '',
        status: r.status || r.Status || '',
        instrument: r.instrument || r.Instrument || '',
        resultStatus: r.resultStatus || r.ResultStatus || '',
        performedBy: r.performedBy !== undefined ? r.performedBy : r.PerformedBy,
        performedDate: r.performedDate || r.PerformedDate,
        reviewedBy: r.reviewedBy !== undefined ? r.reviewedBy : r.ReviewedBy,
        reviewedDate: r.reviewedDate || r.ReviewedDate,
        reviewedByAI: r.reviewedByAI !== undefined ? r.reviewedByAI : 
                     (r.ReviewedByAI !== undefined ? r.ReviewedByAI : false),
        aiReviewedDate: r.aiReviewedDate || r.AiReviewedDate,
        isConfirmed: r.isConfirmed !== undefined ? r.isConfirmed : 
                   (r.IsConfirmed !== undefined ? r.IsConfirmed : false),
        confirmedByUserId: r.confirmedByUserId !== undefined ? r.confirmedByUserId : r.ConfirmedByUserId,
        confirmedDate: r.confirmedDate || r.ConfirmedDate
      }));
    }
    
    return [];
  } catch (error) {
    // Only log errors that are not expected (404, 400 are OK - means no results yet)
    if (error.response && error.response.status >= 500) {
      console.warn('Could not fetch test results:', error);
    }
    // Return empty array if API not available or test order has no results
    return [];
  }
};

/**
 * Process test results from Simulator for a specific test order
 * @param {string} testOrderId - The test order ID
 * @param {string} testType - The test type (default: 'CBC')
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const processFromSimulator = async (testOrderId, testType = 'CBC') => {
  try {
    if (!testOrderId) {
      throw new Error('Test order ID is required');
    }

    // Convert to string and trim whitespace
    const testOrderIdStr = String(testOrderId).trim();

    // Validate GUID format (basic check)
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(testOrderIdStr)) {
      console.error('Invalid test order ID format:', testOrderIdStr);
      throw new Error('Invalid test order ID format');
    }

    // Use query parameters instead of path parameters
    const url = `/TestResult/process-from-simulator?testOrderId=${testOrderIdStr}&testType=${testType}`;
    console.log('Processing test results from simulator:', { url, testOrderId: testOrderIdStr, testType });

    const response = await api.post(url);
    
    console.log('Process from simulator response:', response.data);

    return {
      success: response.data?.success !== false, // Default to true if not explicitly false
      message: response.data?.message || 'Test results processed successfully'
    };
  } catch (error) {
    console.error('Error processing test results from simulator:', error);
    
    // Provide more specific error messages
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 404) {
        throw new Error('Test order not found.');
      } else if (status === 400) {
        const message = data?.message || 'Invalid request. The test order may not be ready for processing.';
        throw new Error(message);
      } else if (status === 500) {
        throw new Error('Server error occurred while processing test results. Please try again later.');
      } else {
        throw new Error(data?.message || `Failed to process test results (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw error;
    }
  }
};

