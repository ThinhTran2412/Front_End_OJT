import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, User, Mail, Plus, ClipboardList, Edit, ChevronRight, FileText, Calendar, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { createTestOrder, updateTestOrder, deleteTestOrder } from '../../services/TestOrderService';
import { getAllPatients } from '../../services/PatientService';
import TestOrderModal from '../../components/modals/TestOrderModal';
import TestOrderDetailModal from '../../components/TestOrder_Management/TestOrderDetailModal';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useAuthStore } from '../../store/authStore';
import { InlineLoader } from '../../components/Loading';
import { getAllMedicalRecords, createMedicalRecord, updateMedicalRecord } from '../../services/MedicalRecordService';
import MedicalRecordEditModal from '../../components/modals/MedicalRecordEditModal';

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Get All Test Orders (NEW)
export const getTestOrders = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Support các query params
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

const resolveCreatedBy = (tokenPayload, user) => {
  return (
    tokenPayload?.email ||
    tokenPayload?.Email ||
    tokenPayload?.username ||
    tokenPayload?.userName ||
    user?.email ||
    user?.userName ||
    'System'
  );
};

export default function PatientMedicalRecordDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const { accessToken, user } = useAuthStore();
  const tokenPayload = accessToken && typeof accessToken === 'string' && accessToken.includes('.')
    ? decodeJWT(accessToken)
    : null;
  const patientFromNavigation = location.state?.patient;
  
  // Test Orders Pagination state
  const [testOrdersPage, setTestOrdersPage] = useState(1);
  const [testOrdersPageSize, setTestOrdersPageSize] = useState(3); // Hiển thị tối đa 3 test orders
  const [allTestOrders, setAllTestOrders] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Toast hook
  const { toasts, showToast, removeToast } = useToast();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Test Order Detail Modal state
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientMedicalRecords();
    }
  }, [patientId, patientFromNavigation?.fullName]);

  const buildPatientDataFromRecord = (record) => {
    if (!record) return null;

    console.log('buildPatientDataFromRecord - input record:', record);
    const patientData = {
      medicalRecordId: record.medicalRecordId,
      patientId: record.patientId,
      fullName: record.patientName,
      dateOfBirth: record.dateOfBirth === "0001-01-01" ? null : record.dateOfBirth,
      age: record.age,
      email: record.email,
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
      gender: record.gender,
      phoneNumber: record.phoneNumber,
      address: record.address,
      identifyNumber: '', // Medical record doesn't have identifyNumber, will be fetched separately
      testOrders: record.testOrders || []
    };
    console.log('buildPatientDataFromRecord - output patientData:', patientData);
    return patientData;
  };

  const buildPatientDataFromState = (patient, baseRecord) => {
    if (!patient) return null;

    return {
      medicalRecordId: baseRecord?.medicalRecordId || null,
      patientId: patient.patientId,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      age: patient.age,
      email: patient.email,
      createdAt: baseRecord?.createdAt || patient.createdAt,
      createdBy: baseRecord?.createdBy || patient.createdBy || 'System',
      updatedAt: baseRecord?.updatedAt || patient.updatedAt,
      updatedBy: baseRecord?.updatedBy || patient.updatedBy || '',
      gender: patient.gender,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
      identifyNumber: patient.identifyNumber, // May be encrypted from API
      testOrders: baseRecord?.testOrders || []
    };
  };

  

  const handleUpdateMedicalRecord = async (formData) => {
  try {
    if (!patientData?.medicalRecordId) {
      showToast('Medical record not found', 'error');
      return;
    }

    // Format dateOfBirth nếu cần
    let dateOfBirth = formData.dateOfBirth;
    if (dateOfBirth && typeof dateOfBirth === 'string' && dateOfBirth.includes('T')) {
      dateOfBirth = dateOfBirth.split('T')[0];
    }

    const updateData = {
      medicalRecordId: patientData.medicalRecordId,
      fullName: formData.fullName,
      dateOfBirth: dateOfBirth,
      gender: formData.gender,
      phoneNumber: formData.phoneNumber || '',
      email: formData.email || '',
      address: formData.address || '',
      identifyNumber: formData.identifyNumber,
    };

    await updateMedicalRecord(patientData.medicalRecordId, updateData);
    showToast('Medical record updated successfully!', 'success');
    await fetchPatientMedicalRecords();
    setIsEditModalOpen(false);
  } catch (err) {
    console.error('Error updating medical record:', err);
    showToast(
      err.response?.data?.message || err.message || 'Failed to update medical record',
      'error'
    );
  }
};

   const fetchPatientMedicalRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching medical records...');
      const records = await getAllMedicalRecords();
      console.log('Fetched medical records:', records);

      const numericPatientId = Number(patientId);
      const normalizedRecords = Array.isArray(records) ? records : [];

      const recordsById = normalizedRecords.filter((record) => record?.patientId !== undefined && Number(record.patientId) === numericPatientId);

      const normalizedEmail = patientFromNavigation?.email?.trim().toLowerCase();
      const recordsByEmail = !recordsById.length && normalizedEmail
        ? normalizedRecords.filter((record) => record?.email?.trim().toLowerCase() === normalizedEmail)
        : [];

      const normalizedPatientName = patientFromNavigation?.fullName?.trim().toLowerCase();
      const recordsByName = !recordsById.length && !recordsByEmail.length && normalizedPatientName
        ? normalizedRecords.filter((record) => record?.patientName?.trim().toLowerCase() === normalizedPatientName)
        : [];

      const candidateRecords =
        recordsById.length ? recordsById :
        recordsByEmail.length ? recordsByEmail :
        recordsByName;

      const sortedRecords = candidateRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Only get the latest record (1-1 relationship with patient)
      const latestRecord = sortedRecords[0];
      if (latestRecord) {
        let patientRecord = buildPatientDataFromRecord(latestRecord);
        
        // Medical record doesn't have identifyNumber, fetch it from Patient API
        try {
          console.log('Fetching all patients to get identifyNumber for patientId:', patientRecord.patientId);
          const allPatientsResponse = await getAllPatients();
          console.log('All patients from API:', allPatientsResponse);
          
          // getAllPatients returns {patients: Array, totalCount, ...}, we need the patients array
          const allPatients = allPatientsResponse.patients || allPatientsResponse;
          console.log('Patients array:', allPatients);
          
          const matchingPatient = allPatients.find(p => p.patientId === patientRecord.patientId);
          if (matchingPatient && matchingPatient.identifyNumber) {
            patientRecord.identifyNumber = matchingPatient.identifyNumber;
            console.log('Found matching patient with identifyNumber:', matchingPatient.identifyNumber);
          } else {
            console.warn('No matching patient found or identifyNumber missing for patientId:', patientRecord.patientId);
          }
        } catch (err) {
          console.warn('Could not fetch patients data:', err);
        }
        
        setPatientData(patientRecord);
        // Store all test orders for pagination
        setAllTestOrders(patientRecord.testOrders || []);
        return;
      }

      const fallbackPatient = buildPatientDataFromState(patientFromNavigation, null);

      if (fallbackPatient) {
        setPatientData(fallbackPatient);
        setAllTestOrders([]);
        return;
      }

      setPatientData(null);
      setAllTestOrders([]);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicalRecord = async () => {
    const numericPatientId = Number(patientId);
    if (!Number.isFinite(numericPatientId)) {
      showToast('Invalid patient identifier. Please go back and try again.', 'error');
      return;
    }

    // Get patient data from state or navigation
    const patient = patientData || patientFromNavigation;
    
    if (!patient) {
      showToast('Patient information not available. Please refresh the page.', 'error');
      return;
    }

    // Validate required fields
    if (!patient.identifyNumber || !patient.fullName || !patient.dateOfBirth || !patient.gender) {
      showToast('Patient information is incomplete. Please ensure all required fields are filled.', 'error');
      return;
    }

    try {
      setIsCreatingRecord(true);
      const createdBy = resolveCreatedBy(tokenPayload, user);

      // Format dateOfBirth to YYYY-MM-DD format
      let dateOfBirth = patient.dateOfBirth;
      if (dateOfBirth) {
        // If it's already in YYYY-MM-DD format, use it; otherwise convert
        if (typeof dateOfBirth === 'string' && dateOfBirth.includes('T')) {
          dateOfBirth = dateOfBirth.split('T')[0];
        } else if (dateOfBirth instanceof Date) {
          dateOfBirth = dateOfBirth.toISOString().split('T')[0];
        }
      }

      await createMedicalRecord({
        fullName: patient.fullName,
        dateOfBirth: dateOfBirth,
        gender: patient.gender,
        phoneNumber: patient.phoneNumber || '',
        email: patient.email || '',
        address: patient.address || '',
        identifyNumber: patient.identifyNumber,
        createIAMUser: true,
      });

      showToast('Medical record created successfully!', 'success');
      await fetchPatientMedicalRecords();
    } catch (err) {
      console.error('Error creating medical record:', err);
      showToast(
        err.response?.data?.message || err.message || 'Failed to create medical record.',
        'error'
      );
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleCreateTestOrder = (medicalRecord = null) => {
    setModalMode('create');
    // For create mode, we don't need selectedRecord - patientData is passed separately
    if (medicalRecord) {
      setSelectedRecord(medicalRecord);
    } else {
      setSelectedRecord(null); // Clear selected record for new test order
    }
    setIsModalOpen(true);
  };

  const handleEditTestOrder = (record) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleSubmitTestOrder = async (formData) => {
  try {
    console.log('Submitting test order with data:', formData);

    if (modalMode === 'create') {
      await createTestOrder(formData);
      showToast('Test order created successfully!', 'success');
    } else {
      await updateTestOrder(selectedRecord.testOrderId, formData);
      showToast('Test order updated successfully!', 'success');
    }

    await fetchPatientMedicalRecords();
    setIsModalOpen(false);
  } catch (error) {
    console.error('Error submitting test order:', error);
    showToast(
      error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.message || error.message || 'Failed to submit test order',
      'error'
    );
  }
};

  const handleDeleteTestOrder = async () => {
    try {
      if (selectedRecord?.testOrderId) {
        const response = await deleteTestOrder(selectedRecord.testOrderId);
        console.log('Test order deleted:', response);
        showToast('Test order deleted successfully!', 'success');
        
        // Close modal
        setIsModalOpen(false);
        
        // Refresh data after successful deletion
        await fetchPatientMedicalRecords();
      }
    } catch (error) {
      console.error('Error deleting test order:', error);
      showToast(
        error.response?.data?.message || error.message || 'Failed to delete test order. Please try again.',
        'error'
      );
      throw error;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Replace the formatDateTime function (around line 274-283)

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '-';
    }
    
    // Format: MM/DD/YYYY, HH:MM AM/PM
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true, // Use 12-hour format with AM/PM
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return '-';
  }
};

// Alternative: If you want to display in specific timezone (e.g., Vietnam UTC+7)
const formatDateTimeVN = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '-';
    }
    
    // Format for Vietnam timezone (UTC+7)
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24-hour format
      timeZone: 'Asia/Ho_Chi_Minh', // Vietnam timezone
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return '-';
  }
};

