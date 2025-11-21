import axios from "axios";

// API Base URLs for production
const IAM_SERVICE_URL = import.meta.env.VITE_IAM_SERVICE_URL || 'https://iam-service-fz3h.onrender.com';
const LABORATORY_SERVICE_URL = import.meta.env.VITE_LABORATORY_SERVICE_URL || 'https://laboratory-service.onrender.com';

// Endpoints that should route to IAM Service
const IAM_ENDPOINTS = ['/Auth', '/User', '/Role', '/EventLog', '/PatientInfo', '/Registers'];

// Endpoints that should route to Laboratory Service
const LABORATORY_ENDPOINTS = ['/Patient', '/TestOrder', '/TestResult', '/MedicalRecord', '/ai-review'];

// Determine which service to use based on endpoint
const getServiceUrl = (url) => {
  if (!import.meta.env.PROD) {
    // Development: use proxy
    return "/api";
  }

  // Production: route to correct service
  if (!url) return IAM_SERVICE_URL; // Default to IAM Service

  // Check if URL starts with any IAM endpoint
  const isIAMEndpoint = IAM_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
  if (isIAMEndpoint) {
    return IAM_SERVICE_URL;
  }

  // Check if URL starts with any Laboratory endpoint
  const isLaboratoryEndpoint = LABORATORY_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
  if (isLaboratoryEndpoint) {
    return LABORATORY_SERVICE_URL;
  }

  // Default to IAM Service for unknown endpoints
  return IAM_SERVICE_URL;
};

// Current Axios configuration 
const api = axios.create({
  baseURL: import.meta.env.PROD ? IAM_SERVICE_URL : "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // Increased to 60 seconds for operations that may take longer (e.g., creating test orders with IAM Service calls)
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    // In production, route to correct service based on endpoint
    if (import.meta.env.PROD) {
      const serviceUrl = getServiceUrl(config.url);
      config.baseURL = serviceUrl;
      
      // Ensure /api prefix
      if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
      }
    }
    
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // Suppress console errors for expected 404s on AI review endpoints
    if (status === 404 && originalRequest?.url?.includes('/ai-review/')) {
      // This is expected - test orders without AI review enabled will return 404
      // Don't log to console to avoid noise
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !window.location.pathname.includes('/login') &&
      !originalRequest?.url?.includes('/Auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        // Refresh token should always go to IAM Service
        const refreshClient = axios.create({
          baseURL: import.meta.env.PROD ? IAM_SERVICE_URL : "/api",
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000, // Increased to 60 seconds to match main axios instance
          withCredentials: false,
        });
        
        // Add /api prefix interceptor for refreshClient too
        refreshClient.interceptors.request.use((config) => {
          if (import.meta.env.PROD) {
            if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
              config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
            }
          }
          return config;
        });

        const refreshResponse = await refreshClient.post('/Auth/refresh', { refreshToken });
        if (refreshResponse.status === 200) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data || {};
          if (!newAccessToken || !newRefreshToken) {
            throw new Error('Invalid refresh response');
          }

          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // fallthrough
      }

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // no-op
      }
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
