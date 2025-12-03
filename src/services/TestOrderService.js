import api from "./api";

// Get All Test Orders (NEW - for fetching full test order data with createdAt)
export const getTestOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination params if provided
    if (params.page) queryParams.append('Page', params.page);
    if (params.pageSize) queryParams.append('PageSize', params.pageSize);
    if (params.search) queryParams.append('Search', params.search);
    if (params.status) queryParams.append('Status', params.status);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/TestOrder/getList?${queryString}` : '/TestOrder/getList';
    
    console.log('Fetching test orders from:', url);
    const response = await api.get(url);
    console.log('Test orders response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching test orders:', error);
    throw error;
  }
};

// Create Test Order
export const createTestOrder = async (data) => {
  try {
    // Validate required fields
    if (!data.fullName || !data.fullName.trim()) {
      throw new Error('Full name is required');
    }
    if (!data.testType || !data.testType.trim()) {
      throw new Error('Test type is required');
    }
    
    // Check if identifyNumber exists and handle encrypted values
    let processedIdentifyNumber = '';
    if (data.identifyNumber && data.identifyNumber.trim()) {
      const identifyNum = data.identifyNumber.trim();
      // If it looks encrypted (contains = or +), log warning but allow it
      if (identifyNum.includes('=') || identifyNum.includes('+') || identifyNum.length > 20) {
        console.warn('Identify number appears to be encrypted:', identifyNum);
        processedIdentifyNumber = identifyNum; // Use as-is for encrypted values
      } else {
        processedIdentifyNumber = identifyNum; // Use as-is for normal values
      }
    }

    const payload = {
      fullName: data.fullName.trim(),
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      address: data.address || '',
      testType: data.testType.trim(),
      priority: data.priority || 'Normal',
      note: data.note || '',
      identifyNumber: processedIdentifyNumber
    };
    
    console.log('TestOrderService - Final payload being sent:', payload);
    
    const response = await api.post('/TestOrder', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating test order:', error);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

// Update Test Order
export const updateTestOrder = async (testOrderId, data) => {
  try {
    const payload = {
      testOrderId: testOrderId,
      identifyNumber: data.identifyNumber || '',
      patientName: data.patientName || '',
      dateOfBirth: data.dateOfBirth || null,
      age: parseInt(data.age) || 0,
      gender: data.gender || '',
      address: data.address || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      priority: data.priority || 'Normal',
      status: data.status || 'Created',
      note: data.note || ''
    };
    
    const response = await api.patch(`/TestOrder/${testOrderId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating test order:', error);
    throw error;
  }
};

// Delete Test Order
export const deleteTestOrder = async (testOrderId) => {
  try {
    const response = await api.delete(`/TestOrder/${testOrderId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting test order:', error);
    throw error;
  }
};

// Get Test Order by ID
export const getTestOrderById = async (testOrderId) => {
  try {
    const response = await api.get(`/TestOrder/${testOrderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching test order:', error);
    throw error;
  }
};

// Get Test Orders by Patient ID
export const getTestOrdersByPatientId = async (patientId) => {
  try {
    const response = await api.get(`/TestOrder/by-patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching test orders by patient ID:', error);
    throw error;
  }
};

// Export Test Orders to Excel for a specific patient (synchronous version)
export const exportTestOrdersByPatientId = async (patientId, fileName = null) => {
  try {
    const queryParams = new URLSearchParams();
    if (fileName) queryParams.append('fileName', fileName);

    const queryString = queryParams.toString();
    const url = `/TestOrder/export-patient/${patientId}${queryString ? `?${queryString}` : ''}`;

    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url_blob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url_blob;
    
    const contentDisposition = response.headers['content-disposition'];
    let finalFileName = fileName || `Test Orders-Patient${patientId}.xlsx`;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        finalFileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }
    
    link.setAttribute('download', finalFileName);
    document.body.appendChild(link);
    link.click();
    
    link.remove();
    window.URL.revokeObjectURL(url_blob);
    
    return { success: true, fileName: finalFileName };
  } catch (error) {
    console.error('Error exporting test orders by patient ID:', error);
    throw error;
  }
};

// Background Export - Start export job (non-blocking)
// Thay thế hàm startExportJob bằng:

// Background Export - Start export job (non-blocking)
export const startExportJob = async (patientId, testOrderIds = null, fileName) => {
  try {
    const payload = {
      testOrderIds: testOrderIds, // null = export current month, array = export selected
      fileName: fileName
    };
    
    console.log('[TestOrderService] Export payload:', {
      patientId,
      testOrderIds: testOrderIds ? `${testOrderIds.length} orders` : 'all from current month',
      fileName
    });
    
    // Use POST endpoint with test order IDs in body
    const response = await api.post(`/TestOrder/export-patient/${patientId}`, payload, {
      responseType: 'blob' // Important for file download
    });
    
    // Create blob and trigger download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('[TestOrderService] Export failed:', error);
    throw error;
  }
};

// Get export job status
export const getExportJobStatus = async (jobId) => {
  const jobManager = (await import('../utils/BackgroundJobManager')).default;
  const job = jobManager.getJob(jobId);
  
  if (!job) {
    return null;
  }
  
  return {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    downloadUrl: job.downloadUrl,
    errorMessage: job.errorMessage,
    fileName: job.fileName
  };
};

// Download exported file
export const downloadExportedFile = async (jobId) => {
  try {
    const jobManager = (await import('../utils/BackgroundJobManager')).default;
    const job = jobManager.getJob(jobId);

    if (!job || job.status !== 'completed' || !job.downloadUrl) {
      throw new Error('File not ready for download');
    }

    const response = await fetch(job.downloadUrl);
    const blob = await response.blob();

    return blob;
  } catch (error) {
    console.error('Error downloading exported file:', error);
    throw error;
  }
};

// Get Service Packages
export const getServicePackages = async () => {
  return [
    { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'CBC' },
    { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Lipid Panel' },
    { id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', name: 'Comprehensive Metabolic Panel' },
    { id: '6fa85f64-5717-4562-b3fc-2c963f66afa9', name: 'Thyroid Function Test' },
    { id: '7fa85f64-5717-4562-b3fc-2c963f66afaa', name: 'Liver Function Test' },
    { id: '8fa85f64-5717-4562-b3fc-2c963f66afab', name: 'Renal Function Test' }
  ];
};