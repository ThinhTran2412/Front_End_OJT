import { useEffect } from 'react';
import api from '../services/api';
import { usePrivilegeStore } from '../store/privilegeStore';
import { useAuthStore } from '../store/authStore';

export const usePrivileges = () => {
  const { privileges, loading, error, setPrivileges, setLoading, setError } = usePrivilegeStore();
  const { isAuthenticated } = useAuthStore();

  const fetchPrivileges = async () => {
    if (!isAuthenticated) {
      console.warn('User not authenticated, skipping privileges fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/Privileges');
      
      console.log('✅ Privileges response:', response.data);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        setPrivileges(response.data);
        console.log('✅ Set privileges count:', response.data.length);
      } else {
        console.error('❌ Invalid response format');
        setError('Invalid privileges data format');
        setPrivileges([]);
      }
    } catch (error) {
      console.error('❌ Error fetching privileges:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access privilege information.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.message || 'Failed to load privileges list');
      }
      
      setPrivileges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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