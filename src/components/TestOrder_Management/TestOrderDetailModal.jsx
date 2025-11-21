import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { getTestOrderById } from '../../services/TestOrderService';
import { 
  getAiReviewStatus, 
  setAiReviewMode, 
  triggerAiReview,
  confirmAiReviewResults
} from '../../services/AiReviewService';
import { getTestResultsByTestOrderId, processFromSimulator } from '../../services/TestResultService';
import TestResultsList from './TestResultsList';
import { useToast } from '../Toast';

/**
 * Test Order Detail Modal
 * Shows test order details with test results and AI review functionality
 */
export default function TestOrderDetailModal({ 
  testOrderId, 
  isOpen, 
  onClose,
  onUpdate 
}) {
  const [testOrder, setTestOrder] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiReviewEnabled, setIsAiReviewEnabled] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [aiReviewedResults, setAiReviewedResults] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && testOrderId) {
      console.log('Modal opened with testOrderId:', testOrderId);
      fetchTestOrderDetail();
    } else if (isOpen && !testOrderId) {
      console.warn('Modal opened but testOrderId is missing');
    }
  }, [isOpen, testOrderId]);

  const fetchTestOrderDetail = async () => {
    if (!testOrderId) {
      console.error('testOrderId is missing');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching test order detail for:', testOrderId);
      
      // Fetch test order detail - try /TestOrder/{id} first, fallback to /TestOrder/detail/{id}
      let orderData = null;
      let actualTestOrderId = testOrderId;
      
      try {
        orderData = await getTestOrderById(testOrderId);
        console.log('Test order response:', orderData);
      } catch (error) {
        // If getTestOrderById fails, try the detail endpoint as fallback
        console.warn('Failed to fetch via /TestOrder/{id}, trying detail endpoint:', error);
        try {
          const detailResponse = await api.get(`/TestOrder/detail/${testOrderId}`);
          orderData = detailResponse.data;
          console.log('Test order detail response:', orderData);
        } catch (detailError) {
          console.error('Both endpoints failed:', detailError);
          throw error; // Throw original error
        }
      }
      
      if (!orderData) {
        throw new Error('No data returned from API');
      }
      
      // Get the actual testOrderId from response (ensure it's correct)
      actualTestOrderId = orderData.testOrderId || orderData.TestOrderId || testOrderId;
      
      // Map the response to match the expected order structure
      const order = {
        testOrderId: actualTestOrderId,
        status: orderData.status || orderData.Status || 'Unknown',
        testType: orderData.testType || orderData.TestType || orderData.servicePackageName || 'N/A',
        createdAt: orderData.createdAt || orderData.CreatedAt || orderData.createdDate,
        runDate: orderData.runDate || orderData.RunDate,
        patientName: orderData.patientName || orderData.PatientName || orderData.fullName || 'N/A',
        identifyNumber: orderData.identifyNumber || orderData.IdentifyNumber,
        priority: orderData.priority || orderData.Priority,
        note: orderData.note || orderData.Note,
      };
      setTestOrder(order);

      // Fetch test results - try from order data first, then fallback to dedicated endpoint
      let hasResults = false;
      
      if (orderData.testResults && Array.isArray(orderData.testResults)) {
        setTestResults(orderData.testResults);
        hasResults = true;
      } else if (orderData.TestResults && Array.isArray(orderData.TestResults)) {
        // Map both PascalCase and camelCase to camelCase
        const mappedResults = orderData.TestResults.map(r => ({
          testResultId: r.testResultId || r.TestResultId,
          testCode: r.testCode || r.TestCode || '',
          parameter: r.parameter || r.Parameter || '',
          valueNumeric: r.valueNumeric !== undefined ? r.valueNumeric : r.ValueNumeric,
          valueText: r.valueText !== undefined ? r.valueText : r.ValueText,
          unit: r.unit || r.Unit || '',
          referenceRange: r.referenceRange || r.ReferenceRange || '',
          status: r.status || r.Status || '',
          instrument: r.instrument || r.Instrument || '',
          resultStatus: r.resultStatus || r.ResultStatus || '',
          performedBy: r.performedBy !== undefined ? r.performedBy : r.PerformedBy,
          performedDate: r.performedDate || r.PerformedDate,
          reviewedBy: r.reviewedBy !== undefined ? r.reviewedBy : r.ReviewedBy,
          reviewedDate: r.reviewedDate || r.ReviewedDate,
          reviewedByAI: r.reviewedByAI !== undefined ? r.reviewedByAI : 
                       (r.ReviewedByAI !== undefined ? r.ReviewedByAI : false),
          aiReviewedDate: r.aiReviewedDate || r.AiReviewedDate,
          isConfirmed: r.isConfirmed !== undefined ? r.isConfirmed : 
                     (r.IsConfirmed !== undefined ? r.IsConfirmed : false),
          confirmedByUserId: r.confirmedByUserId !== undefined ? r.confirmedByUserId : r.ConfirmedByUserId,
          confirmedDate: r.confirmedDate || r.ConfirmedDate
        }));
        setTestResults(mappedResults);
        hasResults = true;
      }
      
      // If no results in order data, try dedicated endpoint
      if (!hasResults) {
        try {
          let results = await getTestResultsByTestOrderId(actualTestOrderId);
          
          // If no test results found, try to process from simulator
          if (!results || results.length === 0) {
            console.log('No test results found, attempting to process from simulator...');
            try {
              await processFromSimulator(actualTestOrderId);
              console.log('Successfully processed from simulator, fetching test results again...');
              
              // Wait a bit for processing to complete, then fetch again
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Fetch test results again after processing
              results = await getTestResultsByTestOrderId(actualTestOrderId);
              console.log('Test results after processing:', results);
            } catch (processError) {
              console.warn('Could not process from simulator:', processError);
              // Continue with empty results - don't throw error
            }
          }
          
          setTestResults(results || []);
        } catch (err) {
          console.warn('Could not fetch test results:', err);
          setTestResults([]);
        }
      }

      // Fetch AI review status - handle errors gracefully
      // getAiReviewStatus already handles all errors internally and returns default value
      const aiStatus = await getAiReviewStatus(actualTestOrderId);
      setIsAiReviewEnabled(aiStatus?.aiReviewEnabled ?? false);
    } catch (error) {
      console.error('Error fetching test order detail:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to load test order details';
      showToast(errorMessage, 'error');
      
      // Set minimal order data so modal can still be displayed
      setTestOrder({
        testOrderId: testOrderId,
        status: 'Unknown',
        testType: 'N/A',
        patientName: 'N/A'
      });
      setTestResults([]);
      setIsAiReviewEnabled(false);
    } finally {
      setLoading(false);
    }
  };


  const handleToggleAiReview = async () => {
    // Use testOrderId from testOrder state (from API detail) if available, otherwise use prop
    const orderIdToUse = testOrder?.testOrderId || testOrderId;
    
    if (!orderIdToUse) {
      showToast('Test order ID not found', 'error');
      return;
    }

    try {
      setToggling(true);
      const newValue = !isAiReviewEnabled;
      
      console.log('Toggling AI review:', { 
        testOrderId: orderIdToUse, 
        newValue,
        testOrderIdFromProp: testOrderId,
        testOrderIdFromState: testOrder?.testOrderId
      });
      
      await setAiReviewMode(orderIdToUse, newValue);
      setIsAiReviewEnabled(newValue);
      showToast(
        `AI Review ${newValue ? 'enabled' : 'disabled'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling AI review:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        testOrderId: orderIdToUse
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Cannot enable/disable AI Review';
      
      // If test order not found, show a more helpful message
      if (error.response?.status === 404) {
        showToast('Test order not found. The order may have been deleted. Please refresh the page.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setToggling(false);
    }
  };

  const handleTriggerAiReview = async () => {
    if (!isAiReviewEnabled) {
      showToast('Please enable AI Review first', 'error');
      return;
    }

    // Use testOrderId from testOrder state (from API detail) if available
    const orderIdToUse = testOrder?.testOrderId || testOrderId;
    
    if (!orderIdToUse) {
      showToast('Test order ID not found', 'error');
      return;
    }

    try {
      setTriggering(true);
      const result = await triggerAiReview(orderIdToUse);
      
      console.log('AI Review trigger response:', result);
      
      // Update test order status
      if (testOrder) {
        setTestOrder({
          ...testOrder,
          status: result.status || 'Reviewed By AI'
        });
      }

      // Always refresh test results from API to get latest AI review data
      // This ensures we have the most up-to-date information
      let refreshedResults = null;
      try {
        refreshedResults = await getTestResultsByTestOrderId(orderIdToUse);
        if (refreshedResults && Array.isArray(refreshedResults)) {
          setTestResults(refreshedResults);
          console.log('Refreshed test results after AI review:', refreshedResults);
        }
      } catch (err) {
        console.warn('Could not refresh test results after AI review:', err);
        
        // Fallback: Update test results with AI reviewed results from API response
        if (result.aiReviewedResults && Array.isArray(result.aiReviewedResults) && result.aiReviewedResults.length > 0) {
          // Merge AI reviewed results with existing test results
          const updatedResults = testResults.map(existingResult => {
            // Check both camelCase and PascalCase field names
            const aiResult = result.aiReviewedResults.find(
              r => (r.testResultId || r.TestResultId) === existingResult.testResultId
            );
            
            if (aiResult) {
              return {
                ...existingResult,
                resultStatus: aiResult.resultStatus || aiResult.ResultStatus || existingResult.resultStatus,
                reviewedByAI: aiResult.reviewedByAI !== undefined ? aiResult.reviewedByAI : 
                             (aiResult.ReviewedByAI !== undefined ? aiResult.ReviewedByAI : true),
                aiReviewedDate: aiResult.aiReviewedDate || aiResult.AiReviewedDate || new Date().toISOString()
              };
            }
            return existingResult;
          });
          
          setTestResults(updatedResults);
        }
      }
      
      // If refresh failed but we have results from trigger response, use those
      if (!refreshedResults && result.aiReviewedResults && Array.isArray(result.aiReviewedResults) && result.aiReviewedResults.length > 0) {
        // Map trigger response to test results format
        const mappedResults = result.aiReviewedResults.map(aiResult => {
          // Support both camelCase and PascalCase field names
          const testResultId = aiResult.testResultId || aiResult.TestResultId;
          
          // Try to find existing result to preserve all fields
          const existing = testResults.find(r => r.testResultId === testResultId);
          
          if (existing) {
            return {
              ...existing,
              resultStatus: aiResult.resultStatus || aiResult.ResultStatus || existing.resultStatus,
              reviewedByAI: aiResult.reviewedByAI !== undefined ? aiResult.reviewedByAI : 
                           (aiResult.ReviewedByAI !== undefined ? aiResult.ReviewedByAI : true),
              aiReviewedDate: aiResult.aiReviewedDate || aiResult.AiReviewedDate || new Date().toISOString()
            };
          }
          
          // If no existing result, create new from AI result
          return {
            testResultId: testResultId,
            testCode: aiResult.testCode || aiResult.TestCode,
            parameter: aiResult.parameter || aiResult.Parameter,
            valueNumeric: aiResult.valueNumeric !== undefined ? aiResult.valueNumeric : aiResult.ValueNumeric,
            valueText: aiResult.valueText || aiResult.ValueText,
            unit: aiResult.unit || aiResult.Unit,
            referenceRange: aiResult.referenceRange || aiResult.ReferenceRange,
            instrument: aiResult.instrument || aiResult.Instrument,
            performedDate: aiResult.performedDate || aiResult.PerformedDate,
            resultStatus: aiResult.resultStatus || aiResult.ResultStatus,
            reviewedByAI: aiResult.reviewedByAI !== undefined ? aiResult.reviewedByAI : 
                         (aiResult.ReviewedByAI !== undefined ? aiResult.ReviewedByAI : true),
            aiReviewedDate: aiResult.aiReviewedDate || aiResult.AiReviewedDate || new Date().toISOString(),
            isConfirmed: false
          };
        });
        
        // Merge with existing results that weren't in AI review response
        const existingIds = new Set(mappedResults.map(r => r.testResultId));
        const otherResults = testResults.filter(r => !existingIds.has(r.testResultId));
        setTestResults([...mappedResults, ...otherResults]);
      }
      
      // Also refresh test order detail to get updated status
      try {
        const orderData = await getTestOrderById(orderIdToUse);
        
        if (orderData) {
          setTestOrder(prev => ({
            ...prev,
            testOrderId: orderData.testOrderId || orderData.TestOrderId || orderIdToUse,
            status: orderData.status || orderData.Status || result.status || 'Reviewed By AI',
            testType: orderData.testType || orderData.TestType || prev?.testType,
            createdAt: orderData.createdAt || orderData.CreatedAt || prev?.createdAt,
            runDate: orderData.runDate || orderData.RunDate || prev?.runDate,
            patientName: orderData.patientName || orderData.PatientName || prev?.patientName,
          }));
        }
      } catch (err) {
        console.warn('Could not refresh test order detail after AI review:', err);
        // Update status from result if available
        if (testOrder && result.status) {
          setTestOrder({
            ...testOrder,
            status: result.status
          });
        }
      }

      // Store AI reviewed results from response
      if (result.aiReviewedResults && Array.isArray(result.aiReviewedResults)) {
        setAiReviewedResults(result.aiReviewedResults);
        console.log('AI Reviewed Results stored:', result.aiReviewedResults);
      }

      showToast('AI Review completed successfully', 'success');
      
      // Force update by ensuring test results state is updated
      // This will trigger re-render of TestResultsList component
      if (onUpdate) {
        onUpdate();
      }
      
      // Ensure test results are properly displayed after review
      // Wait a bit for state to update, then log to verify
      setTimeout(() => {
        console.log('Test results after AI review:', testResults);
      }, 100);
    } catch (error) {
      console.error('Error triggering AI review:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Cannot perform AI Review';
      showToast(errorMessage, 'error');
    } finally {
      setTriggering(false);
    }
  };

  // Get userId from JWT token
  const getUserIdFromToken = () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const base64Url = accessToken.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          
          // Try different possible fields for userId in JWT
          const userId = payload?.userId || 
                       payload?.UserId || 
                       payload?.uid || 
                       payload?.nameid || 
                       payload?.sub ||
                       payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                       null;
          
          if (userId) {
            const numericUserId = Number(userId);
            if (!Number.isNaN(numericUserId) && numericUserId > 0) {
              return numericUserId;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not decode JWT token:', err);
    }
    
    // Fallback: Try to get from localStorage user object
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userId = user?.userId || user?.id || user?.UserId || user?.ID || null;
        if (userId) {
          const numericUserId = Number(userId);
          if (!Number.isNaN(numericUserId) && numericUserId > 0) {
            return numericUserId;
          }
        }
      }
    } catch (err) {
      console.warn('Could not parse user from localStorage:', err);
    }
    
    return null;
  };

  const handleConfirm = async () => {
    // Use testOrderId from testOrder state (from API detail) if available
    const orderIdToUse = testOrder?.testOrderId || testOrderId;
    
    if (!orderIdToUse) {
      showToast('Test order ID not found', 'error');
      return;
    }

    // Get userId from JWT token
    const userId = getUserIdFromToken();
    console.log('getUserIdFromToken result:', { userId, type: typeof userId });
    
    if (!userId) {
      console.error('userId is missing or invalid:', userId);
      showToast('User information not found. Please login again.', 'error');
      return;
    }

    // Validate userId is a number
    const numericUserId = Number(userId);
    if (Number.isNaN(numericUserId) || numericUserId <= 0 || !Number.isInteger(numericUserId)) {
      console.error('Invalid userId format:', { userId, numericUserId, type: typeof userId });
      showToast(`Invalid user ID: ${userId}. Please login again.`, 'error');
      return;
    }

    try {
      setConfirming(true);
      
      console.log('Confirming AI review results:', {
        testOrderId: orderIdToUse,
        userId: numericUserId,
        originalUserId: userId,
        userIdType: typeof userId
      });

      const result = await confirmAiReviewResults(orderIdToUse, numericUserId);
      
      console.log('Confirm AI review results response:', result);

      // Update test order status IMMEDIATELY from response (before refresh)
      const newStatus = result.status || result.Status || testOrder?.status;
      console.log('Updating test order status to:', newStatus);
      
      if (testOrder) {
        setTestOrder({
          ...testOrder,
          status: newStatus
        });
      }

      // Update test results with confirmed results from response
      if (result.confirmedResults && Array.isArray(result.confirmedResults) && result.confirmedResults.length > 0) {
        // Merge confirmed results with existing test results
        const updatedResults = testResults.map(existingResult => {
          const confirmedResult = result.confirmedResults.find(
            r => (r.testResultId || r.TestResultId) === existingResult.testResultId
          );
          
          if (confirmedResult) {
            return {
              ...existingResult,
              isConfirmed: confirmedResult.isConfirmed !== undefined ? confirmedResult.isConfirmed : 
                          (confirmedResult.IsConfirmed !== undefined ? confirmedResult.IsConfirmed : true),
              confirmedByUserId: confirmedResult.confirmedByUserId || confirmedResult.ConfirmedByUserId,
              confirmedDate: confirmedResult.confirmedDate || confirmedResult.ConfirmedDate
            };
          }
          return existingResult;
        });
        
        setTestResults(updatedResults);
      }

      // Clear AI reviewed results after confirmation
      setAiReviewedResults([]);

      showToast('AI Review results confirmed successfully', 'success');
      
      // Refresh test results to get latest data
      try {
        const refreshedResults = await getTestResultsByTestOrderId(orderIdToUse);
        setTestResults(refreshedResults);
        console.log('Refreshed test results after confirmation:', refreshedResults);
      } catch (err) {
        console.warn('Could not refresh test results after confirmation:', err);
      }
      
      // Also refresh test order detail to get latest status (this will update status if backend changed it)
      try {
        await fetchTestOrderDetail();
        console.log('Refreshed test order detail after confirmation');
      } catch (err) {
        console.warn('Could not refresh test order detail after confirmation:', err);
      }
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error confirming AI review results:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to confirm AI review results';
      showToast(errorMessage, 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Test Order Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Order ID: {testOrderId?.substring(0, 8)}...
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : testOrder ? (
              <div className="space-y-6">
                {/* Test Order Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status: </span>
                      <span className={`font-semibold ${
                        testOrder.status === 'Reviewed By AI' ? 'text-purple-600' :
                        testOrder.status === 'Completed' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {testOrder.status || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Test Type: </span>
                      <span className="font-medium text-gray-900">{testOrder.testType || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* AI Review Controls */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Toggle AI Review Switch */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">
                        Enable AI Review:
                      </span>
                      <button
                        onClick={handleToggleAiReview}
                        disabled={loading || toggling}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isAiReviewEnabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                        role="switch"
                        aria-checked={isAiReviewEnabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isAiReviewEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        >
                          {toggling && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </span>
                      </button>
                    </div>

                    {/* AI Review Button - Only show when enabled and not reviewed yet */}
                    {isAiReviewEnabled && testOrder?.status !== 'Reviewed By AI' && (
                      <button
                        onClick={handleTriggerAiReview}
                        disabled={triggering || loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {triggering ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Reviewing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            AI Review
                          </>
                        )}
                      </button>
                    )}

                    {/* Confirm Button - Show when AI review is completed and there are pending confirmations */}
                    {testOrder?.status === 'Reviewed By AI' && (
                      (() => {
                        // Check if there are any unconfirmed AI reviewed results
                        const unconfirmedCount = testResults.filter(r => 
                          (r.reviewedByAI === true || r.ReviewedByAI === true || r.reviewedByAI || r.ReviewedByAI) &&
                          !(r.isConfirmed === true || r.IsConfirmed === true || r.isConfirmed || r.IsConfirmed)
                        ).length;
                        
                        return unconfirmedCount > 0 ? (
                          <button
                            onClick={handleConfirm}
                            disabled={confirming || loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {confirming ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm ({unconfirmedCount})
                              </>
                            )}
                          </button>
                        ) : null;
                      })()
                    )}

                    {/* Status Badge */}
                    {testOrder.status === 'Reviewed By AI' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                        <Sparkles className="w-4 h-4" />
                        Reviewed By AI
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Reviewed Results Section - Show after trigger */}
                {aiReviewedResults.length > 0 && (
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-purple-900">
                        AI Reviewed Results ({aiReviewedResults.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {aiReviewedResults.map((result, index) => {
                        const testResultId = result.testResultId || result.TestResultId || index;
                        return (
                          <div 
                            key={testResultId}
                            className="bg-white rounded-lg p-3 border border-purple-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {result.parameter || result.Parameter || 'Unknown'}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                <Sparkles className="w-3 h-3" />
                                AI Reviewed
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Value: </span>
                                <span className="font-medium">
                                  {(result.valueNumeric !== null && result.valueNumeric !== undefined) || 
                                   (result.ValueNumeric !== null && result.ValueNumeric !== undefined)
                                    ? (result.valueNumeric ?? result.ValueNumeric)
                                    : (result.valueText || result.ValueText || 'N/A')}
                                </span>
                              </div>
                              {(result.unit || result.Unit) && (
                                <div>
                                  <span className="text-gray-500">Unit: </span>
                                  <span className="font-medium">{result.unit || result.Unit}</span>
                                </div>
                              )}
                              {(result.referenceRange || result.ReferenceRange) && (
                                <div>
                                  <span className="text-gray-500">Reference: </span>
                                  <span className="font-medium">{result.referenceRange || result.ReferenceRange}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-gray-500">Status: </span>
                                <span className="font-semibold text-purple-600">
                                  {result.resultStatus || result.ResultStatus || 'Completed'}
                                </span>
                              </div>
                            </div>
                            {(result.aiReviewedDate || result.AiReviewedDate) && (
                              <div className="mt-2 text-xs text-gray-500">
                                Reviewed: {new Date(result.aiReviewedDate || result.AiReviewedDate).toLocaleString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Test Results */}
                <TestResultsList
                  testOrderId={testOrderId}
                  testResults={testResults}
                  onConfirm={handleConfirm}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Test order not found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

