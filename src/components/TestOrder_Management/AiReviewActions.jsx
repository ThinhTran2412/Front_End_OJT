import { useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { 
  setAiReviewMode, 
  triggerAiReview, 
  confirmAiReviewResults 
} from '../../services/AiReviewService';

// Simple toast function - can be replaced with proper toast hook if needed
const showToastMessage = (message, type = 'success') => {
  // This is a simple implementation - you can integrate with your toast system
  console.log(`[${type.toUpperCase()}] ${message}`);
  // You can also dispatch to a global toast store or use window events
  if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('showToast', { 
      detail: { message, type } 
    }));
  }
};

/**
 * AI Review Actions Component
 * Provides UI for AI review features: toggle, trigger, and confirm
 */
export default function AiReviewActions({ 
  testOrderId, 
  currentStatus, 
  isAiReviewEnabled: initialIsEnabled,
  onStatusUpdate 
}) {
  const [isAiReviewEnabled, setIsAiReviewEnabled] = useState(initialIsEnabled || false);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isReviewedByAI = currentStatus === 'Reviewed By AI';
  const canTrigger = isAiReviewEnabled && !isReviewedByAI;
  const canConfirm = isReviewedByAI;

  // Toggle AI Review mode
  const handleToggleAiReview = async () => {
    try {
      setLoading(true);
      const newValue = !isAiReviewEnabled;
      await setAiReviewMode(testOrderId, newValue);
      setIsAiReviewEnabled(newValue);
      showToastMessage(
        `AI Review ${newValue ? 'enabled' : 'disabled'} successfully`,
        'success'
      );
      if (onStatusUpdate) {
        onStatusUpdate({ isAiReviewEnabled: newValue });
      }
    } catch (error) {
      console.error('Error toggling AI review:', error);
      showToastMessage(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to toggle AI review mode',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI Review
  const handleTriggerAiReview = async () => {
    if (!isAiReviewEnabled) {
      showToastMessage('Please enable AI Review first', 'error');
      return;
    }

    try {
      setTriggering(true);
      const result = await triggerAiReview(testOrderId);
      
      showToastMessage('AI Review completed successfully', 'success');
      
      if (onStatusUpdate) {
        onStatusUpdate({ 
          status: result.status || 'Reviewed By AI',
          aiReviewedResults: result.aiReviewedResults 
        });
      }
    } catch (error) {
      console.error('Error triggering AI review:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to trigger AI review';
      showToastMessage(errorMessage, 'error');
    } finally {
      setTriggering(false);
    }
  };

  // Confirm AI Review results
  const handleConfirmAiReview = async () => {
    // Get user ID from localStorage or auth store
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.userId || user?.id || 1; // Fallback to 1 if not found

    try {
      setConfirming(true);
      const result = await confirmAiReviewResults(testOrderId, userId);
      
      showToastMessage('AI Review results confirmed successfully', 'success');
      
      if (onStatusUpdate) {
        onStatusUpdate({ 
          confirmedResults: result.confirmedResults 
        });
      }
    } catch (error) {
      console.error('Error confirming AI review:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to confirm AI review results';
      showToastMessage(errorMessage, 'error');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* AI Review Toggle */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAiReviewEnabled}
            onChange={handleToggleAiReview}
            disabled={loading}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            AI Review
          </span>
        </label>
      </div>

      {/* Trigger AI Review Button */}
      {canTrigger && (
        <button
          onClick={handleTriggerAiReview}
          disabled={triggering || !isAiReviewEnabled}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trigger AI Review"
        >
          {triggering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Trigger AI Review
            </>
          )}
        </button>
      )}

      {/* Status Badge - Reviewed By AI */}
      {isReviewedByAI && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            <Sparkles className="w-3 h-3" />
            Reviewed By AI
          </span>
          
          {/* Confirm Button */}
          <button
            onClick={handleConfirmAiReview}
            disabled={confirming}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Confirm AI Review Results"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

