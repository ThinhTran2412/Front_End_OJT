import api from "./api";

// Create Test Order
export const createTestOrder = async (data) => {
  try {
    const payload = {
      fullName: data.fullName || '',
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      address: data.address || '',
      testType: data.testType || '',
      priority: data.priority || 'Normal',
      note: data.note || '',
      identifyNumber: data.identifyNumber || ''
    };
    
    const response = await api.post('/TestOrder', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating test order:', error);
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
export const startExportJob = async (patientId, selectedOrderIds = null, fileName = null) => {
  try {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const jobManager = (await import('../utils/BackgroundJobManager')).default;
    const exportRequest = {
      patientId,
      testOrderIds: selectedOrderIds,
      fileName
    };
    
    jobManager.registerJob(jobId, {
      type: 'export',
      fileName: fileName || `Test Orders-Patient${patientId}.xlsx`,
      status: 'pending',
      progress: 0,
      exportRequest
    });
    
    setTimeout(async () => {
      try {
        const jobManagerRef = (await import('../utils/BackgroundJobManager')).default;
        
        jobManagerRef.updateJob(jobId, { status: 'processing', progress: 10 });

        const progressSteps = [25, 50, 75, 90];
        for (const progress of progressSteps) {
          await new Promise(resolve => setTimeout(resolve, 500));
          jobManagerRef.updateJob(jobId, { progress });
        }

        const queryParams = new URLSearchParams();
        if (fileName) queryParams.append('fileName', fileName);
        if (selectedOrderIds && selectedOrderIds.length > 0) {
          selectedOrderIds.forEach(id => queryParams.append('testOrderIds', id));
        }

        const queryString = queryParams.toString();
        const url = `/TestOrder/export-patient/${patientId}${queryString ? `?${queryString}` : ''}`;

        const response = await api.get(url, {
          responseType: 'blob',
        });

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const downloadUrl = window.URL.createObjectURL(blob);

        const contentDisposition = response.headers['content-disposition'];
        let finalFileName = fileName || `Test Orders-Patient${patientId}.xlsx`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (fileNameMatch && fileNameMatch[1]) {
            finalFileName = fileNameMatch[1].replace(/['"]/g, '');
          }
        }

        jobManagerRef.updateJob(jobId, {
          status: 'completed',
          progress: 100,
          downloadUrl,
          fileName: finalFileName
        });
      } catch (error) {
        const jobManagerRef = (await import('../utils/BackgroundJobManager')).default;
        jobManagerRef.updateJob(jobId, {
          status: 'failed',
          errorMessage: error.message || 'Export failed'
        });
      }
    }, 100);

    return { jobId };
  } catch (error) {
    console.error('Error starting export job:', error);
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
    { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Complete Blood Count (CBC)' },
    { id: '4fa85f64-5717-4562-b3fc-2c963f66afa7', name: 'Lipid Panel' },
    { id: '5fa85f64-5717-4562-b3fc-2c963f66afa8', name: 'Comprehensive Metabolic Panel' },
    { id: '6fa85f64-5717-4562-b3fc-2c963f66afa9', name: 'Thyroid Function Test' },
    { id: '7fa85f64-5717-4562-b3fc-2c963f66afaa', name: 'Liver Function Test' },
    { id: '8fa85f64-5717-4562-b3fc-2c963f66afab', name: 'Renal Function Test' }
  ];
};
