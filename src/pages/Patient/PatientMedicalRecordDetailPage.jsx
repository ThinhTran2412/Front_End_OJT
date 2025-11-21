import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, User, Mail, Plus, ClipboardList, Edit } from 'lucide-react';
import { getAllMedicalRecords, createMedicalRecord } from '../../services/MedicalRecordService';
import { createTestOrder, updateTestOrder, deleteTestOrder } from '../../services/TestOrderService';
import TestOrderModal from '../../components/modals/TestOrderModal';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useToast, ToastContainer } from '../../components/Toast';
import { useAuthStore } from '../../store/authStore';

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
  
  // Toast hook
  const { toasts, showToast, removeToast } = useToast();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientMedicalRecords();
    }
  }, [patientId, patientFromNavigation?.fullName]);

  const buildPatientDataFromRecord = (record) => {
    if (!record) return null;

    return {
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
      identifyNumber: record.identifyNumber, // May be encrypted from API
      testOrders: record.testOrders || []
    };
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
      const latestRecord = sortedRecords[0];

      if (latestRecord) {
        setPatientData(buildPatientDataFromRecord(latestRecord));
        return;
      }

      const fallbackPatient = buildPatientDataFromState(patientFromNavigation, null);

      if (fallbackPatient) {
        setPatientData(fallbackPatient);
        return;
      }

      setPatientData(null);
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

  const handleCreateTestOrder = () => {
    setModalMode('create');
    setSelectedRecord(null);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Completed': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Created': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50">
        {/* Toast Container */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <button 
              onClick={() => navigate('/patients')}
              className="flex items-center hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Back to list</span>
            </button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/patients')} className="hover:text-gray-900">Patients</button>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{patientData.fullName}</span>
          </div>

          {/* Page Title */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Patient Medical Record</h1>
            <button
              onClick={handleCreateMedicalRecord}
              disabled={isCreatingRecord || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {isCreatingRecord ? 'Creating...' : 'New Medical Record'}
            </button>
          </div>

          {/* Patient Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
                  <p className="text-sm text-gray-500">Medical Record ID: {patientData.medicalRecordId}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Full Name</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{patientData.fullName}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Age</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{patientData.age} years</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  {patientData.email}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Created By</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{patientData.createdBy}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider">Created At</label>
                <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(patientData.createdAt)}</p>
              </div>
              {patientData.updatedAt && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(patientData.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test Orders Section */}
          {patientData?.testOrders && patientData.testOrders.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Test Orders</h2>
                    <p className="text-sm text-gray-500">{patientData.testOrders.length} order(s) found</p>
                  </div>
                </div>
                
                <button
                  onClick={handleCreateTestOrder}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Test Order
                </button>
              </div>

              {/* Test Orders List */}
              <div className="space-y-4">
                {patientData.testOrders.map((order) => (
                  <div key={order.testOrderId} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{order.orderCode}</h3>
                        <p className="text-xs text-gray-500 font-mono">{order.testOrderId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <button
                          onClick={() => handleEditTestOrder(order)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Test Order"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Priority</label>
                        <p className="text-sm font-medium text-gray-900">{order.priority}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Run Date</label>
                        <p className="text-sm font-medium text-gray-900">
                          {order.runDate && order.runDate !== "0001-01-01T00:00:00" 
                            ? formatDateTime(order.runDate) 
                            : "Not run yet"}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Run By</label>
                        <p className="text-sm font-medium text-gray-900">{order.runBy || "N/A"}</p>
                      </div>
                      
                      {order.note && (
                        <div className="md:col-span-2 lg:col-span-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Note</label>
                          <p className="text-sm text-gray-900">{order.note}</p>
                        </div>
                      )}
                      
                      {order.testResults && (
                        <div className="md:col-span-2 lg:col-span-4 bg-green-50 p-3 rounded-lg border border-green-200">
                          <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Test Results</label>
                          <p className="text-sm text-gray-900">{order.testResults}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Orders Found</h3>
              <p className="text-gray-500 mb-6">This patient doesn't have any test orders yet.</p>
              <button 
                onClick={handleCreateTestOrder}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create New Test Order
              </button>
            </div>
          )}
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
      </div>
    </DashboardLayout>
  );
}