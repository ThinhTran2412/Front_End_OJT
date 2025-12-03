import api from './api';

export const getAllMedicalRecords = async () => {
  try {
    const response = await api.get('/MedicalRecord/all');
    return response.data;
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw error;
  }
};

export const getMedicalRecordById = async (medicalRecordId) => {
  try {
    const response = await api.get(`/MedicalRecord/${medicalRecordId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching medical record:', error);
    throw error;
  }
};

export const updateMedicalRecord = async (medicalRecordId, data) => {
  try {
    const response = await api.patch(`/MedicalRecord/${medicalRecordId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating medical record:', error);
    throw error;
  }
};

export const createMedicalRecord = async (payload) => {
  try {
    const response = await api.post('/MedicalRecord', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw error;
  }
};

const MedicalRecordService = {
  getAllMedicalRecords,
  getMedicalRecordById,
  createMedicalRecord,
};

export default MedicalRecordService;