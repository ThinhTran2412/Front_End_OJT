/**
 * Job Filter Utilities
 * Filter jobs based on business rules
 */
import { shouldShowCompletedJob } from './jobPersistence';

export const shouldDisplayJob = (job) => {
  if (!job || !job.jobId) return false;
  
  if (job.status === 'pending' || job.status === 'processing') {
    return true;
  }
  
  if (job.status === 'completed') {
    return shouldShowCompletedJob(job);
  }
  
  return false;
};

export const getDisplayableJobIds = (jobs) => {
  return jobs
    .filter(shouldDisplayJob)
    .map(job => job.jobId)
    .filter(Boolean);
};
