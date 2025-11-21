import { useEffect, useRef } from 'react';
import AppRouter from './routes/App_Route';
import { useAuthStore } from './store/authStore';
import api from './services/api';
import ExportNotificationContainer from './components/TestOrder_Management/ExportNotificationContainer';
import jobManager from './utils/BackgroundJobManager';

export default function App({ children }) {
  const { initializeAuth } = useAuthStore();
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const decodeJwtExp = (token) => {
      try {
        const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payloadBase64.padEnd(payloadBase64.length + (4 - (payloadBase64.length % 4)) % 4, '=');
        const payload = JSON.parse(atob(padded));
        return typeof payload.exp === 'number' ? payload.exp : null;
      } catch {
        return null;
      }
    };

    const refreshToken = async () => {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      if (!currentRefreshToken) return;

      try {
        const res = await api.post('/Auth/refresh', { refreshToken: currentRefreshToken });
        if (res.status === 200 && res.data?.accessToken && res.data?.refreshToken) {
          localStorage.setItem('accessToken', res.data.accessToken);
          localStorage.setItem('refreshToken', res.data.refreshToken);
          scheduleRefresh();
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    };

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);

      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const exp = decodeJwtExp(token);
      if (!exp) return;

      const delay = Math.max(exp * 1000 - Date.now() - 15000, 0);
      refreshTimeoutRef.current = setTimeout(refreshToken, delay);
    };

    scheduleRefresh();

    const handleVisibility = () => scheduleRefresh();
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      jobManager.clearAll();
    };
    
    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken' && !e.newValue) {
        handleLogout();
      }
    });

    return () => {
      window.removeEventListener('storage', handleLogout);
    };
  }, []);

  return (
    <>
      {children || <AppRouter />}
      <ExportNotificationContainer />
    </>
  );
}
