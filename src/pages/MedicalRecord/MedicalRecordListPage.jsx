import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, FileText, Users, CalendarDays, ClipboardList, Download, Grid3x3, List, Square, CheckSquare2, CheckCircle, ChevronDown, ChevronUp, FileDown, Loader2, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { RingSpinner, InlineLoader } from '../../components/Loading';
import { getAllMedicalRecords } from '../../services/MedicalRecordService';
import { startExportJob } from '../../services/TestOrderService';
import { exportTestResultsToPdf, getTestResultsByTestOrderId } from '../../services/TestResultService';
import jobManager from '../../utils/BackgroundJobManager';
import { useAuthStore } from '../../store/authStore';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeRecords = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((record) => ({
    ...record,
    patientId: record.patientId || record.PatientId,
    patientName: record.patientName || record.PatientName || 'Unknown patient',
    dateOfBirth:
      !record.dateOfBirth || record.dateOfBirth === '0001-01-01'
        ? null
        : record.dateOfBirth,
    age: typeof record.age === 'number' && record.age >= 0 ? record.age : null,
    gender: record.gender?.toLowerCase() === 'female' ? 'Female' : 'Male',
    email: record.email || 'N/A',
    phoneNumber: record.phoneNumber || 'N/A',
    address: record.address || 'N/A',
    createdBy: record.createdBy || 'System',
    testOrders: Array.isArray(record.testOrders) ? record.testOrders : [],
  }));
};

export default function MedicalRecordListPage() {
  const { isAuthenticated } = useAuthStore();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecords, setExpandedRecords] = useState(new Set());
  const [expandedOrders, setExpandedOrders] = useState(new Set()); // Track expanded test orders
  const [selectedOrders, setSelectedOrders] = useState({}); // { recordId: Set of orderIds }
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [exporting, setExporting] = useState({}); // { recordId: boolean }
  const [testResults, setTestResults] = useState({}); // { testOrderId: [results] }
  const [loadingResults, setLoadingResults] = useState(new Set());
  const [exportingPdf, setExportingPdf] = useState(new Set());

  const [isReadOnlyUser, setIsReadOnlyUser] = useState(false);

  const [currentRecordPage, setCurrentRecordPage] = useState(1);
  const recordsPerPage = 4;

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;

    const normalizedTerm = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      return [
        record.patientName,
        record.email,
        record.phoneNumber,
        record.address,
        record.createdBy,
        String(record.medicalRecordId),
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(normalizedTerm));
    });
  }, [records, searchTerm]);

  const paginatedRecords = useMemo(() => {
  const startIndex = (currentRecordPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, currentRecordPage]);

  const totalRecordPages = Math.ceil(filteredRecords.length / recordsPerPage);

  const handleRecordPageChange = (newPage) => {
    setCurrentRecordPage(newPage);
    // Scroll to top of table when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentRecordPage(1);
  }, [searchTerm]);

  // Thêm state cho pagination
const [orderPagination, setOrderPagination] = useState({}); // { recordId: currentPage }

// Thêm hàm helper cho pagination
const getPagedOrders = (orders, recordId) => {
  const itemsPerPage = 6;
  const currentPage = orderPagination[recordId] || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedOrders = orders.slice(startIndex, endIndex);
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  
  return { pagedOrders, currentPage, totalPages };
};

