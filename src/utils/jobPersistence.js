/**
 * Job Persistence Utility
 * Handle job persistence to localStorage
 */

const STORAGE_KEY = 'export_jobs';
const COMPLETED_NOTIFICATION_DURATION = 30000; // 30 seconds

export const saveJobsToStorage = (jobs) => {
  try {
    const jobsToPersist = jobs
      .filter(job => 
        job.status === 'pending' || 
        job.status === 'processing' || 
        job.status === 'completed'
      )
      .map(job => ({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        exportRequest: job.exportRequest,
        downloadUrl: job.downloadUrl,
        fileName: job.fileName,
        errorMessage: job.errorMessage,
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobsToPersist));
  } catch (error) {
    console.error('Error saving jobs to storage:', error);
  }
};

export const loadJobsFromStorage = () => {
  try {
    const persistedJobs = localStorage.getItem(STORAGE_KEY);
    if (persistedJobs) {
      return JSON.parse(persistedJobs);
    }
  } catch (error) {
    console.error('Error loading jobs from storage:', error);
  }
  return [];
};

export const clearJobsFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing jobs from storage:', error);
  }
};

export const shouldShowCompletedJob = (job) => {
  if (job.downloadUrl) {
    return true;
  }
  
  if (!job.createdAt) return false;
  
  const completedTime = new Date(job.createdAt).getTime();
  const now = Date.now();
  return (now - completedTime) < COMPLETED_NOTIFICATION_DURATION;
};

export { COMPLETED_NOTIFICATION_DURATION };
