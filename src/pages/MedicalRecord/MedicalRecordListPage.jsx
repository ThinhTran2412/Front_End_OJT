import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, FileText, Users, CalendarDays, ClipboardList, Download, Grid3x3, List, Square, CheckSquare2, CheckCircle, ChevronDown, ChevronUp, FileDown, Loader2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAllMedicalRecords } from '../../services/MedicalRecordService';
import { startExportJob } from '../../services/TestOrderService';
import { exportTestResultsToPdf, getTestResultsByTestOrderId } from '../../services/TestResultService';
import jobManager from '../../utils/BackgroundJobManager';

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

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllMedicalRecords();
      setRecords(normalizeRecords(data));
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            {/* Page header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  Medical Records
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage all patient medical records in the laboratory system.
                </p>
              </div>
              <button
                onClick={fetchRecords}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Records</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalRecords}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unique Patients</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.uniquePatients}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-lg flex items-center justify-center">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created Today</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.createdToday}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by patient name, contact, creator, or record ID"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{filteredRecords.length}</span> of{' '}
                  <span className="font-medium text-gray-900">{records.length}</span> records
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading medical records...</p>
                  </div>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <p className="text-gray-700 text-lg font-medium mb-1">No medical records found.</p>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search keywords or refresh the list to load the latest data.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRecords.map((record) => (
                        <>
                        <tr key={record.medicalRecordId} className="hover:bg-gray-50 transition-colors">
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
                        {/* Expanded Test Orders Section */}
                        {expandedRecords.has(record.medicalRecordId) && record.testOrders.length > 0 && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50">
                              <div className="bg-white rounded-lg border border-gray-200 p-4">
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

                                {/* Select All (for list view) */}
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

                                {/* Test Orders Display */}
                                {viewMode === 'card' ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {record.testOrders.map((order) => {
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
                                              <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Created:</span>
                                                <span className="font-medium">{formatDate(order.createdAt || order.CreatedAt)}</span>
                                              </div>
                                              {hasResults && (
                                                <div className="flex items-center gap-1 text-xs text-green-600">
                                                  <CheckCircle className="w-3 h-3" />
                                                  <span>{orderTestResults.length > 0 ? `${orderTestResults.length} Results` : 'Has Results'}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

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

                                          {isExpanded && hasResults && (
                                            <div className="px-4 pb-4 border-t border-gray-200">
                                              {isLoadingResults ? (
                                                <div className="py-4 flex items-center justify-center">
                                                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
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
                                  <div className="space-y-2">
                                    {record.testOrders.map((order) => {
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
                                                <div>
                                                  <p className="text-xs text-gray-500">Created Date</p>
                                                  <p className="text-sm font-medium">{formatDateTime(order.createdAt || order.CreatedAt)}</p>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-500">Run Date</p>
                                                  <p className="text-sm font-medium">
                                                    {(order.runDate || order.RunDate) && (order.runDate !== "0001-01-01T00:00:00" && order.RunDate !== "0001-01-01T00:00:00")
                                                      ? formatDateTime(order.runDate || order.RunDate) 
                                                      : "Not run yet"}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                            {hasResults && (
                                              <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {hasResults && (
                                                      <div className="bg-green-50 p-2 rounded text-xs flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                                        <span className="text-gray-500">Results: </span>
                                                        <span className="text-gray-900">
                                                          {orderTestResults.length > 0 ? `${orderTestResults.length} test results` : 'Available'}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  {hasResults && (
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
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          {isExpanded && hasResults && (
                                            <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                                              {isLoadingResults ? (
                                                <div className="py-4 flex items-center justify-center">
                                                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
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
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

