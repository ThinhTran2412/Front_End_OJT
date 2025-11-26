import api from './api';

export const getAllPatients = async (params = {}) => {
  try {
    // API interceptor already adds Authorization header, no need to add manually
    const response = await api.get('/Patient/all');
    
    console.log('Raw API Response:', response.data);
    
    // API returns array directly: [{ patientId, identifyNumber, fullName, ... }]
    const rawPatients = Array.isArray(response.data) ? response.data : [];
    
    // Map API response to frontend format (support both camelCase and PascalCase)
    const patients = rawPatients.map(patient => ({
      patientId: patient.patientId || patient.PatientId,
      identifyNumber: patient.identifyNumber || patient.IdentifyNumber || '',
      fullName: patient.fullName || patient.FullName || '',
      dateOfBirth: (patient.dateOfBirth || patient.DateOfBirth) && 
                   (patient.dateOfBirth !== "0001-01-01" && patient.DateOfBirth !== "0001-01-01")
                   ? (patient.dateOfBirth || patient.DateOfBirth) : null,
      gender: patient.gender || patient.Gender || "Not specified",
      phoneNumber: patient.phoneNumber || patient.PhoneNumber || "Not specified",
      email: patient.email || patient.Email || "Not specified",
      address: patient.address || patient.Address || "Not specified",
      age: patient.age !== undefined ? patient.age : (patient.Age !== undefined ? patient.Age : null),
      lastTestDate: (patient.lastTestDate || patient.LastTestDate) && 
                    (patient.lastTestDate !== "0001-01-01T00:00:00" && patient.LastTestDate !== "0001-01-01T00:00:00")
                    ? (patient.lastTestDate || patient.LastTestDate) : null,
      createdAt: patient.createdAt || patient.CreatedAt || null,
      createdBy: patient.createdBy || patient.CreatedBy || "System",
      updatedAt: patient.updatedAt || patient.UpdatedAt || null,
      updatedBy: patient.updatedBy || patient.UpdatedBy || null,
      isDeleted: patient.isDeleted !== undefined ? patient.isDeleted : 
                (patient.IsDeleted !== undefined ? patient.IsDeleted : false)
    }));

    console.log('Formatted Patients:', patients);

    // Client-side pagination (API doesn't support pagination)
    const { pageNumber = 1, pageSize = 10, searchTerm = '' } = params;
    const filteredPatients = searchTerm.trim() 
      ? patients.filter(p => {
          const search = searchTerm.toLowerCase();
          return (
            (p.fullName || '').toLowerCase().includes(search) ||
            (p.identifyNumber || '').toLowerCase().includes(search) ||
            (p.phoneNumber || '').toLowerCase().includes(search) ||
            (p.email || '').toLowerCase().includes(search) ||
            String(p.patientId || '').includes(search)
          );
        })
      : patients;

    const totalCount = filteredPatients.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

    return {
      patients: paginatedPatients,
      totalCount: totalCount,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPages: totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1
    };
  } catch (error) {
    console.error('Error fetching patients:', error.response || error);
    throw error;
  }
};

export const getPatientById = async (patientId) => {
  try {
    const response = await api.get(`/Patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient details:', error);
    throw error;
  }
};

// Create patient by identity with full information
export const createPatientByIdentity = async (patientData) => {
  try {
    const payload = {
      identifyNumber: patientData.identifyNumber,
      fullName: patientData.fullName,
      dateOfBirth: patientData.dateOfBirth,
      gender: patientData.gender,
      phoneNumber: patientData.phoneNumber || '',
      email: patientData.email || '',
      address: patientData.address || ''
    };
    console.log('Creating patient with data:', payload);
    
    const response = await api.post('/Patient/create/by-identity', payload);
    console.log('Patient created successfully:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error creating patient by identity:', error);
    console.error('Error details:', error.response?.data);
    throw error;
  }
};

// Original create patient (full data)
export const createPatient = async (patientData) => {
  try {
    const response = await api.post('/Patient', patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

export const updatePatient = async (patientId, patientData) => {
  try {
    const response = await api.put(`/Patient/${patientId}`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (patientId) => {
  try {
    const response = await api.delete(`/Patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Removed searchPatients function - using getAllPatients with client-side filtering instead

export const getPatientMedicalRecords = async (patientId) => {
  try {
    const response = await api.get('/PatientInfo/my-medical-records', {
      params: { patientId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    throw error;
  }
};

// Get current user's patient information
export const getMyPatientInfo = async () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await api.get('/Patient/me', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my patient info:', error);
    throw error;
  }
};

const PatientService = {
  getAllPatients,
  getPatientById,
  createPatient,
  createPatientByIdentity, // NEW
  updatePatient,
  deletePatient,
  getPatientMedicalRecords,
  getMyPatientInfo, // NEW
};

export default PatientService;