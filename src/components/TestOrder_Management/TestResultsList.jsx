import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { confirmAiReviewResults } from '../../services/AiReviewService';

/**
 * Test Results List Component
 * Displays test results for a test order with AI review status and confirm functionality
 */
export default function TestResultsList({ 
  testOrderId, 
  testResults = [], 
  onConfirm 
}) {
  const [confirmingIds, setConfirmingIds] = useState(new Set());
  const [expanded, setExpanded] = useState(false);
  
  // Auto-expand when there are AI reviewed results
  useEffect(() => {
    const hasAiReviewed = testResults.some(r => 
      r.reviewedByAI === true || 
      r.ReviewedByAI === true ||
      r.reviewedByAI || 
      r.ReviewedByAI
    );
    if (hasAiReviewed) {
      setExpanded(true);
    }
  }, [testResults]);

  if (!testResults || testResults.length === 0) {
    return (
      <div className="text-sm text-gray-500 py-2">
        No test results available
      </div>
    );
  }

  // Support both camelCase and PascalCase field names
  const aiReviewedResults = testResults.filter(r => 
    r.reviewedByAI === true || 
    r.ReviewedByAI === true ||
    r.reviewedByAI || 
    r.ReviewedByAI
  );
  const confirmedResults = testResults.filter(r => 
    r.isConfirmed === true || 
    r.IsConfirmed === true ||
    r.isConfirmed || 
    r.IsConfirmed
  );
  const pendingConfirmation = aiReviewedResults.filter(r => 
    !(r.isConfirmed === true || r.IsConfirmed === true || r.isConfirmed || r.IsConfirmed)
  );
  const hasPendingConfirmation = pendingConfirmation.length > 0;

  const handleConfirmResult = async () => {
    // Get user ID from multiple sources
    let userId = null;
    
    // Method 1: Try to get from JWT token (most reliable)
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
          userId = payload?.userId || 
                   payload?.UserId || 
                   payload?.uid || 
                   payload?.nameid || 
                   payload?.sub ||
                   payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                   null;
        }
      }
    } catch (err) {
      console.warn('Could not decode JWT token:', err);
    }
    
    // Method 2: Try to get from localStorage user object
    if (!userId) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          userId = user?.userId || user?.id || user?.UserId || user?.ID || null;
        }
      } catch (err) {
        console.warn('Could not parse user from localStorage:', err);
      }
    }

    // If still no userId found, show error
    if (!userId) {
      alert('User information not found. Please login again.');
      return;
    }

    // Convert userId to number
    const numericUserId = Number(userId);
    if (!numericUserId || Number.isNaN(numericUserId) || numericUserId <= 0) {
      console.error('Invalid userId:', userId, 'numericUserId:', numericUserId);
      alert('Invalid user ID. Please login again.');
      return;
    }

    console.log('Confirming AI review results:', {
      testOrderId,
      userId: numericUserId,
      aiReviewedResultsCount: aiReviewedResults.length,
      pendingConfirmationCount: pendingConfirmation.length
    });

    try {
      // Confirm all AI-reviewed results for this test order (not individual result)
      // Backend confirms all AI-reviewed results at once
      setConfirmingIds(new Set(aiReviewedResults.map(r => r.testResultId)));
      
      const result = await confirmAiReviewResults(testOrderId, numericUserId);
      
      console.log('Confirm AI review results response:', result);
      
      // Update local state with confirmed results
      if (result.confirmedResults && Array.isArray(result.confirmedResults)) {
        // This will trigger parent to refresh, but we can also update locally
        // The parent's onConfirm will refresh the data
      }
      
      if (onConfirm) {
        onConfirm();
      }
    } catch (error) {
      console.error('Error confirming AI review results:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        innerException: error.response?.data?.innerException,
        data: error.response?.data
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to confirm AI review results';
      
      // Show more detailed error message
      let displayMessage = errorMessage;
      if (error.response?.data?.innerException) {
        displayMessage += `\nDetails: ${error.response.data.innerException}`;
      }
      
      alert(displayMessage);
    } finally {
      setConfirmingIds(new Set());
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            Test Results ({testResults.length})
          </span>
          {aiReviewedResults.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              <Sparkles className="w-3 h-3" />
              {aiReviewedResults.length} AI Reviewed
            </span>
          )}
          {pendingConfirmation.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {pendingConfirmation.length} Pending Confirmation
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Test Results List */}
      {expanded && (
        <div className="divide-y divide-gray-200">
          {testResults.map((result, index) => {
            // Support both camelCase and PascalCase
            const isAiReviewed = result.reviewedByAI === true || 
                                result.ReviewedByAI === true ||
                                result.reviewedByAI || 
                                result.ReviewedByAI;
            const isConfirmed = result.isConfirmed === true || 
                              result.IsConfirmed === true ||
                              result.isConfirmed || 
                              result.IsConfirmed;
            const isConfirming = confirmingIds.has(result.testResultId || result.TestResultId);
            
            // Ensure unique key - use testResultId if available, otherwise use index
            const uniqueKey = result.testResultId || result.TestResultId || `result-${index}`;
            
            // Get AI reviewed date (support both cases)
            const aiReviewedDate = result.aiReviewedDate || result.AiReviewedDate;
            const confirmedDate = result.confirmedDate || result.ConfirmedDate;

            return (
              <div 
                key={uniqueKey} 
                className={`p-3 border-l-4 transition-all ${
                  isAiReviewed 
                    ? isConfirmed 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-purple-50 border-purple-500' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Test Result Info - Compact */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {result.parameter || result.Parameter || result.testCode || result.TestCode || 'Unknown Parameter'}
                      </h4>
                      {isAiReviewed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex-shrink-0">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Value:</span>
                        <span className="font-medium text-gray-900">
                          {(result.valueNumeric !== null && result.valueNumeric !== undefined) || 
                           (result.ValueNumeric !== null && result.ValueNumeric !== undefined)
                            ? (result.valueNumeric ?? result.ValueNumeric)
                            : (result.valueText || result.ValueText || 'N/A')}
                        </span>
                        {(result.unit || result.Unit) && (
                          <span className="text-gray-500 ml-1">{result.unit || result.Unit}</span>
                        )}
                      </div>
                      {(result.referenceRange || result.ReferenceRange) && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Ref:</span>
                          <span className="font-medium text-gray-900">{result.referenceRange || result.ReferenceRange}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-semibold ${
                          (result.status || result.Status || result.resultStatus || result.ResultStatus) === 'Normal' ? 'text-green-600' :
                          (result.status || result.Status || result.resultStatus || result.ResultStatus) === 'High' || 
                          (result.status || result.Status || result.resultStatus || result.ResultStatus) === 'Low' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {result.status || result.Status || result.resultStatus || result.ResultStatus || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Confirm All Button - Show at bottom if there are pending confirmations */}
          {hasPendingConfirmation && (
            <div className="p-4 bg-yellow-50 border-t border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    {pendingConfirmation.length} test result(s) pending confirmation
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please review and confirm all AI-reviewed results
                  </p>
                </div>
                <button
                  onClick={handleConfirmResult}
                  disabled={confirmingIds.size > 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Confirm All AI-Reviewed Results"
                >
                  {confirmingIds.size > 0 ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm All ({pendingConfirmation.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
