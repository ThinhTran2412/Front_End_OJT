import { useState, useEffect } from 'react';
import React, { useRef } from "react";
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
import CommentsSection from './CommentsSection';
import { useToast } from '../Toast';
import BloodTestAnimation from '../animations/BloodTestAnimation';

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
  const [loadingTestResults, setLoadingTestResults] = useState(true);
  const [isAiReviewEnabled, setIsAiReviewEnabled] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [aiReviewedResults, setAiReviewedResults] = useState([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const { showToast } = useToast();
  const fetchingRef = useRef(false);
  const processingSimulatorRef = useRef(false);

  const deduplicateResults = (results) => {
    if (!results || !Array.isArray(results)) return [];
    
    const seen = new Set();
    return results.filter(result => {
      const id = result.testResultId || result.TestResultId;
      if (!id) return true; // Keep results without ID
      
      if (seen.has(id)) {
        console.warn('Duplicate testResultId detected and removed:', id);
        return false;
      }
      seen.add(id);
      return true;
    });
  };

  // Thay state bằng localStorage
useEffect(() => {
  if (isOpen && testOrderId) {
    console.log('Modal opened with testOrderId:', testOrderId);
    
    // Check if this order has been viewed before (from localStorage)
    const viewedOrdersStr = localStorage.getItem('viewedOrders') || '[]';
    const viewedOrders = JSON.parse(viewedOrdersStr);
    const hasViewedBefore = viewedOrders.includes(testOrderId);
    
    // Reset ALL states
    setShowAnimation(!hasViewedBefore);
    setLoading(true);
    setLoadingTestResults(!hasViewedBefore);
    setCountdown(20);
    setTestResults([]);
    setTestOrder(null);
    setAiReviewedResults([]);
    fetchingRef.current = false;
    processingSimulatorRef.current = false;
    
    // Nếu đã xem rồi, fetch data luôn
    if (hasViewedBefore) {
      fetchTestOrderDetail();
      return;
    }
    
    // Nếu chưa xem, chạy countdown và animation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowAnimation(false);
          setLoadingTestResults(false);
          
          // Mark order as viewed in localStorage
          const updatedViewed = [...viewedOrders, testOrderId];
          localStorage.setItem('viewedOrders', JSON.stringify(updatedViewed));
          
          fetchTestOrderDetail();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(countdownInterval);
    };
  } else if (isOpen && !testOrderId) {
    console.warn('Modal opened but testOrderId is missing');
  }
}, [isOpen, testOrderId]);

  const fetchTestOrderDetail = async () => {
    if (!testOrderId) {
      console.error('testOrderId is missing');
      return;
    }

    // ← THÊM GUARD CHECK NÀY
    if (fetchingRef.current) {
      console.warn('Already fetching test order detail, skipping...');
      return;
    }

    try {
      fetchingRef.current = true; // ← SET FLAG
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
        testType: orderData.testType || orderData.TestType || orderData.servicePackageName || null,
        createdAt: orderData.createdAt || orderData.CreatedAt || orderData.createdDate,
        runDate: orderData.runDate || orderData.RunDate,
        // Patient Information
        patientName: orderData.patientName || orderData.PatientName || null,
        age: orderData.age || orderData.Age || null,
        gender: orderData.gender || orderData.Gender || null,
        phoneNumber: orderData.phoneNumber || orderData.PhoneNumber || null,
        // Priority and Note might not be in TestOrderDetailDto, try to get from order entity if available
        priority: orderData.priority || orderData.Priority || null,
        note: orderData.note || orderData.Note || null,
      };
      setTestOrder(order);
      setLoading(false); // Stop main loading, start loading test results separately

      // Fetch test results in parallel - don't block UI
      const loadTestResults = async () => {
        try {
          setLoadingTestResults(true);
          let resultsToSet = [];
          
          // Priority 1: Check if test results are already in order data
          if (orderData.testResults && Array.isArray(orderData.testResults) && orderData.testResults.length > 0) {
            resultsToSet = orderData.testResults;
            console.log('Using testResults from orderData (camelCase):', resultsToSet.length);
          } else if (orderData.TestResults && Array.isArray(orderData.TestResults) && orderData.TestResults.length > 0) {
            // Map PascalCase to camelCase
            resultsToSet = orderData.TestResults.map(r => ({
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
            console.log('Using TestResults from orderData (PascalCase):', resultsToSet.length);
          }
          
          // Priority 2: If no results in order data, fetch from dedicated endpoint
          if (resultsToSet.length === 0) {
            console.log('No test results in orderData, fetching from endpoint...');
            let results = await getTestResultsByTestOrderId(actualTestOrderId);
            
            // Priority 3: If still no results, try to process from simulator (ONLY ONCE!)
            if (!results || results.length === 0) {
              // ← GUARD CHECK
              if (processingSimulatorRef.current) {
                console.warn('Already processing from simulator, skipping...');
                setTestResults([]);
                return;
              }
              
              console.log('No test results found, attempting to process from simulator...');
              try {
                processingSimulatorRef.current = true; // ← SET FLAG
                
                await processFromSimulator(actualTestOrderId, 'CBC');
                console.log('Successfully processed from simulator, fetching again...');
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                results = await getTestResultsByTestOrderId(actualTestOrderId);
                console.log('Test results after processing:', results?.length || 0);
              } catch (processError) {
                console.warn('Could not process from simulator:', processError);
              } finally {
                processingSimulatorRef.current = false; // ← RESET FLAG
              }
            }
            
            resultsToSet = results || [];
          }
          
          // Deduplicate before setting
          const uniqueResults = deduplicateResults(resultsToSet);
          console.log(`Deduplicated: ${resultsToSet.length} → ${uniqueResults.length} results`);
          
          setTestResults(uniqueResults);
          console.log('Final test results set:', uniqueResults.length);
          
        } catch (err) {
          console.warn('Could not fetch test results:', err);
          setTestResults([]);
        } finally {
          setLoadingTestResults(false);
        }
      };

      // Start loading test results in parallel
      loadTestResults();

      // Fetch AI review status - handle errors gracefully
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
        testType: null,
        patientName: null
      });
      setTestResults([]);
      setIsAiReviewEnabled(false);
      setLoadingTestResults(false);
    } finally {
      setLoading(false);
      fetchingRef.current = false; // ← RESET FLAG
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

      // ===== BẮT ĐẦU THÊM CODE MỚI =====
      // Auto-create comment with AI summary if available
      if (result.aiSummary) {
        try {
          const { addComment } = await import('../../services/CommentService');
          await addComment({
            testOrderId: orderIdToUse,
            testResultId: [], // General comment for entire order
            message: `AI Analysis Summary:\n\n${result.aiSummary}`
          });
          console.log('Auto-created comment with AI summary');
        } catch (commentError) {
          console.warn('Could not auto-create comment with AI summary:', commentError);
          // Don't fail the entire operation if comment creation fails
        }
      }
      
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

  // Fullscreen animation view
  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-hidden">
        <style>{`
          @keyframes fullScreenFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-30 rounded-full p-2 backdrop-blur-sm"
        >
          <X className="w-8 h-8" />
        </button>
        
        {/* Animation container - full screen */}
        {loadingTestResults && (
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden" style={{
            animation: 'fullScreenFadeIn 0.5s ease-out'
          }}>

            {/* Animation */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-hidden">
              <div className="w-full flex-1 flex items-center justify-center" style={{ maxHeight: '85%' }}>
                <div className="w-full h-full" style={{ aspectRatio: '3/2', maxWidth: '100%', maxHeight: '100%', transform: 'scale(1.3)' }}>
                  <BloodTestAnimation 
                    size="full" 
                    showTitle={false}
                    message=""
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              {/* Loading message at bottom */}
              <div className="relative z-20 mt-4 text-center">
                <p className="text-lg text-gray-600 animate-pulse">
                  Please wait while the machine processes this blood sample...
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" style={{
            animation: 'slideInUp 0.3s ease-out'
          }}>
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
                <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg p-6 border border-gray-200/60">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    </div>
                    Test Order Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Status</span>
                        <span className={`font-semibold text-lg ${
                          testOrder.status === 'Reviewed By AI' ? 'text-purple-600' :
                          testOrder.status === 'Completed' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {testOrder.status || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Test Type</span>
                        <span className="font-medium text-gray-900 text-lg">{testOrder.testType || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Priority</span>
                        <span className={`font-medium ${testOrder.priority && testOrder.priority !== 'Normal' ? 'text-red-600' : 'text-gray-500'}`}>
                          {testOrder.priority || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Patient</span>
                        <span className="font-medium text-gray-900 text-lg">{testOrder.patientName || '-'}</span>
                      </div>
                      {testOrder.age && (
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Age</span>
                          <span className="font-medium text-gray-900">{testOrder.age} years</span>
                        </div>
                      )}
                      {testOrder.gender && (
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Gender</span>
                          <span className="font-medium text-gray-900">{testOrder.gender}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Created</span>
                        <span className="font-medium text-gray-900">
                          {testOrder.createdAt ? new Date(testOrder.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </span>
                      </div>
                      {testOrder.runDate && (
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Run Date</span>
                          <span className="font-medium text-gray-900">
                            {new Date(testOrder.runDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {testOrder.phoneNumber && (
                        <div>
                          <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium">Phone</span>
                          <span className="font-medium text-gray-900">{testOrder.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {testOrder.note && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-gray-500 block text-xs uppercase tracking-wider font-medium mb-1">Note</span>
                      <span className="text-gray-700">{testOrder.note}</span>
                    </div>
                  )}
                </div>

                {/* AI Review Controls */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/60 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    AI Review & Analysis
                  </h3>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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
                        className="flex items-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      >
                        {triggering ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">AI Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">Start AI Review</span>
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
                            className="flex items-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                          >
                            {confirming ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-medium">Confirming...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Confirm Results ({unconfirmedCount})</span>
                              </>
                            )}
                          </button>
                        ) : null;
                      })()
                    )}

                    {/* Status Badge */}
                    {testOrder.status === 'Reviewed By AI' && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                        <span className="text-sm font-semibold text-purple-800">AI Review Completed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Results */}
                <TestResultsList
                  testOrderId={testOrderId}
                  testResults={testResults}
                  onConfirm={handleConfirm}
                />

                {/* Comments Section */}
                <CommentsSection
                  testOrderId={testOrder?.testOrderId || testOrderId}
                  testResults={testResults}
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

