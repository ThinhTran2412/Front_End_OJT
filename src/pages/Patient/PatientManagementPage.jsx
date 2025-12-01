import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Plus, Eye, AlertCircle, CheckCircle, X, Users } from 'lucide-react';
import PatientService from '../../services/PatientService';
import AddPatientModal from '../../components/modals/AddPatientModal';
import DashboardLayout from 'src/layouts/DashboardLayout';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';



export default function PatientManagementPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Main Container - Gộp tất cả vào một card, chiếm toàn bộ không gian */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 animate-slide-in-left">
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and track patient records</p>
                </div>
              </div>
              <div className="flex flex-col items-end animate-slide-in-right">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Patient</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72 group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by name, phone number, or email"
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium border border-transparent hover:border-gray-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-5 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md disabled:shadow-none"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleAddPatient}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Patient
              </button>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="border-b border-green-200/60 bg-gradient-to-r from-green-50 to-emerald-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-green-800 flex-1 font-medium">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage('')}
                className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-red-800 flex-1 font-medium">{error}</p>
            </div>
          )}

          {/* Table Section */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <InlineLoader 
                  text="Loading patients" 
                  size="large" 
                  theme="blue" 
                  centered={true}
                />
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">No patients found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ width: '250px' }}>
                          Full Name
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ width: '100px' }}>
                          Birthdate / Age
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider" style={{ width: '60px' }}>
                          Gender
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                          Phone Number
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100/50">
                      {patients.map((patient, index) => (
                        <tr 
                          key={patient.patientId} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap" style={{ width: '250px' }}>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                              <div className="text-sm text-gray-500">{patient.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '100px' }}>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formatDate(patient.dateOfBirth)}</div>
                              <div className="text-sm text-gray-500">{patient.age} years old</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900" style={{ width: '60px' }}>
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${
                              patient.gender === 'Male' 
                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200/50' 
                                : 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-800 border border-pink-200/50'
                            }`}>
                              {patient.gender}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
                            {patient.phoneNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 break-words whitespace-normal" title={patient.address}>
                            {patient.address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="text-xs text-gray-500">{formatDateTime(patient.createdAt)}</div>
                              <div className="text-xs text-gray-400">by {patient.createdBy}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleViewDetail(patient)}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-blue-200/50 hover:border-blue-300"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="border-t border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="font-medium">entries</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {totalCount > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPreviousPage || currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-gray-200"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>

                      {renderPagination().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-sm font-medium">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 font-semibold ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage || currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border border-transparent hover:border-gray-200"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
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