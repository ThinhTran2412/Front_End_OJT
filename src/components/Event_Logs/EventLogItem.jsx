import { useState } from 'react';

export default function EventLogItem({ log }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parseChanges = (changesString) => {
    try {
      if (changesString.startsWith('{')) return JSON.parse(changesString);
      const lines = changesString.split('\r\n').filter(line => line.trim());
      const changes = {};
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':').map(s => s.trim());
          changes[key] = value;
        }
      });
      return changes;
    } catch {
      return { raw: changesString };
    }
  };

  const changes = parseChanges(log.changes);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString('en-GB'),
        time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } catch {
      return { date: 'Invalid Date', time: '' };
    }
  };

  const { date, time } = formatTimestamp(log.timestamp);

  const getActionStyle = (action) => {
    switch (action) {
      case 'Add': 
      case 'Added':
      case 'ADD':
      case 'ADDED': return { color: 'text-green-600', bgColor: 'bg-green-100', icon: '➕', label: 'Add' };
      case 'Update':
      case 'Updated':
      case 'UPDATE':
      case 'UPDATED': return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '✏️', label: 'Update' };
      case 'Delete':
      case 'Deleted':
      case 'DELETE':
      case 'DELETED': return { color: 'text-red-600', bgColor: 'bg-red-100', icon: '🗑️', label: 'Delete' };
      case 'Modify':
      case 'Modified':
      case 'MODIFY':
      case 'MODIFIED': return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🔧', label: 'Modify' };
      default: return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '📝', label: action };
    }
  };

  const actionStyle = getActionStyle(log.action);

  const renderChanges = () => {
    if (typeof changes === 'object' && changes !== null) {
      return Object.entries(changes).map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key} className="mb-3">
              <div className="font-medium text-gray-900 mb-1">{key}</div>
              <div className="ml-4 space-y-1">
                {value.OldValue !== undefined && (
                  <div className="text-sm">
                    <span className="text-red-600">Old:</span>
                    <span className="ml-2 text-gray-700">{String(value.OldValue ?? 'null')}</span>
                  </div>
                )}
                {value.NewValue !== undefined && (
                  <div className="text-sm">
                    <span className="text-green-600">New:</span>
                    <span className="ml-2 text-gray-700">{String(value.NewValue ?? 'null')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div key={key} className="mb-2">
            <span className="font-medium text-gray-900">{key}:</span>
            <span className="ml-2 text-gray-700">{String(value)}</span>
          </div>
        );
      });
    }
    return <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">{String(changes)}</div>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
     {/* Header */}
<div 
  className="px-4 py-4 cursor-pointer"
  onClick={() => setIsExpanded(!isExpanded)}
>
  <div className="flex items-center justify-between">
    {/* Left side */}
    <div className="grid grid-cols-3 gap-x-8 flex-shrink-0 w-[500px]">
      {/* Action Badge */}
      <div className="flex items-center">
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${actionStyle.bgColor} ${actionStyle.color}`}>
          <span className="mr-1">{actionStyle.icon}</span>
          {actionStyle.label}
        </div>
      </div>

      {/* Entity Info */}
      <div className="flex items-center -ml-[8px] space-x-1">
        <span className="text-gray-500">Entity:</span>
        <span className="font-medium text-gray-900 truncate">{log.entityName}</span>
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-1">
        <span className="text-gray-500">User:</span>
        <span className="font-medium text-gray-900 truncate">{log.userEmail}</span>
      </div>
    </div>

    {/* Right side */}
    <div className="flex items-center space-x-3">
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">{date}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>

      {/* Expand/Collapse Icon */}
      <div className="text-gray-400">
        <svg 
          className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
</div>




      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Log ID:</span>
                <span className="ml-2 text-gray-900">{log.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Action:</span>
                <span className="ml-2 text-gray-900">{actionStyle.label}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Entity:</span>
                <span className="ml-2 text-gray-900">{log.entityName}</span>
              </div>
            </div>

            {/* Changes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Changes
              </h4>
              <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                {renderChanges()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
