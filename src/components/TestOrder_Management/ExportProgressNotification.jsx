import { CheckCircle, XCircle, X, Download, FileSpreadsheet } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import backgroundJobManager from '../../utils/BackgroundJobManager';
import { getExportJobStatus, downloadExportedFile } from '../../services/TestOrderService';
import { downloadFile, generateExportFileName } from '../../utils/fileUtils';

/**
 * Export Progress Notification
 * Small popup at bottom-right corner
 * Shows file name and progress bar
 * Auto-downloads when complete (only once)
 */
export default function ExportProgressNotification({
  jobId,
  onClose,
  onComplete
}) {
  const [jobInfo, setJobInfo] = useState(null);
  const [autoDownloaded, setAutoDownloaded] = useState(false);
  const downloadTriggeredRef = useRef(false);
  const mountedRef = useRef(false);

  const handleAutoDownload = async () => {
    // Check global download status first
    if (backgroundJobManager.isJobDownloaded(jobId)) {
      setAutoDownloaded(true);
      return;
    }
    
    if (downloadTriggeredRef.current || autoDownloaded || !jobId) {
      return;
    }
    
    downloadTriggeredRef.current = true;
    backgroundJobManager.markJobAsDownloaded(jobId);
    
    try {
      setAutoDownloaded(true);
      const blob = await downloadExportedFile(jobId);
      const filename = jobInfo?.fileName || generateExportFileName();
      downloadFile(blob, filename);
      
      setTimeout(() => {
        onComplete && onComplete();
      }, 5000);
    } catch (error) {
      console.error('Error auto-downloading file:', error);
      downloadTriggeredRef.current = false;
      backgroundJobManager.downloadedJobs.delete(jobId);
      setAutoDownloaded(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    
    let unsubscribe = null;

    unsubscribe = backgroundJobManager.subscribe(jobId, (updatedJob) => {
      if (updatedJob) {
        setJobInfo(updatedJob);
      }
    });

    const initialJob = backgroundJobManager.getJob(jobId);
    
    if (initialJob) {
      setJobInfo(initialJob);
      
      // Check if already downloaded
      if (backgroundJobManager.isJobDownloaded(jobId)) {
        setAutoDownloaded(true);
      }
      
      if (initialJob.status === 'pending' || initialJob.status === 'processing') {
        backgroundJobManager.startPolling(jobId, getExportJobStatus, 2000);
      }
    } else {
      backgroundJobManager.startPolling(jobId, getExportJobStatus, 2000);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [jobId]);
  
  // Auto-download effect - only trigger once globally
  useEffect(() => {
    if (
      jobInfo?.status === 'completed' && 
      jobInfo?.downloadUrl && 
      !autoDownloaded && 
      !downloadTriggeredRef.current && 
      !backgroundJobManager.isJobDownloaded(jobId) &&
      jobId
    ) {
      // Use setTimeout to ensure this only runs once even if effect re-runs
      const timeoutId = setTimeout(() => {
        if (!downloadTriggeredRef.current && !backgroundJobManager.isJobDownloaded(jobId)) {
          handleAutoDownload();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobInfo?.status, jobInfo?.downloadUrl]);

  const handleManualDownload = async () => {
    if (!jobId || !jobInfo?.downloadUrl) return;
    
    try {
      const blob = await downloadExportedFile(jobId);
      const filename = jobInfo?.fileName || generateExportFileName();
      downloadFile(blob, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleClose = () => {
    // Don't trigger download on close
    onClose && onClose();
  };

  const getStatusIcon = () => {
    if (!jobInfo) return null;
    
    switch (jobInfo.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-blue-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    if (!jobInfo) return 'Initializing...';
    
    switch (jobInfo.status) {
      case 'pending':
        return 'Initializing...';
      case 'processing':
        return `Creating file... ${jobInfo.progress || 0}%`;
      case 'completed':
        return autoDownloaded ? 'Downloaded!' : 'Completed!';
      case 'failed':
        return 'An error occurred';
      default:
        return 'Processing...';
    }
  };

  const getFileName = () => {
    if (jobInfo?.exportRequest) {
      const { testOrderIds } = jobInfo.exportRequest;
      if (testOrderIds && testOrderIds.length > 0) {
        return `Test Orders (${testOrderIds.length} orders).xlsx`;
      }
    }
    return jobInfo?.fileName || 'Test Orders.xlsx';
  };

  const canDownload = jobInfo?.status === 'completed' && jobInfo?.downloadUrl;
  const isProcessing = jobInfo?.status === 'pending' || jobInfo?.status === 'processing';
  const isCompleted = jobInfo?.status === 'completed';
  const isFailed = jobInfo?.status === 'failed';

  if (!jobInfo) return null;

  return (
    <div 
      className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
      style={{ borderRadius: '10px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold text-sm text-gray-900">Export Excel</span>
          {jobInfo.status && (
            <span 
              className={`text-xs px-2 py-0.5 rounded ${
                isCompleted ? 'bg-green-100 text-green-800' : 
                isFailed ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'
              }`}
            >
              {jobInfo.status}
            </span>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-2">
        <p className="text-xs text-gray-600 truncate" title={getFileName()}>
          {getFileName()}
        </p>
      </div>

      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-600' :
              isFailed ? 'bg-red-600' :
              'bg-blue-600'
            }`}
            style={{ width: `${jobInfo.progress || 0}%` }}
          />
        </div>
        {isProcessing && (
          <p className="text-xs text-gray-600 mt-1">{jobInfo.progress || 0}%</p>
        )}
      </div>

      <div className="mb-3">
        <p className="text-xs text-gray-700">{getStatusText()}</p>
      </div>

      {canDownload && !autoDownloaded && (
        <button
          onClick={handleManualDownload}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
        >
          <Download className="w-3 h-3" />
          Download File
        </button>
      )}

      {isCompleted && autoDownloaded && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>File has been automatically downloaded</span>
        </div>
      )}

      {isFailed && (
        <p className="text-xs text-red-600">{jobInfo.errorMessage || 'Unknown error'}</p>
      )}
    </div>
  );
}