// Or if you want a cleaner format: "Nov 27, 2025 at 1:55 PM"
const formatDateTimeFriendly = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    // Format: "Nov 27, 2025 at 1:55 PM"
    const dateOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    
    const datePart = date.toLocaleDateString('en-US', dateOptions);
    const timePart = date.toLocaleTimeString('en-US', timeOptions);
    
    return `${datePart} at ${timePart}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

  const getStatusColor = (status) => {
    if (status === 'Reviewed By AI') {
      return 'bg-purple-100 text-purple-800';
    }
    if (status === 'Completed') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'In Progress' || status === 'Processing') {
      return 'bg-blue-100 text-blue-800';
    }
    if (status === 'Pending' || status === 'Created') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (status === 'Cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Test Orders Pagination logic
  const totalTestOrders = allTestOrders.length;
  const testOrdersTotalPages = Math.ceil(totalTestOrders / testOrdersPageSize);
  const testOrdersStartIndex = (testOrdersPage - 1) * testOrdersPageSize;
  const testOrdersEndIndex = testOrdersStartIndex + testOrdersPageSize;
  const paginatedTestOrders = allTestOrders.slice(testOrdersStartIndex, testOrdersEndIndex);
  const hasNextTestOrdersPage = testOrdersPage < testOrdersTotalPages;
  const hasPreviousTestOrdersPage = testOrdersPage > 1;

  const handleTestOrdersPageChange = (page) => {
    if (page >= 1 && page <= testOrdersTotalPages) {
      setTestOrdersPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTestOrdersPageSizeChange = (newPageSize) => {
    setTestOrdersPageSize(newPageSize);
    setTestOrdersPage(1);
  };

  const renderTestOrdersPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (testOrdersTotalPages <= maxVisiblePages) {
      for (let i = 1; i <= testOrdersTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (testOrdersPage <= 3) {
        pages.push(1, 2, 3, '...', testOrdersTotalPages);
      } else if (testOrdersPage >= testOrdersTotalPages - 2) {
        pages.push(1, '...', testOrdersTotalPages - 2, testOrdersTotalPages - 1, testOrdersTotalPages);
      } else {
        pages.push(1, '...', testOrdersPage - 1, testOrdersPage, testOrdersPage + 1, '...', testOrdersTotalPages);
      }
    }

    return pages;
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading medical records...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
              <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={fetchPatientMedicalRecords}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={handleCreateMedicalRecord}
                disabled={isCreatingRecord || loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreatingRecord ? 'Creating...' : 'New Medical Record'}
              </button>
              <button 
                onClick={() => navigate('/patients')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Patients
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patientData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              <p className="text-gray-900 font-semibold mb-2">No Medical Record Found</p>
              <p className="text-gray-600 text-sm">We couldn't find any medical record for this patient yet.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={handleCreateMedicalRecord}
                disabled={isCreatingRecord || loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreatingRecord ? 'Creating...' : 'Create Medical Record'}
              </button>
              {patientData?.medicalRecordId && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Edit className="w-4 h-4" />
                  Update Medical Record
                </button>
              )}
              <button 
                onClick={() => navigate('/patients')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Patients
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <div className="w-full">
          {/* Main Container */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
            {/* Back Button - Above Header */}
            <div className="border-b border-gray-200/80 px-6 py-3 bg-gray-50/30">
              <button 
                onClick={() => navigate('/patients')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="font-medium text-sm">Back to Patients</span>
              </button>
            </div>

            {/* Header Section */}
            <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 animate-slide-in-left">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Medical Record Information</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Patient details and medical record</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 animate-slide-in-right">
                  {patientData && !patientData.medicalRecordId && (
                    <button
                      onClick={handleCreateMedicalRecord}
                      disabled={isCreatingRecord || loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Plus className="w-4 h-4" />
                      {isCreatingRecord ? 'Creating...' : 'Create Medical Record'}
                    </button>
                  )}
                  {patientData?.medicalRecordId && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                    >
                      <Edit className="w-4 h-4" />
                      Update Medical Record
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Patient Information & Medical Record (Combined) */}
            <div className="border-b border-gray-200/80 px-6 py-5 bg-gradient-to-r from-blue-50/30 to-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Full Name</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{patientData.fullName}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Age</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{patientData.age} years</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Email</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-600" />
                    {patientData.email}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Gender</label>
  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">{patientData.gender || 'N/A'}</p>
</div>
<div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Phone Number</label>
  <p className="text-sm font-semibold text-gray-900 mt-1">{patientData.phoneNumber || 'N/A'}</p>
</div>
<div className="bg-white/60 rounded-lg p-3 border border-gray-200/50">
  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Address</label>
  <p className="text-sm font-semibold text-gray-900 mt-1">{patientData.address || 'N/A'}</p>
</div>
              </div>
            </div>

            {/* Test Orders Section */}
            <div className="overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <InlineLoader 
                    text="Loading medical records" 
                    size="large" 
                    theme="blue" 
                    centered={true}
                  />
                </div>
              ) : !patientData || !patientData.medicalRecordId ? (
                <div className="text-center py-16 animate-fade-in px-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-base font-medium">No medical record found</p>
                  <p className="text-gray-400 text-sm mt-1 mb-4">Create a medical record to start managing test orders</p>
                  <button
                    onClick={handleCreateMedicalRecord}
                    disabled={isCreatingRecord || loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    {isCreatingRecord ? 'Creating...' : 'Create Medical Record'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Test Orders Header */}
                  <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                          <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Test Orders</h3>
                          <p className="text-xs text-gray-500">Manage test orders for this patient</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleCreateTestOrder();
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
                      >
                        <Plus className="w-4 h-4" />
                        New Test Order
                      </button>
                    </div>
                  </div>

                  {/* Test Orders Table */}
                  {paginatedTestOrders.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <p className="text-gray-500 text-base">No test orders found</p>
                      <p className="text-gray-400 text-sm mt-1">Create a new test order to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-6 py-4">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Test Package
                                </th>
                                <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                                  Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Priority
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100/50">
                              {paginatedTestOrders.map((order, index) => {
                                const orderStatus = order.status || 'Created';
                                const orderPriority = order.priority || 'Normal';  // THÊM DÒNG NÀY
                                
                                return (
                                  <tr 
                                    key={order.testOrderId} 
                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group animate-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{order.testType || 'N/A'}</div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap w-24">
                                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${getStatusColor(orderStatus)}`}>
                                        {orderStatus}
                                      </span>
                                    </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${
                                        orderPriority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                        orderPriority === 'High' ? 'bg-orange-100 text-orange-800' :
                                        orderPriority === 'Normal' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {orderPriority}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setSelectedOrderId(order.testOrderId);
                                            setIsDetailModalOpen(true);
                                          }}
                                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-[5px] hover:from-blue-100 hover:to-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-blue-200/50 hover:border-blue-300"
                                          title="View Details & Test Results"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          View
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedRecord(patientData);
                                            handleEditTestOrder(order);
                                          }}
                                          className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-[5px] transition-colors"
                                          title="Edit Test Order"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Test Orders Pagination */}
                      {testOrdersTotalPages > 1 && (
                        <div className="border-t border-gray-200/80 px-6 py-4 bg-gray-50/30">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Show</span>
                              <select
                                value={testOrdersPageSize}
                                onChange={(e) => handleTestOrdersPageSizeChange(Number(e.target.value))}
                                className="border border-gray-300 rounded-[5px] px-2 py-1 text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              >
                                <option value={3}>3</option>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                              </select>
                              <span className="font-medium">entries</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">
                                {totalTestOrders > 0 ? testOrdersStartIndex + 1 : 0} - {Math.min(testOrdersEndIndex, totalTestOrders)} of {totalTestOrders.toLocaleString()}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleTestOrdersPageChange(testOrdersPage - 1)}
                                  disabled={!hasPreviousTestOrdersPage || testOrdersPage === 1}
                                  className="p-1.5 rounded-[5px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                                </button>

                                {renderTestOrdersPagination().map((page, index) => (
                                  page === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-sm">...</span>
                                  ) : (
                                    <button
                                      key={page}
                                      onClick={() => handleTestOrdersPageChange(page)}
                                      className={`px-2.5 py-1 text-sm rounded-[5px] transition-colors ${
                                        testOrdersPage === page
                                          ? 'bg-blue-600 text-white'
                                          : 'text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  )
                                ))}

                                <button
                                  onClick={() => handleTestOrdersPageChange(testOrdersPage + 1)}
                                  disabled={!hasNextTestOrdersPage || testOrdersPage === testOrdersTotalPages}
                                  className="p-1.5 rounded-[5px] hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Test Order Modal */}
        <TestOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitTestOrder}
          onDelete={handleDeleteTestOrder}
          mode={modalMode}
          initialData={selectedRecord}
          patientData={patientData}
        />

        {/* Test Order Detail Modal */}
        <TestOrderDetailModal
          testOrderId={selectedOrderId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrderId(null);
          }}
          onUpdate={() => {
            fetchPatientMedicalRecords();
          }}
        />
      </div>
      <MedicalRecordEditModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  onSubmit={handleUpdateMedicalRecord}
  initialData={patientData}
/>
    </DashboardLayout>
  );
}