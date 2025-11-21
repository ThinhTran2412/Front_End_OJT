import { useState, useEffect } from 'react';
import api from '../services/api';

export function useEventLogs() {
  const [eventLogs, setEventLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEventLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/AuditLog');
      
      if (response.status === 200) {
        // Sort by timestamp descending (newest first)
        const sortedLogs = response.data.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setEventLogs(sortedLogs);
      }
    } catch (err) {
      console.error('Error fetching event logs:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshEventLogs = () => {
    fetchEventLogs();
  };

  useEffect(() => {
    fetchEventLogs();
  }, []);

  return {
    eventLogs,
    loading,
    error,
    refreshEventLogs
  };
}

