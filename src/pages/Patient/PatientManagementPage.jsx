import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Plus, Eye, AlertCircle, CheckCircle, X, ClipboardList } from 'lucide-react';
import PatientService from '../../services/PatientService';
import { createMedicalRecord } from '../../services/MedicalRecordService';
import AddPatientModal from '../../components/modals/AddPatientModal';
import DashboardLayout from 'src/layouts/DashboardLayout';
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

export default function PatientManagementPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [creatingRecordId, setCreatingRecordId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { accessToken, user } = useAuthStore();
  const tokenPayload = accessToken && typeof accessToken === 'string' && accessToken.includes('.')
    ? decodeJWT(accessToken)
    : null;

  useEffect(() => {
    fetchPatients();
  }, [currentPage, pageSize]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        pageNumber: currentPage,
        pageSize: pageSize,
        searchTerm: searchTerm.trim()
      };

      const response = await PatientService.getAllPatients(params);
      
      setPatients(response.patients || []);
      setTotalCount(response.totalCount || 0);
      setTotalPages(response.totalPages || 1);
      setHasNextPage(response.hasNextPage || false);
      setHasPreviousPage(response.hasPreviousPage || false);
      
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedicalRecord = async (patient) => {
    if (!patient?.patientId) {
      setError('Invalid patient information. Please refresh and try again.');
      return;
    }

    // Validate required fields
    if (!patient.identifyNumber || !patient.fullName || !patient.dateOfBirth || !patient.gender) {
      setError('Patient information is incomplete. Please ensure all required fields are filled.');
      return;
    }

    try {
      setCreatingRecordId(patient.patientId);
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

      const patientName = patient.fullName || `PAT-${String(patient.patientId).padStart(3, '0')}`;
      setSuccessMessage(`Medical record for ${patientName} created successfully!`);
      await fetchPatients();
    } catch (err) {
      console.error('Error creating medical record:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create medical record. Please try again.');
    } finally {
      setCreatingRecordId(null);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPatients();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setTimeout(() => fetchPatients(), 100);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewDetail = (patient) => {
    if (!patient?.patientId) {
      return;
    }

    navigate(`/patients/${patient.patientId}/medical-records`, {
      state: { patient }
    });
  };

  const handleAddPatient = () => {
    setIsAddModalOpen(true);
  };

  const handleAddPatientSuccess = async (data) => {
    try {
      const response = await PatientService.createPatientByIdentity(data);
      console.log('Patient added successfully:', response);
      
      setSuccessMessage(`Patient "${data.fullName || data.identifyNumber}" added successfully!`);
      
      // Refresh the patient list
      await fetchPatients();
      
      return response;
    } catch (error) {
      console.error('Error adding patient:', error);
      throw error;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
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

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Back to list</span>
            </button>
            <span className="mx-2">/</span>
            <button onClick={() => navigate('/dashboard')} className="hover:text-gray-900">
              Home
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Patients</span>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Management</h1>
              <p className="text-gray-600">Manage and view all registered patients in the laboratory system</p>
            </div>
            <button 
              onClick={handleAddPatient}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Patient
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patients
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name, Patient ID, phone number, or email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Clear Filters
              </button>
              <span className="text-gray-600 text-sm">
                Showing {totalCount.toLocaleString()} patients
              </span>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Apply Filters'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading patients...</p>
              </div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No patients found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient.patientId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          PAT-{String(patient.patientId).padStart(3, '0')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(patient.dateOfBirth)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.age}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            patient.gender === 'Male' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {patient.gender}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.phoneNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={patient.address}>
                          {patient.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="text-xs text-gray-500">{formatDateTime(patient.createdAt)}</div>
                            <div className="text-xs text-gray-400">by {patient.createdBy}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button 
                              onClick={() => handleViewDetail(patient)}
                              className="flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Detail
                            </button>
                            <button
                              onClick={() => handleCreateMedicalRecord(patient)}
                              disabled={creatingRecordId === patient.patientId || loading}
                              className="flex items-center gap-1 bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <ClipboardList className="w-4 h-4" />
                              {creatingRecordId === patient.patientId ? 'Creating...' : 'New Record'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-gray-700">entries per page</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                      Showing {totalCount > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()} entries
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPreviousPage || currentPage === 1}
                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {renderPagination().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage || currentPage === totalPages}
                        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddPatientSuccess}
      />
    </div>
    </DashboardLayout>
  );
}