const handlePageChange = (recordId, newPage) => {
  setOrderPagination(prev => ({
    ...prev,
    [recordId]: newPage
  }));
};

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
    } catch {
      return null;
    }
  };

  const resolveUserContext = () => {
    const accessToken = localStorage.getItem('accessToken');
    const storedUserRaw = localStorage.getItem('user');
    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

    const payload = accessToken ? decodeJWT(accessToken) : null;

    const jwtEmail = payload?.email || payload?.Email || null;
    const localEmail = storedUser?.email || storedUser?.Email || null;

    let rawPrivileges =
      payload?.privilege ||
      payload?.privileges ||
      payload?.Privilege ||
      payload?.Privileges ||
      storedUser?.privileges ||
      storedUser?.Privilege ||
      storedUser?.Privileges ||
      [];

    if (typeof rawPrivileges === 'string') rawPrivileges = [rawPrivileges];
    if (!Array.isArray(rawPrivileges)) rawPrivileges = [];

    const hasViewUserPrivilege = rawPrivileges.includes('VIEW_USER');

    return {
      email: (jwtEmail || localEmail || '').toLowerCase(),
      hasViewUserPrivilege,
    };
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const { hasViewUserPrivilege } = resolveUserContext();
    setIsReadOnlyUser(!hasViewUserPrivilege);
    fetchRecords();
  }, [isAuthenticated]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllMedicalRecords();
      const normalized = normalizeRecords(data);

      const { email, hasViewUserPrivilege } = resolveUserContext();

      // Staff / lab users with VIEW_USER privilege see all records
      if (hasViewUserPrivilege) {
        setRecords(normalized);
      } else {
        // Default user: only see their own medical records (readonly)
        const filtered = email
          ? normalized.filter(
              (record) =>
                record.email?.toLowerCase() === email ||
                record.createdBy?.toLowerCase() === email
            )
          : [];
        setRecords(filtered);
      }
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load medical records. Please try again.'
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalRecords = records.length;
    const uniquePatients = new Set(records.map((record) => record.patientName)).size;
    const today = new Date();
    const createdToday = records.filter((record) => {
      const createdAt = new Date(record.createdAt);
      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getUTCFullYear() === today.getUTCFullYear() &&
        createdAt.getUTCMonth() === today.getUTCMonth() &&
        createdAt.getUTCDate() === today.getUTCDate()
      );
    }).length;

    return {
      totalRecords,
      uniquePatients,
      createdToday,
    };
  }, [records]);

  const toggleExpandRecord = (recordId) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleSelectOrder = (recordId, orderId) => {
    setSelectedOrders(prev => {
      const newSelected = { ...prev };
      if (!newSelected[recordId]) {
        newSelected[recordId] = new Set();
      }
      const orderSet = new Set(newSelected[recordId]);
      if (orderSet.has(orderId)) {
        orderSet.delete(orderId);
      } else {
        orderSet.add(orderId);
      }
      newSelected[recordId] = orderSet;
      return newSelected;
    });
  };

  const handleSelectAllOrders = (recordId, testOrders) => {
    const allOrderIds = testOrders.map(o => o.testOrderId || o.TestOrderId);
    const currentSelected = selectedOrders[recordId] || new Set();
    const allSelected = allOrderIds.length > 0 && allOrderIds.every(id => currentSelected.has(id));
    
    setSelectedOrders(prev => {
      const newSelected = { ...prev };
      if (allSelected) {
        newSelected[recordId] = new Set();
      } else {
        newSelected[recordId] = new Set(allOrderIds);
      }
      return newSelected;
    });
  };

  const handleExportExcel = async (recordId, patientId, patientName) => {
    try {
      setExporting(prev => ({ ...prev, [recordId]: true }));
      
      // Try to get patientId from record if not provided
      const record = records.find(r => r.medicalRecordId === recordId);
      const finalPatientId = patientId || record?.patientId;
      
      if (!finalPatientId) {
        alert('Patient ID not available. Cannot export test orders.');
        return;
      }
      
      const selectedIds = selectedOrders[recordId] && selectedOrders[recordId].size > 0
        ? Array.from(selectedOrders[recordId])
        : null;

      const sanitizedName = (patientName || 'Patient').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
      const fileName = selectedIds && selectedIds.length > 0
        ? `Test Orders-${sanitizedName}-${selectedIds.length} orders-${new Date().toISOString().split('T')[0]}.xlsx`
        : `Test Orders-${sanitizedName}-${new Date().toISOString().split('T')[0]}.xlsx`;

      await startExportJob(finalPatientId, selectedIds, fileName);
      
      // Clear selection after export
      setSelectedOrders(prev => {
        const newSelected = { ...prev };
        newSelected[recordId] = new Set();
        return newSelected;
      });
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start export. Please try again.';
      alert(errorMessage);
    } finally {
      setExporting(prev => ({ ...prev, [recordId]: false }));
    }
  };

  const toggleExpandOrder = async (testOrderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testOrderId)) {
        newSet.delete(testOrderId);
      } else {
        newSet.add(testOrderId);
        // Fetch test results if not already loaded
        if (!testResults[testOrderId]) {
          fetchTestResults(testOrderId);
        }
      }
      return newSet;
    });
  };

  const fetchTestResults = async (testOrderId) => {
    try {
      setLoadingResults(prev => new Set(prev).add(testOrderId));
      const results = await getTestResultsByTestOrderId(testOrderId);
      setTestResults(prev => ({
        ...prev,
        [testOrderId]: Array.isArray(results) ? results : []
      }));
    } catch (error) {
      console.warn('Test results not available via API:', error);
      setTestResults(prev => ({
        ...prev,
        [testOrderId]: []
      }));
    } finally {
      setLoadingResults(prev => {
        const newSet = new Set(prev);
        newSet.delete(testOrderId);
        return newSet;
      });
    }
  };

  const handleExportPdf = async (testOrderId, patientName, e) => {
    e.stopPropagation();
    
    try {
      setExportingPdf(prev => new Set(prev).add(testOrderId));
      
      const sanitizedName = patientName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s+/g, '-');
      
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      const fileName = `Detail-${sanitizedName}-${dateStr}`;
      
      await exportTestResultsToPdf(testOrderId, fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      const errorMessage = error.message || 'Failed to export PDF. Please try again.';
      alert(errorMessage);
    } finally {
      setExportingPdf(prev => {
        const newSet = new Set(prev);
        newSet.delete(testOrderId);
        return newSet;
      });
    }
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

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Main Container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 animate-slide-in-left">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Medical Records</h1>
                  <p className="text-xs text-gray-500 mt-0.5">View and manage all patient medical records</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end animate-slide-in-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Records</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {summary.totalRecords.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchRecords}
                  disabled={loading}
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed font-medium text-sm"
                >
                  <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards */}
{!isReadOnlyUser && (
  <div className="px-6 py-4 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-white">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Records</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalRecords}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200/60 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Created Today</p>
            <p className="text-xl font-bold text-gray-900">{summary.createdToday}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

          {/* Search Section */}
          <div className="px-6 py-4 border-b border-gray-200/60 bg-white">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by patient name, contact, creator..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="text-gray-900 font-semibold">{filteredRecords.length}</span> of{' '}
                <span className="text-gray-900 font-semibold">{records.length}</span> records
              </div>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="mx-6 mb-4 rounded-lg border-2 border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-800 px-4 py-3 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <span className="font-semibold block mb-1 text-sm">Error:</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <InlineLoader 
                  text="Loading medical records" 
                  size="large" 
                  theme="purple" 
                  centered={true}
                />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">No medical records found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters or refresh the list</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Record ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Test Orders
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/80 divide-y divide-gray-200">
                      {paginatedRecords.map((record) => (
                        <>
                        <tr key={record.medicalRecordId} className="hover:bg-purple-50/50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            MR-{String(record.medicalRecordId).padStart(4, '0')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{record.patientName}</p>
                              <p className="text-xs text-gray-500">
                                DOB: {record.dateOfBirth ? formatDate(record.dateOfBirth) : 'N/A'}
                                {record.age ? ` · ${record.age} yrs` : ''}
                              </p>
                              <p className="text-xs text-gray-500 capitalize">Gender: {record.gender}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col gap-1">
                              <span>{record.phoneNumber}</span>
                              <span className="text-xs text-blue-600 break-all">{record.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <span className="line-clamp-2" title={record.address}>
                              {record.address}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span>{formatDateTime(record.createdAt)}</span>
                              {record.updatedAt && (
                                <span className="text-xs text-gray-500">
                                  Updated {formatDateTime(record.updatedAt)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.createdBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                {record.testOrders.length}
                              </span>
                              {record.testOrders.length > 0 && (
                                <button
                                  onClick={() => toggleExpandRecord(record.medicalRecordId)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title={expandedRecords.has(record.medicalRecordId) ? 'Hide test orders' : 'Show test orders'}
                                >
                                  {expandedRecords.has(record.medicalRecordId) ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Test Orders Section - Complete Version with Pagination */}
                        {expandedRecords.has(record.medicalRecordId) && record.testOrders.length > 0 && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50">
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
                                {/* Header Section */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                      <ClipboardList className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">Test Orders</h3>
                                      <p className="text-sm text-gray-500">
                                        {record.testOrders.length} order(s) found
                                        {selectedOrders[record.medicalRecordId]?.size > 0 && ` • ${selectedOrders[record.medicalRecordId].size} selected`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {record.testOrders.length > 0 && (
                                      <>
                                        {/* View Mode Toggle */}
                                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                                          <button
                                            onClick={() => setViewMode('card')}
                                            className={`p-2 rounded transition-colors ${
                                              viewMode === 'card' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="Card View"
                                          >
                                            <Grid3x3 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded transition-colors ${
                                              viewMode === 'list' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                            title="List View"
                                          >
                                            <List className="w-4 h-4" />
                                          </button>
                                        </div>
                                        
                                        {/* Export Excel Button */}
                                        <button
                                          onClick={() => handleExportExcel(record.medicalRecordId, record.patientId, record.patientName)}
                                          disabled={exporting[record.medicalRecordId]}
                                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Export to Excel"
                                        >
                                          <Download className="w-5 h-5" />
                                          {exporting[record.medicalRecordId] 
                                            ? 'Starting...' 
                                            : selectedOrders[record.medicalRecordId]?.size > 0 
                                              ? `Export ${selectedOrders[record.medicalRecordId].size} Selected`
                                              : 'Export All Excel'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Select All (for list view only) */}
                                {record.testOrders.length > 0 && viewMode === 'list' && (
                                  <div className="mb-4 flex items-center gap-2 pb-3 border-b">
                                    <button
                                      onClick={() => handleSelectAllOrders(record.medicalRecordId, record.testOrders)}
                                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                                    >
                                      {(selectedOrders[record.medicalRecordId]?.size === record.testOrders.length) ? (
                                        <CheckSquare2 className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <Square className="w-5 h-5 text-gray-400" />
                                      )}
                                      <span>Select All</span>
                                    </button>
                                  </div>
                                )}

                                {/* Test Orders Display with Pagination */}
                                {(() => {
                                  const { pagedOrders, currentPage, totalPages } = getPagedOrders(record.testOrders, record.medicalRecordId);
                                  
                                  return (
                                    <>
                                      {viewMode === 'card' ? (
                                        /* ==================== CARD VIEW ==================== */
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {pagedOrders.map((order) => {
                                            const testOrderId = order.testOrderId || order.TestOrderId;
                                            const orderCode = order.orderCode || order.OrderCode;
                                            const status = order.status || order.Status;
                                            const isSelected = selectedOrders[record.medicalRecordId]?.has(testOrderId);
                                            const isExpanded = expandedOrders.has(testOrderId);
                                            const orderTestResults = testResults[testOrderId] || [];
                                            const hasResults = orderTestResults.length > 0 || order.testResults || order.TestResults;
                                            const isLoadingResults = loadingResults.has(testOrderId);
                                            const isExportingPdf = exportingPdf.has(testOrderId);
                                            
                                            return (
                                              <div 
                                                key={testOrderId} 
                                                className={`border-2 rounded-lg transition-all ${
                                                  isSelected 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                                }`}
                                              >
                                                {/* Card Header */}
                                                <div 
                                                  className="p-4 cursor-pointer"
                                                  onClick={() => handleSelectOrder(record.medicalRecordId, testOrderId)}
                                                >
                                                  <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                      {isSelected ? (
                                                        <CheckSquare2 className="w-5 h-5 text-blue-600" />
                                                      ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                      )}
                                                      <div>
                                                        <h4 className="text-sm font-semibold text-gray-900">{orderCode || 'N/A'}</h4>
                                                        <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{testOrderId}</p>
                                                      </div>
                                                    </div>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                                                      {status || 'N/A'}
                                                    </span>
                                                  </div>
                                                  <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                      <span className="text-gray-500">Priority:</span>
                                                      <span className="font-medium">{order.priority || order.Priority || 'N/A'}</span>
                                                    </div>
                                                    {hasResults && (
                                                      <div className="flex items-center gap-1 text-xs text-green-600">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>{orderTestResults.length > 0 ? `${orderTestResults.length} Results` : 'Has Results'}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Card Actions */}
                                                {hasResults && (
                                                  <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-200">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpandOrder(testOrderId);
                                                      }}
                                                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                      {isExpanded ? (
                                                        <>
                                                          <ChevronUp className="w-4 h-4" />
                                                          Hide Results
                                                        </>
                                                      ) : (
                                                        <>
                                                          <ChevronDown className="w-4 h-4" />
                                                          View Results
                                                        </>
                                                      )}
                                                    </button>
                                                    <button
                                                      onClick={(e) => handleExportPdf(testOrderId, record.patientName, e)}
                                                      disabled={isExportingPdf}
                                                      className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                      title="Export PDF"
                                                    >
                                                      {isExportingPdf ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                      ) : (
                                                        <FileDown className="w-4 h-4" />
                                                      )}
                                                      PDF
                                                    </button>
                                                  </div>
                                                )}

                                                {/* Expanded Results */}
                                                {isExpanded && hasResults && (
                                                  <div className="px-4 pb-4 border-t border-gray-200">
                                                    {isLoadingResults ? (
                                                      <div className="py-4 flex items-center justify-center">
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                                        <span className="ml-2 text-xs text-gray-600">Loading results...</span>
                                                      </div>
                                                    ) : orderTestResults.length > 0 ? (
                                                      <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                                                        <div className="text-xs font-semibold text-gray-700 mb-2">Test Results:</div>
                                                        <div className="space-y-2">
                                                          {orderTestResults.map((result, idx) => (
                                                            <div 
                                                              key={result.testResultId || idx}
                                                              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100"
                                                            >
                                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                  <span className="text-gray-500">Parameter:</span>
                                                                  <p className="font-semibold text-gray-900">{result.parameter || result.Parameter || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-500">Value:</span>
                                                                  <p className="font-bold text-blue-700">
                                                                    {result.valueText || result.ValueText || 
                                                                    (result.valueNumeric !== undefined && result.valueNumeric !== null 
                                                                      ? result.valueNumeric.toFixed(2) 
                                                                      : result.ValueNumeric !== undefined && result.ValueNumeric !== null
                                                                        ? result.ValueNumeric.toFixed(2)
                                                                        : 'N/A')}
                                                                  </p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-500">Unit:</span>
                                                                  <p className="text-gray-900">{result.unit || result.Unit || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                  <span className="text-gray-500">Status:</span>
                                                                  <p className={`font-medium ${
                                                                    (result.resultStatus || result.ResultStatus)?.toLowerCase() === 'completed' 
                                                                      ? 'text-green-600' 
                                                                      : 'text-gray-600'
                                                                  }`}>
                                                                    {result.resultStatus || result.ResultStatus || 'N/A'}
                                                                  </p>
                                                                </div>
                                                                {(result.referenceRange || result.ReferenceRange) && (
                                                                  <div className="col-span-2">
                                                                    <span className="text-gray-500">Reference Range:</span>
                                                                    <p className="text-gray-900">{result.referenceRange || result.ReferenceRange}</p>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="py-4 text-center">
                                                        <div className="text-xs text-gray-500 mb-2">
                                                          Detailed test results are not available for viewing online.
                                                        </div>
                                                        <div className="text-xs text-blue-600 font-medium">
                                                          Please export PDF to view complete test results.
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        /* ==================== LIST VIEW ==================== */
                                        <div className="space-y-2">
                                          {pagedOrders.map((order) => {
                                            const testOrderId = order.testOrderId || order.TestOrderId;
                                            const orderCode = order.orderCode || order.OrderCode;
                                            const status = order.status || order.Status;
                                            const isSelected = selectedOrders[record.medicalRecordId]?.has(testOrderId);
                                            const isExpanded = expandedOrders.has(testOrderId);
                                            const orderTestResults = testResults[testOrderId] || [];
                                            const hasResults = orderTestResults.length > 0 || order.testResults || order.TestResults;
                                            const isLoadingResults = loadingResults.has(testOrderId);
                                            const isExportingPdf = exportingPdf.has(testOrderId);
                                            
                                            return (
                                              <div 
                                                key={testOrderId} 
                                                className={`border-2 rounded-lg transition-all ${
                                                  isSelected 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                              >
                                                {/* List Item Header */}
                                                <div className="p-4">
                                                  <div className="flex items-center gap-4">
                                                    <button
                                                      onClick={() => handleSelectOrder(record.medicalRecordId, testOrderId)}
                                                      className="flex-shrink-0"
                                                    >
                                                      {isSelected ? (
                                                        <CheckSquare2 className="w-5 h-5 text-blue-600" />
                                                      ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                      )}
                                                    </button>
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                                                      <div>
                                                        <p className="text-xs text-gray-500">Order Code</p>
                                                        <p className="text-sm font-semibold">{orderCode || 'N/A'}</p>
                                                        <p className="text-xs text-gray-400 font-mono">{testOrderId}</p>
                                                      </div>
                                                      <div>
                                                        <p className="text-xs text-gray-500">Status</p>
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                                                          {status || 'N/A'}
                                                        </span>
                                                      </div>
                                                      <div>
                                                        <p className="text-xs text-gray-500">Priority</p>
                                                        <p className="text-sm font-medium">{order.priority || order.Priority || 'N/A'}</p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  
                                                  {/* List Item Actions */}
                                                  {hasResults && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                          <div className="bg-green-50 p-2 rounded text-xs flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                            <span className="text-gray-500">Results: </span>
                                                            <span className="text-gray-900">
                                                              {orderTestResults.length > 0 ? `${orderTestResults.length} test results` : 'Available'}
                                                            </span>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-3">
                                                          <button
                                                            onClick={() => toggleExpandOrder(testOrderId)}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                          >
                                                            {isExpanded ? (
                                                              <>
                                                                <ChevronUp className="w-4 h-4" />
                                                                Hide
                                                              </>
                                                            ) : (
                                                              <>
                                                                <ChevronDown className="w-4 h-4" />
                                                                View
                                                              </>
                                                            )}
                                                          </button>
                                                          <button
                                                            onClick={(e) => handleExportPdf(testOrderId, record.patientName, e)}
                                                            disabled={isExportingPdf}
                                                            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Export PDF"
                                                          >
                                                            {isExportingPdf ? (
                                                              <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                              <FileDown className="w-4 h-4" />
                                                            )}
                                                            PDF
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>

                                                {/* Expanded Results */}
                                                {isExpanded && hasResults && (
                                                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                                                    {isLoadingResults ? (
                                                      <div className="py-4 flex items-center justify-center">
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                                        <span className="ml-2 text-xs text-gray-600">Loading results...</span>
                                                      </div>
                                                    ) : orderTestResults.length > 0 ? (
                                                      <div className="mt-3 space-y-3">
                                                        <div className="text-sm font-semibold text-gray-700 mb-3">Test Results ({orderTestResults.length}):</div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                                          {orderTestResults.map((result, idx) => (
                                                            <div 
                                                              key={result.testResultId || idx}
                                                              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 shadow-sm"
                                                            >
                                                              <div className="space-y-2">
                                                                <div className="flex items-start justify-between">
                                                                  <div className="flex-1">
                                                                    <span className="text-xs text-gray-500">Parameter</span>
                                                                    <p className="text-sm font-semibold text-gray-900">{result.parameter || result.Parameter || 'N/A'}</p>
                                                                  </div>
                                                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    (result.resultStatus || result.ResultStatus)?.toLowerCase() === 'completed' 
                                                                      ? 'bg-green-100 text-green-700' 
                                                                      : 'bg-gray-100 text-gray-600'
                                                                  }`}>
                                                                    {result.resultStatus || result.ResultStatus || 'N/A'}
                                                                  </span>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                  <div>
                                                                    <span className="text-xs text-gray-500">Value</span>
                                                                    <p className="text-base font-bold text-blue-700">
                                                                      {result.valueText || result.ValueText || 
                                                                      (result.valueNumeric !== undefined && result.valueNumeric !== null 
                                                                        ? result.valueNumeric.toFixed(2) 
                                                                        : result.ValueNumeric !== undefined && result.ValueNumeric !== null
                                                                          ? result.ValueNumeric.toFixed(2)
                                                                          : 'N/A')}
                                                                    </p>
                                                                  </div>
                                                                  <div>
                                                                    <span className="text-xs text-gray-500">Unit</span>
                                                                    <p className="text-sm font-medium text-gray-900">{result.unit || result.Unit || 'N/A'}</p>
                                                                  </div>
                                                                </div>
                                                                {(result.referenceRange || result.ReferenceRange) && (
                                                                  <div className="pt-2 border-t border-blue-200">
                                                                    <span className="text-xs text-gray-500">Reference Range</span>
                                                                    <p className="text-xs font-medium text-gray-700">{result.referenceRange || result.ReferenceRange}</p>
                                                                  </div>
                                                                )}
                                                              </div>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="py-4 text-center">
                                                        <div className="text-xs text-gray-500 mb-2">
                                                          Detailed test results are not available for viewing online.
                                                        </div>
                                                        <div className="text-xs text-blue-600 font-medium">
                                                          Please export PDF to view complete test results.
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      {/* Pagination Controls */}
                                      {totalPages > 1 && (
                                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                          <div className="text-sm text-gray-500">
                                            Showing {((currentPage - 1) * 6) + 1} - {Math.min(currentPage * 6, record.testOrders.length)} of {record.testOrders.length} orders
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => handlePageChange(record.medicalRecordId, currentPage - 1)}
                                              disabled={currentPage === 1}
                                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                              Previous
                                            </button>
                                            <div className="flex items-center gap-1">
                                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                  key={page}
                                                  onClick={() => handlePageChange(record.medicalRecordId, page)}
                                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    currentPage === page
                                                      ? 'bg-blue-600 text-white'
                                                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                                  }`}
                                                >
                                                  {page}
                                                </button>
                                              ))}
                                            </div>
                                            <button
                                              onClick={() => handlePageChange(record.medicalRecordId, currentPage + 1)}
                                              disabled={currentPage === totalPages}
                                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                              Next
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      ))}
                    </tbody>
                  </table>
                  {/* Records Pagination Controls */}
{totalRecordPages > 1 && (
  <div className="px-6 py-4 border-t border-gray-200 bg-white">
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">
          {((currentRecordPage - 1) * recordsPerPage) + 1}
        </span> - <span className="font-semibold text-gray-900">
          {Math.min(currentRecordPage * recordsPerPage, filteredRecords.length)}
        </span> of <span className="font-semibold text-gray-900">
          {filteredRecords.length}
        </span> records
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRecordPageChange(currentRecordPage - 1)}
          disabled={currentRecordPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalRecordPages }, (_, i) => i + 1).map((page) => {
            // Show first page, last page, current page, and pages around current
            const showPage = 
              page === 1 || 
              page === totalRecordPages || 
              (page >= currentRecordPage - 1 && page <= currentRecordPage + 1);
            
            const showEllipsis = 
              (page === currentRecordPage - 2 && currentRecordPage > 3) ||
              (page === currentRecordPage + 2 && currentRecordPage < totalRecordPages - 2);

            if (showEllipsis) {
              return <span key={page} className="px-2 text-gray-400">...</span>;
            }

            if (!showPage) return null;

            return (
              <button
                key={page}
                onClick={() => handleRecordPageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentRecordPage === page
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => handleRecordPageChange(currentRecordPage + 1)}
          disabled={currentRecordPage === totalRecordPages}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  </div>
)}
                </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

