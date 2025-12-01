import axios from "axios";

// API Base URLs for production
const IAM_SERVICE_URL = import.meta.env.VITE_IAM_SERVICE_URL || 'https://iam-service-fz3h.onrender.com';
const LABORATORY_SERVICE_URL = import.meta.env.VITE_LABORATORY_SERVICE_URL || 'https://laboratory-service.onrender.com';

// Unified API Base URL (for Render deployment - routes through Nginx)
// If VITE_API_BASE_URL is set, use it for all API calls (single Nginx endpoint)
const UNIFIED_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Endpoints that should route to IAM Service
const IAM_ENDPOINTS = ['/Auth', '/User', '/Role', '/EventLog', '/PatientInfo', '/Registers'];

// Endpoints that should route to Laboratory Service
const LABORATORY_ENDPOINTS = ['/Patient', '/TestOrder', '/TestResult', '/MedicalRecord', '/ai-review', '/FlaggingConfig', '/Comment', '/Financial'];

// Determine which service to use based on endpoint
const getServiceUrl = (url) => {
  // Priority 1: Use unified API base URL if configured (for Render/Nginx setup)
  if (UNIFIED_API_BASE_URL) {
    return UNIFIED_API_BASE_URL;
  }

  // Priority 2: For Docker/local development: use localhost API through Nginx
  // Always use local API when in development mode or when VITE_USE_LOCAL_API is set
  if (!import.meta.env.PROD || import.meta.env.VITE_USE_LOCAL_API === 'true' || window.location.hostname === 'localhost') {
    // Frontend running on localhost:5173, backend on localhost:80 (Nginx)
    return "http://localhost/api";
  }

  // Priority 3: Production: route to correct service (legacy mode)
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
// Use unified API base URL if configured, otherwise use local or service-specific URLs
const isLocalDev = !import.meta.env.PROD || import.meta.env.VITE_USE_LOCAL_API === 'true' || window.location.hostname === 'localhost';
const defaultBaseURL = UNIFIED_API_BASE_URL || (isLocalDev ? "http://localhost/api" : IAM_SERVICE_URL);

const api = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // Increased to 60 seconds for operations that may take longer (e.g., creating test orders with IAM Service calls)
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    // Get the service URL (handles unified, local, or service-specific routing)
    const serviceUrl = getServiceUrl(config.url);
    config.baseURL = serviceUrl;
    
    // Ensure /api prefix for unified API base URL or local dev
    // Check if baseURL already ends with /api to avoid double prefix
    const baseURLHasApi = config.baseURL && config.baseURL.endsWith('/api');
    
    if (UNIFIED_API_BASE_URL || isLocalDev) {
      // Only add /api prefix if baseURL doesn't already have it
      if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
        if (!baseURLHasApi) {
          config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
        }
      }
    } else if (import.meta.env.PROD) {
      // For service-specific URLs in production, ensure /api prefix only if baseURL doesn't have it
      if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
        if (!baseURLHasApi) {
          config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
        }
      }
    }
    
    // Add ngrok skip browser warning header for ngrok free plan
    // This bypasses ngrok's browser warning page
    if (config.baseURL && config.baseURL.includes('ngrok-free.dev') || config.baseURL && config.baseURL.includes('ngrok.io')) {
      config.headers['ngrok-skip-browser-warning'] = 'true';
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

        // Refresh token should always go to IAM Service or unified API
        const refreshBaseURL = UNIFIED_API_BASE_URL || (isLocalDev ? "http://localhost/api" : IAM_SERVICE_URL);
        const refreshHeaders = { 'Content-Type': 'application/json' };
        
        // Add ngrok skip browser warning header if using ngrok
        if (refreshBaseURL && (refreshBaseURL.includes('ngrok-free.dev') || refreshBaseURL.includes('ngrok.io'))) {
          refreshHeaders['ngrok-skip-browser-warning'] = 'true';
        }
        
        const refreshClient = axios.create({
          baseURL: refreshBaseURL,
          headers: refreshHeaders,
          timeout: 60000, // Increased to 60 seconds to match main axios instance
          withCredentials: false,
        });
        
        // Add /api prefix interceptor for refreshClient
        refreshClient.interceptors.request.use((config) => {
          if (UNIFIED_API_BASE_URL || isLocalDev) {
            if (config.url && !config.url.startsWith('/api/') && !config.url.startsWith('http')) {
              config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
            }
          } else if (import.meta.env.PROD && !import.meta.env.VITE_USE_LOCAL_API) {
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
