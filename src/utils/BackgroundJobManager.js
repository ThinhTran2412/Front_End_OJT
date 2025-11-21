/**
 * Background Job Manager
 * Manages multiple background export jobs (Non-blocking)
 * Allows users to continue working while exports run in background
 */
class BackgroundJobManager {
  constructor() {
    if (BackgroundJobManager.instance) {
      return BackgroundJobManager.instance;
    }

    this.jobs = new Map();
    this.listeners = new Map();
    this.pollingIntervals = new Map();
    this.downloadedJobs = new Set(); // Track which jobs have been downloaded

    BackgroundJobManager.instance = this;
  }

  registerJob(jobId, jobInfo) {
    // Prevent duplicate registration
    if (this.jobs.has(jobId)) {
      return;
    }
    
    const createdAt = jobInfo?.createdAt || new Date().toISOString();
    
    const jobData = {
      ...jobInfo,
      jobId,
      status: jobInfo.status || 'pending',
      progress: jobInfo.progress || 0,
      createdAt,
    };
    
    this.jobs.set(jobId, jobData);
    this.notifyListeners(jobId);
    this.dispatchJobRegisteredEvent(jobId);
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates);
      job.jobId = jobId;
      this.jobs.set(jobId, job);
      this.notifyListeners(jobId);
    }
  }

  getJob(jobId) {
    const job = this.jobs.get(jobId);
    return job ? { ...job, jobId } : null;
  }

  getAllJobs() {
    return Array.from(this.jobs.entries()).map(([jobId, jobData]) => ({
      ...jobData,
      jobId,
    }));
  }

  getActiveJobs() {
    return this.getAllJobs().filter(
      job => job.status === 'pending' || job.status === 'processing'
    );
  }

  subscribe(jobId, callback) {
    if (!this.listeners.has(jobId)) {
      this.listeners.set(jobId, new Set());
    }
    this.listeners.get(jobId).add(callback);
    return () => {
      const callbacks = this.listeners.get(jobId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(jobId);
        }
      }
    };
  }

  notifyListeners(jobId) {
    const callbacks = this.listeners.get(jobId);
    if (callbacks) {
      const job = this.jobs.get(jobId);
      if (job) {
        const jobWithId = { ...job, jobId };
        callbacks.forEach(callback => {
          try {
            callback(jobWithId);
          } catch (error) {
            console.error('Error in job listener callback:', error);
          }
        });
      }
    }
  }

  startPolling(jobId, statusChecker, interval = 2000) {
    this.stopPolling(jobId);
    
    const poll = async () => {
      try {
        const status = await statusChecker(jobId);
        if (status) {
          this.updateJob(jobId, status);
          if (status.status === 'completed' || status.status === 'failed') {
            this.stopPolling(jobId);
          }
        }
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
        this.updateJob(jobId, {
          status: 'failed',
          errorMessage: error.message || 'Failed to check job status',
        });
        this.stopPolling(jobId);
      }
    };
    
    poll();
    const intervalId = setInterval(poll, interval);
    this.pollingIntervals.set(jobId, intervalId);
  }

  stopPolling(jobId) {
    const intervalId = this.pollingIntervals.get(jobId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(jobId);
    }
  }

  removeJob(jobId) {
    this.stopPolling(jobId);
    this.jobs.delete(jobId);
    this.listeners.delete(jobId);
    this.downloadedJobs.delete(jobId);
  }

  markJobAsDownloaded(jobId) {
    this.downloadedJobs.add(jobId);
  }

  isJobDownloaded(jobId) {
    return this.downloadedJobs.has(jobId);
  }

  cleanupOldJobs(maxAge = 60 * 60 * 1000) {
    const now = Date.now();
    const jobsToRemove = [];
    
    this.jobs.forEach((job, jobId) => {
      if (job.status === 'completed' || job.status === 'failed') {
        const createdAt = new Date(job.createdAt).getTime();
        if (now - createdAt > maxAge) {
          jobsToRemove.push(jobId);
        }
      }
    });
    
    jobsToRemove.forEach(jobId => this.removeJob(jobId));
  }

  dispatchJobRegisteredEvent(jobId) {
    const event = new CustomEvent('exportJobRegistered', { detail: { jobId } });
    window.dispatchEvent(event);
  }
}

const backgroundJobManager = new BackgroundJobManager();

setInterval(() => {
  backgroundJobManager.cleanupOldJobs();
}, 5 * 60 * 1000);

export default backgroundJobManager;
