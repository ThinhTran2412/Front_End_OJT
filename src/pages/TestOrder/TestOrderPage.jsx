import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Plus, Eye, AlertCircle, CheckCircle, X, ClipboardList, User, UserPlus, Settings, EyeOff } from 'lucide-react';
import api from '../../services/api';
import TestOrderDetailModal from '../../components/TestOrder_Management/TestOrderDetailModal';
import TestOrderModal from '../../components/modals/TestOrderModal';
import { createTestOrder } from '../../services/TestOrderService';
import { getAllPatients } from '../../services/PatientService';
import { useToast, ToastContainer } from '../../components/Toast';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function TestOrderPage() {
  const navigate = useNavigate();
  const [testOrders, setTestOrders] = useState([]);
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
  
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Patient search states
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  
  // Test Order Modal states
  const [isTestOrderModalOpen, setIsTestOrderModalOpen] = useState(false);
  const [testOrderModalMode, setTestOrderModalMode] = useState('create');
  
  // UI states
  const [showOrderId, setShowOrderId] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    fetchTestOrders();
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

  const fetchTestOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        pageSize: pageSize,
        search: searchTerm.trim()
      };

      const response = await api.get('/TestOrder/getList', { params });
      
      if (response.data) {
        const data = response.data;
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setTestOrders(data);
          setTotalCount(data.length);
          setTotalPages(Math.ceil(data.length / pageSize));
        } else if (data.items && Array.isArray(data.items)) {
          setTestOrders(data.items);
          setTotalCount(data.total || data.totalCount || data.items.length);
          setTotalPages(Math.ceil((data.total || data.totalCount || data.items.length) / pageSize));
        } else {
          setTestOrders([]);
          setTotalCount(0);
          setTotalPages(1);
        }
        
        setHasNextPage(currentPage < totalPages);
        setHasPreviousPage(currentPage > 1);
      } else {
        setTestOrders([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching test orders:', err);
      setError('Failed to load test orders. Please try again.');
      setTestOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTestOrders();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
    setTimeout(() => fetchTestOrders(), 100);
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

  // Hoặc sửa hàm handleCreateNew để load ngay:
const handleCreateNew = async () => {
  setShowPatientSearch(true);
  setPatientSearchTerm('');
  setSelectedPatient(null);
  
  // Load tất cả patients ngay khi mở popup
  setIsSearchingPatients(true);
  try {
    const results = await getAllPatients({
      pageNumber: 1,
      pageSize: 50,
      searchTerm: '' // Load all
    });
    setSearchedPatients(results.patients || []);
  } catch (error) {
    console.error('Error loading patients:', error);
    setSearchedPatients([]);
  } finally {
    setIsSearchingPatients(false);
  }
};

  const handlePatientSearch = async () => {
    if (!patientSearchTerm.trim()) {
      setSearchedPatients([]);
      return;
    }

    setIsSearchingPatients(true);
    try {
      // Sử dụng getAllPatients với search term (giống như trang Patient Management)
      const results = await getAllPatients({
        pageNumber: 1,
        pageSize: 50, // Lấy nhiều hơn để có kết quả tốt hơn
        searchTerm: patientSearchTerm.trim()
      });
      setSearchedPatients(results.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      showToast('Failed to search patients. Please try again.', 'error');
      setSearchedPatients([]);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
    setIsTestOrderModalOpen(true);
    setTestOrderModalMode('create');
  };

  const handleCreateNewPatient = () => {
    setSelectedPatient(null); // Không có patient data để auto-fill
    setShowPatientSearch(false);
    setIsTestOrderModalOpen(true);
    setTestOrderModalMode('create_new_patient'); // Mode mới để phân biệt
  };

  const handleSubmitTestOrder = async (formData) => {
    try {
      await createTestOrder(formData);
      showToast('Test order created successfully!', 'success');
      setIsTestOrderModalOpen(false);
      setSelectedPatient(null);
      fetchTestOrders(); // Refresh the list
    } catch (error) {
      console.error('Error creating test order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create test order';
      showToast(errorMessage, 'error');
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleViewDetail = (order) => {
    if (!order?.testOrderId) {
      return;
    }
    setSelectedOrderId(order.testOrderId);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Reviewed By AI':
        return 'bg-gradient-to-r from-purple-100 to-purple-50/50 text-purple-800 border border-purple-200/50';
      case 'Completed':
        return 'bg-gradient-to-r from-green-100 to-green-50/50 text-green-800 border border-green-200/50';
      case 'In Progress':
      case 'Processing':
        return 'bg-gradient-to-r from-blue-100 to-blue-50/50 text-blue-800 border border-blue-200/50';
      case 'Pending':
      case 'Created':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50/50 text-yellow-800 border border-yellow-200/50';
      case 'Cancelled':
        return 'bg-gradient-to-r from-red-100 to-red-50/50 text-red-800 border border-red-200/50';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-50/50 text-gray-800 border border-gray-200/50';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === '0001-01-01T00:00:00') return 'N/A';
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
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Main Container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 animate-slide-in-left">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Test Orders Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and track laboratory test orders</p>
                </div>
              </div>
              <div className="flex flex-col items-end animate-slide-in-right">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
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
                    placeholder="Search by patient name, order code, or status"
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
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <InlineLoader size="small" text="" theme="blue" centered={false} />
                        Searching...
                      </div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create New Order
              </button>
            </div>
          </div>

          {/* Patient Search Modal */}
          {showPatientSearch && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-screen items-center justify-center p-4">
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                  onClick={() => setShowPatientSearch(false)}
                />
                
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  {/* Header */}
                  <div className="bg-white flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Find Patient</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Search by identify number, name, or email to create a test order
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPatientSearch(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handlePatientSearch()}
                        placeholder="Enter identify number, name, or email..."
                        className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={handlePatientSearch}
                        disabled={isSearchingPatients || !patientSearchTerm.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search className="w-4 h-4" />
                        {isSearchingPatients ? 'Searching...' : 'Search'}
                      </button>
                      <button
                        onClick={handleCreateNewPatient}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create New Patient
                      </button>
                    </div>
                  </div>

                  {/* Search Results */}
                  <div className="p-6 max-h-96 overflow-y-auto">
                    {isSearchingPatients ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600">Searching patients...</p>
                      </div>
                    ) : searchedPatients.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Found {searchedPatients.length} patient(s)
                        </h3>
                        {searchedPatients.map((patient) => (
                          <div
                            key={patient.patientId}
                            onClick={() => handleSelectPatient(patient)}
                            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{patient.fullName}</h4>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    ID: {patient.identifyNumber}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span>{patient.email}</span>
                                  {patient.phoneNumber && (
                                    <span className="ml-3">• {patient.phoneNumber}</span>
                                  )}
                                  {patient.age && (
                                    <span className="ml-3">• {patient.age} years old</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : patientSearchTerm.trim() && !isSearchingPatients ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No patients found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Try a different search term or create a new patient
                        </p>
                        <button
                          onClick={handleCreateNewPatient}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                        >
                          <UserPlus className="w-4 h-4" />
                          Create New Patient
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">Search for a patient</p>
                        <p className="text-gray-400 text-sm mt-1">
                          Enter identify number, name, or email to find existing patients
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  text="Loading test orders" 
                  size="large" 
                  theme="blue" 
                  centered={true}
                />
              </div>
            ) : testOrders.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">No test orders found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters or create a new order</p>
              </div>
            ) : (
              <>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                      <tr>
                        <th className={`px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider transition-all duration-300 ${showOrderId ? 'w-44' : 'w-48'}`}>
                          Patient Info
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                          Age / Gender
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                          Phone Number
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                          Status
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                          Priority
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-36">
                          Created At
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100/50">
                      {testOrders.map((order, index) => (
                        <tr 
                          key={order.testOrderId} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className={`px-4 py-4 whitespace-nowrap transition-all duration-300 ${showOrderId ? 'w-44' : 'w-48'}`}>
                            <div>
                              <div className="text-sm font-medium text-gray-900 truncate" title={order.patientName}>
                                {order.patientName}
                              </div>
                              {order.note && (
                                <div className="text-xs text-gray-500 truncate" title={order.note}>
                                  Note: {order.note}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-24">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-900">{order.age}</div>
                              <div className="text-xs text-gray-500 capitalize">{order.gender?.toLowerCase()}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
                            <div className="truncate" title={order.phoneNumber}>
                              {order.phoneNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-28">
                            <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-20 text-center">
                            {order.priority && order.priority.trim() ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200/50">
                                {order.priority}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Normal</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-36">
                            <div className="text-xs text-gray-600">
                              {formatDateTime(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm w-28">
                            <div className="flex items-center justify-center">
                              <button 
                                onClick={() => handleViewDetail(order)}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-blue-200/50 hover:border-blue-300"
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

        {/* Test Order Detail Modal */}
        <TestOrderDetailModal
          testOrderId={selectedOrderId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrderId(null);
          }}
          onUpdate={() => {
            fetchTestOrders();
          }}
        />

        {/* Test Order Creation Modal */}
        <TestOrderModal
          isOpen={isTestOrderModalOpen}
          mode={testOrderModalMode}
          patientData={selectedPatient}
          onClose={() => {
            setIsTestOrderModalOpen(false);
            setSelectedPatient(null);
          }}
          onSubmit={handleSubmitTestOrder}
        />
      </div>
    </DashboardLayout>
  );
}