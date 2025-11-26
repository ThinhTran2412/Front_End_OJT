import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventLogs } from '../../hooks/useEventLogs';
import { usePagination } from '../../hooks/usePagination';
import EventLogItem from './EventLogItem';
import DashboardLayout from '../../layouts/DashboardLayout';
import { InlineLoader } from '../Loading';

export default function EventLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterEntity, setFilterEntity] = useState('ALL');
  const navigate = useNavigate();
  
  // Fetch event logs from API
  const { eventLogs, loading, error, refreshEventLogs } = useEventLogs();
  
  // Filter and search logic
  const filteredLogs = eventLogs?.filter(log => {
    const matchesSearch = log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesEntity = filterEntity === 'ALL' || log.entityName === filterEntity;
    
    return matchesSearch && matchesAction && matchesEntity;
  }) || [];

  // Pagination
  const itemsPerPage = 10;
  const { 
    currentPage, 
    totalPages, 
    nextPage, 
    prevPage, 
    goToPage, 
    startIndex, 
    endIndex 
  } = usePagination(filteredLogs.length, itemsPerPage);

  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Format action label for display
  const formatActionLabel = (action) => {
    switch (action) {
      case 'ADD':
      case 'ADDED':
      case 'Add':
      case 'Added': return 'Add';
      case 'UPDATE':
      case 'UPDATED':
      case 'Update':
      case 'Updated': return 'Update';
      case 'DELETE':
      case 'DELETED':
      case 'Delete':
      case 'Deleted': return 'Delete';
      case 'MODIFY':
      case 'MODIFIED':
      case 'Modify':
      case 'Modified': return 'Modify';
      default: return action;
    }
  };

  // Get unique actions and entities for filter dropdowns
  const uniqueActions = [...new Set(eventLogs?.map(log => log.action) || [])];
  const uniqueEntities = [...new Set(eventLogs?.map(log => log.entityName) || [])];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <InlineLoader 
            text="Loading event logs..." 
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Event Logs</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 m-0 mt-4">
                  Event Logs
                </h1>
                <p className="text-gray-600">System activity and changes tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Total: <span className="text-blue-600 font-bold">{filteredLogs.length}</span> logs
                </div>
              </div>
              
              {/* Back Button */}
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={refreshEventLogs}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
              >
                <svg 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="font-medium">{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by user or entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatActionLabel(action)}</option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity
            </label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Entities</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterAction('ALL');
                setFilterEntity('ALL');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Logs List */}
      <div className="p-4">
        {paginatedLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Event Logs Found</h3>
            <p className="text-gray-500 mb-6">
              {filteredLogs.length === 0 && eventLogs?.length > 0
                ? 'Try adjusting your search or filter criteria.'
                : 'No event logs available at the moment.'
              }
            </p>
            <div className="flex items-center justify-center space-x-4">
              {(filteredLogs.length === 0 && eventLogs?.length > 0) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterAction('ALL');
                    setFilterEntity('ALL');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              )}
              
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedLogs.map((log, index) => (
              <div key={log.id} className="transform transition-all duration-300 hover:scale-[1.02]">
                <EventLogItem log={log} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
