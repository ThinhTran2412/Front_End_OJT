import { useEffect, useState, useCallback, useRef } from 'react';
import ExportProgressNotification from './ExportProgressNotification';
import backgroundJobManager from '../../utils/BackgroundJobManager';
import { saveJobsToStorage, loadJobsFromStorage, clearJobsFromStorage } from '../../utils/jobPersistence';
import { getDisplayableJobIds } from '../../utils/jobFilters';

/**
 * Export Notification Container
 * Manages multiple export notifications at bottom-right
 * Persists across page navigation (until logout)
 */
export default function ExportNotificationContainer() {
  const [activeJobs, setActiveJobs] = useState([]);
  const closedJobsRef = useRef(new Set()); // Track manually closed jobs
  const updateTimeoutRef = useRef(null);

  const updateActiveJobs = useCallback(() => {
    // Clear any pending update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce updates to prevent excessive re-renders
    updateTimeoutRef.current = setTimeout(() => {
      const allJobs = backgroundJobManager.getAllJobs();
      const displayableIds = getDisplayableJobIds(allJobs);
      
      // Filter out closed jobs
      const filteredIds = displayableIds.filter(id => !closedJobsRef.current.has(id));
      
      // Deduplicate job IDs
      const uniqueIds = Array.from(new Set(filteredIds));
      
      setActiveJobs(prev => {
        const prevSet = new Set(prev);
        const uniqueSet = new Set(uniqueIds);
        
        // Only update if there's an actual change
        if (prev.length !== uniqueIds.length) {
          return uniqueIds;
        }
        
        for (const id of uniqueIds) {
          if (!prevSet.has(id)) {
            return uniqueIds;
          }
        }
        
        for (const id of prev) {
          if (!uniqueSet.has(id)) {
            return uniqueIds;
          }
        }
        
        return prev; // No change, return previous state
      });
      
      saveJobsToStorage(allJobs);
    }, 100); // 100ms debounce
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadPersistedJobs = () => {
      const jobs = loadJobsFromStorage();
      jobs.forEach(job => {
        if (job.jobId) {
          // Only register if not already exists
          const existing = backgroundJobManager.getJob(job.jobId);
          if (!existing) {
            backgroundJobManager.registerJob(job.jobId, job);
            
            if (job.status === 'pending' || job.status === 'processing') {
              backgroundJobManager.startPolling(job.jobId, async (id) => {
                const { getExportJobStatus } = await import('../../services/TestOrderService');
                return await getExportJobStatus(id);
              }, 2000);
            }
          }
        }
      });
    };

    loadPersistedJobs();

    const unsubscribes = new Map();
    const subscribeToJob = (jobId) => {
      if (unsubscribes.has(jobId) || !isMounted) return;
      
      const unsubscribe = backgroundJobManager.subscribe(jobId, () => {
        if (isMounted) {
          updateActiveJobs();
        }
      });
      unsubscribes.set(jobId, unsubscribe);
    };

    // Subscribe to existing jobs
    backgroundJobManager.getAllJobs().forEach(job => {
      if (job.jobId) {
        subscribeToJob(job.jobId);
      }
    });

    // Check for new jobs periodically (less frequent)
    const checkInterval = setInterval(() => {
      if (!isMounted) return;
      
      const allJobs = backgroundJobManager.getAllJobs();
      allJobs.forEach(job => {
        if (job.jobId && !unsubscribes.has(job.jobId)) {
          subscribeToJob(job.jobId);
        }
      });
      if (isMounted) {
        updateActiveJobs();
      }
    }, 2000); // Increased interval to reduce frequency

    const handleNewJob = (event) => {
      if (!isMounted) return;
      
      const { jobId } = event.detail;
      if (jobId && !unsubscribes.has(jobId)) {
        subscribeToJob(jobId);
        updateActiveJobs();
      }
    };

    window.addEventListener('exportJobRegistered', handleNewJob);
    updateActiveJobs();

    return () => {
      isMounted = false;
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      clearInterval(checkInterval);
      window.removeEventListener('exportJobRegistered', handleNewJob);
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [updateActiveJobs]);

  const handleJobComplete = (jobId) => {
    setTimeout(() => {
      closedJobsRef.current.add(jobId);
      setActiveJobs(prev => prev.filter(id => id !== jobId));
      backgroundJobManager.removeJob(jobId);
      const allJobs = backgroundJobManager.getAllJobs();
      saveJobsToStorage(allJobs);
    }, 5000);
  };

  const handleJobClose = (jobId) => {
    // Mark as closed to prevent re-adding
    closedJobsRef.current.add(jobId);
    setActiveJobs(prev => prev.filter(id => id !== jobId));
  };

  useEffect(() => {
    const handleLogout = () => {
      activeJobs.forEach(jobId => {
        backgroundJobManager.removeJob(jobId);
      });
      clearJobsFromStorage();
      setActiveJobs([]);
    };

    window.addEventListener('logout', handleLogout);
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, [activeJobs]);

  // Deduplicate to ensure each jobId only appears once
  const validJobs = Array.from(new Set(
    activeJobs.filter(jobId => jobId && typeof jobId === 'string' && !closedJobsRef.current.has(jobId))
  ));

  if (validJobs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3" style={{ maxWidth: '320px' }}>
      {validJobs.map((jobId) => {
        // Double check to prevent duplicate rendering
        const job = backgroundJobManager.getJob(jobId);
        if (!job || closedJobsRef.current.has(jobId)) return null;
        
        return (
          <div
            key={jobId}
            style={{
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <ExportProgressNotification
              jobId={jobId}
              onClose={() => handleJobClose(jobId)}
              onComplete={() => handleJobComplete(jobId)}
            />
          </div>
        );
      })}
    </div>
  );
}
