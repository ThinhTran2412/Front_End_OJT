import { useEffect } from 'react';
import api from '../services/api';
import { usePrivilegeStore } from '../store/privilegeStore';
import { useAuthStore } from '../store/authStore';

export const usePrivileges = () => {
  const { privileges, loading, error, setPrivileges, setLoading, setError } = usePrivilegeStore();
  const { isAuthenticated } = useAuthStore();

  const fetchPrivileges = async () => {
    // Check authentication before fetching
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping privileges fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/Privileges');
      
      
      if (response.status === 200) {
        setPrivileges(response.data);
      }
    } catch (error) {
      console.error('Error fetching privileges:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle different types of errors
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access privilege information.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.message || 'Failed to load privileges list');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if authenticated, no data yet and not loading
    if (isAuthenticated && privileges.length === 0 && !loading) {
      fetchPrivileges();
    }
  }, [isAuthenticated]);

  return {
    privileges,
    loading,
    error,
    refetch: fetchPrivileges
  };
};
