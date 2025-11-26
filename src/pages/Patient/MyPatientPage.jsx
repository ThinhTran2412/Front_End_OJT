import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, ClipboardList, AlertCircle, CheckCircle, Download, Grid3x3, List, Square, CheckSquare2, FileText, ChevronDown, ChevronUp, FileDown, Loader2 } from 'lucide-react';
import PatientService from '../../services/PatientService';
import { getTestOrdersByPatientId, startExportJob } from '../../services/TestOrderService';
import { exportTestResultsToPdf, getTestResultsByTestOrderId } from '../../services/TestResultService';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
import jobManager from '../../utils/BackgroundJobManager';
import { RingSpinner, InlineLoader } from '../../components/Loading';

export default function MyPatientPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [testOrders, setTestOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [exporting, setExporting] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [testResults, setTestResults] = useState({}); // { testOrderId: [results] }
  const [loadingResults, setLoadingResults] = useState(new Set());
  const [exportingPdf, setExportingPdf] = useState(new Set());

  useEffect(() => {
    fetchMyPatientData();
  }, []);

  const fetchMyPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user's patient information
      // Use PatientService method, fallback to direct API call using api service (axios)
      let patient;
      if (PatientService && typeof PatientService.getMyPatientInfo === 'function') {
        patient = await PatientService.getMyPatientInfo();
      } else {
        // Fallback: call API directly using api service (axios)
        const response = await api.get('/Patient/me');
        patient = response.data;
      }
      
      if (!patient) {
        setError('Patient information not found. Please contact support.');
        setLoading(false);
        return;
      }

      setPatientData(patient);

      // Get test orders for this patient using the new API
      try {
        if (patient.patientId) {
          const orders = await getTestOrdersByPatientId(patient.patientId);
          setTestOrders(Array.isArray(orders) ? orders : []);
        } else {
          setTestOrders([]);
        }
      } catch (err) {
        console.warn('Could not fetch test orders:', err);
        // Don't fail the whole page if test orders can't be loaded
        setTestOrders([]);
      }

      // Optionally get medical records if needed (but test orders are now from dedicated API)
      try {
        const records = await PatientService.getPatientMedicalRecords(patient.patientId);
        const patientRecords = Array.isArray(records) ? records : [];
        setMedicalRecords(patientRecords);
      } catch (err) {
        console.warn('Could not fetch medical records:', err);
        setMedicalRecords([]);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load patient information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01") return 'N/A';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === testOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(testOrders.map(o => o.testOrderId || o.TestOrderId)));
    }
  };

  const handleExport = async () => {
    if (!patientData?.patientId) {
      alert('Patient information not available. Please refresh the page.');
      return;
    }
    
    try {
      setExporting(true);
      
      const selectedIds = selectedOrders.size > 0 
        ? Array.from(selectedOrders)
        : null;

      const fileName = selectedIds && selectedIds.length > 0
        ? `Test Orders-${selectedIds.length} orders-${new Date().toISOString().split('T')[0]}.xlsx`
        : null;

      await startExportJob(patientData.patientId, selectedIds, fileName);
      setSelectedOrders(new Set());
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to start export. Please try again.');
    } finally {
      setExporting(false);
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
      // Note: Test results are not available via API for regular users
      // They can only be viewed through PDF export
      const results = await getTestResultsByTestOrderId(testOrderId);
      setTestResults(prev => ({
        ...prev,
        [testOrderId]: Array.isArray(results) ? results : []
      }));
    } catch (error) {
      console.warn('Test results not available via API:', error);
      // Set empty array - user can still export PDF to view results
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

  const handleExportPdf = async (testOrderId, e) => {
    e.stopPropagation(); // Prevent card selection when clicking export button
    
    if (!patientData?.fullName) {
      alert('Patient information not available. Please refresh the page.');
      return;
    }

    try {
      setExportingPdf(prev => new Set(prev).add(testOrderId));
      
      // Format file name: "Detail-Patient Name-Date Print."
      // Remove special characters and replace spaces with hyphens for patient name
      const patientName = patientData.fullName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s+/g, '-');
      
      // Format date as "Date Print" (e.g., "2024-01-15" or "01-15-2024")
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
      
      // Final format: "Detail-Patient Name-Date Print"
      const fileName = `Detail-${patientName}-${dateStr}`;
      
      await exportTestResultsToPdf(testOrderId, fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Error message is already formatted in the service
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <InlineLoader 
            text="Loading your patient information" 
            size="large" 
            theme="blue" 
            centered={true}
          />
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
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
            <button 
              onClick={fetchMyPatientData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
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
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">No Patient Information Found</p>
              <p className="text-gray-600 text-sm">We couldn't find your patient information. Please contact support.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Patient Information</h1>
            <p className="text-gray-600">View your personal patient information, test orders, and test results</p>
          </div>

          {/* Patient Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
                  <p className="text-sm text-gray-500">Patient ID: PAT-{String(patientData.patientId || '').padStart(3, '0')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Full Name</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.fullName || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Date of Birth</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(patientData.dateOfBirth)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Age</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.age || 'N/A'} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Gender</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Phone Number</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.phoneNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Email</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2 lg:col-span-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Address</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.address || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block">Identity Number</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{patientData.identifyNumber || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Orders Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Test Orders</h2>
                  <p className="text-sm text-gray-500">
                    {testOrders.length} order(s) found
                    {selectedOrders.size > 0 && ` • ${selectedOrders.size} selected`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                {testOrders.length > 0 && (
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
                )}
                {/* Export Button */}
                {testOrders.length > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5" />
                    {exporting 
                      ? 'Starting...' 
                      : selectedOrders.size > 0 
                        ? `Export ${selectedOrders.size} Selected`
                        : 'Export All'}
                  </button>
                )}
              </div>
            </div>

            {/* Select All (for list view) */}
            {testOrders.length > 0 && viewMode === 'list' && (
              <div className="mb-4 flex items-center gap-2 pb-3 border-b">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  {selectedOrders.size === testOrders.length ? (
                    <CheckSquare2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                  <span>Select All</span>
                </button>
              </div>
            )}

            {testOrders.length > 0 ? (
              viewMode === 'card' ? (
                // Card View - 2 or 3 cards per row
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testOrders.map((order) => {
                    const testOrderId = order.testOrderId || order.TestOrderId;
                    const orderCode = order.orderCode || order.OrderCode;
                    const status = order.status || order.Status;
                    const isSelected = selectedOrders.has(testOrderId);
                    const isExpanded = expandedOrders.has(testOrderId);
                    const orderTestResults = testResults[testOrderId] || [];
                    const hasResults = orderTestResults.length > 0 || order.testResults || order.TestResults;
                    const isLoadingResults = loadingResults.has(testOrderId);
                    const isExportingPdf = exportingPdf.has(testOrderId);
                    
                    return (
                      <div 
                        key={testOrderId} 
                        className={`
                          border-2 rounded-lg transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 bg-white'
                          }
                        `}
                      >
                        {/* Header */}
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => handleSelectOrder(testOrderId)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckSquare2 className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{orderCode || 'N/A'}</h3>
                                <p className="text-xs text-gray-500 font-mono truncate max-w-[150px]">{testOrderId}</p>
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                              {status || 'N/A'}
                            </span>
                          </div>
                          
                          {/* Key Info */}
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

                        {/* Actions */}
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
                              onClick={(e) => handleExportPdf(testOrderId, e)}
                              disabled={isExportingPdf}
                              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Export PDF"
                            >
                              {isExportingPdf ? (
                                <RingSpinner size="small" text="" theme="blue" />
                              ) : (
                                <FileDown className="w-4 h-4" />
                              )}
                              PDF
                            </button>
                          </div>
                        )}

                        {/* Expanded Test Results */}
                        {isExpanded && hasResults && (
                          <div className="px-4 pb-4 border-t border-gray-200">
                            {isLoadingResults ? (
                              <div className="py-4 flex items-center justify-center">
                                <RingSpinner size="small" text="" theme="blue" />
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
                // List View
                <div className="space-y-2">
                  {testOrders.map((order) => {
                    const testOrderId = order.testOrderId || order.TestOrderId;
                    const orderCode = order.orderCode || order.OrderCode;
                    const status = order.status || order.Status;
                    const isSelected = selectedOrders.has(testOrderId);
                    const isExpanded = expandedOrders.has(testOrderId);
                    const orderTestResults = testResults[testOrderId] || [];
                    const hasResults = orderTestResults.length > 0 || order.testResults || order.TestResults;
                    const isLoadingResults = loadingResults.has(testOrderId);
                    const isExportingPdf = exportingPdf.has(testOrderId);
                    
                    return (
                      <div 
                        key={testOrderId} 
                        className={`
                          border-2 rounded-lg transition-all
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleSelectOrder(testOrderId)}
                              className="flex-shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare2 className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            
                            {/* Order Info */}
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
                          
                          {/* Additional Info */}
                          {(order.note || order.Note || hasResults) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(order.note || order.Note) && (
                                    <div className="bg-blue-50 p-2 rounded text-xs">
                                      <span className="text-gray-500">Note: </span>
                                      <span className="text-gray-900">{order.note || order.Note}</span>
                                    </div>
                                  )}
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
                                      onClick={(e) => handleExportPdf(testOrderId, e)}
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

                        {/* Expanded Test Results */}
                        {isExpanded && hasResults && (
                          <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                            {isLoadingResults ? (
                              <div className="py-4 flex items-center justify-center">
                                <RingSpinner size="small" text="" theme="blue" />
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
              )
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Test Orders Found</h3>
                <p className="text-gray-500">You don't have any test orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

