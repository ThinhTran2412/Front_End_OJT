import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, X, Save, Loader2, Sparkles } from 'lucide-react';
import { getCommentsByTestOrderId, addComment, updateComment, deleteComment } from '../../services/CommentService';
import { useToast } from '../Toast';

export default function CommentsSection({ testOrderId, testResults = [] }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [selectedTestResultIds, setSelectedTestResultIds] = useState([]);
  const { showToast } = useToast();
  const prevCommentsLengthRef = useRef(0);

  useEffect(() => {
    if (testOrderId) {
      fetchComments();
    }
  }, [testOrderId]);

  // ===== BẮT ĐẦU THÊM CODE MỚI =====
  // Auto-refresh comments when new comment is added (detect length change)
  useEffect(() => {
    if (comments.length > prevCommentsLengthRef.current && prevCommentsLengthRef.current > 0) {
      // New comment detected - scroll to show it
      console.log('New comment detected, refreshing view');
    }
    prevCommentsLengthRef.current = comments.length;
  }, [comments.length]);

  // Poll for new comments every 3 seconds when modal is open
  useEffect(() => {
    if (!testOrderId) return;
    
    const pollInterval = setInterval(() => {
      fetchComments();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [testOrderId]);
  // ===== KẾT THÚC THÊM CODE MỚI =====

  const fetchComments = async () => {
    if (!testOrderId) return;
    
    try {
      setLoading(true);
      const data = await getCommentsByTestOrderId(testOrderId);
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      // ===== SỬA: Thêm điều kiện để tránh spam toast khi polling =====
      // Don't show error toast on polling to avoid spam
      if (!loading) {
        showToast('Failed to load comments', 'error');
      }
      // ===== KẾT THÚC SỬA =====
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    if (!testOrderId) {
      showToast('Test order ID is missing', 'error');
      return;
    }

    try {
      await addComment({
        testOrderId: testOrderId,
        testResultId: selectedTestResultIds.length > 0 ? selectedTestResultIds : [],
        message: newMessage.trim()
      });
      
      showToast('Comment added successfully', 'success');
      setNewMessage('');
      setSelectedTestResultIds([]);
      setShowAddForm(false);
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to add comment';
      showToast(errorMessage, 'error');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    try {
      await updateComment(commentId, editMessage.trim());
      showToast('Comment updated successfully', 'success');
      setEditingId(null);
      setEditMessage('');
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update comment';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment(commentId);
      showToast('Comment deleted successfully', 'success');
      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to delete comment';
      showToast(errorMessage, 'error');
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.commentId || comment.CommentId);
    setEditMessage(comment.message || comment.Message || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const toggleTestResultSelection = (testResultId) => {
    setSelectedTestResultIds(prev => 
      prev.includes(testResultId)
        ? prev.filter(id => id !== testResultId)
        : [...prev, testResultId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // ===== BẮT ĐẦU THÊM CODE MỚI =====
  // Check if comment is an AI-generated summary
  const isAiComment = (message) => {
    return message && (
      message.startsWith('AI Analysis Summary:') ||
      message.includes('AI Analysis Summary:')
    );
  };
  // ===== KẾT THÚC THÊM CODE MỚI =====

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Comments</h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Comment
            </button>
          )}
        </div>
      </div>

      {/* Add Comment Form */}
      {showAddForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test Results (optional)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
                {testResults.length === 0 ? (
                  <p className="text-sm text-gray-500">No test results available</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result) => {
                      const resultId = result.testResultId || result.TestResultId;
                      const parameter = result.parameter || result.Parameter || result.testCode || result.TestCode || 'Unknown';
                      return (
                        <label key={resultId} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTestResultIds.includes(resultId)}
                            onChange={() => toggleTestResultSelection(resultId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{parameter}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter your comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddComment}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMessage('');
                  setSelectedTestResultIds([]);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-gray-200">
         {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No comments yet. Be the first to add a comment!
          </div>
        ) : (
          comments.map((comment) => {
            const commentId = comment.commentId || comment.CommentId;
            const isEditing = editingId === commentId;
            const message = comment.message || comment.Message || '';
            const createdBy = comment.createdBy || comment.CreatedBy || 'Unknown';
            const createdDate = comment.createdDate || comment.CreatedDate;
            const isAiGenerated = isAiComment(message); // ===== THÊM DÒNG NÀY =====

            return (
              <div 
                key={commentId} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isAiGenerated ? 'bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-l-4 border-purple-400' : ''
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateComment(commentId)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* ===== BẮT ĐẦU THÊM CODE MỚI ===== */}
                        {isAiGenerated && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded-full">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-700">AI Generated</span>
                            </div>
                          </div>
                        )}
                        {/* ===== KẾT THÚC THÊM CODE MỚI ===== */}
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <span>By: {createdBy}</span>
                          <span>•</span>
                          <span>{formatDate(createdDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit comment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(commentId)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

