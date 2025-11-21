import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import logoImg from '../../assets/icons/logo.png';


export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, initializeAuth } = useAuthStore();

  // Check if already logged in then redirect to dashboard
  useEffect(() => {
    initializeAuth();
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate, initializeAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Clear error messages when user starts typing
    if (errorMessage) {
      setErrorMessage('');
      setErrorType('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email cannot be blank';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format. Please enter a valid email address.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password cannot be left blank.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setErrorMessage('');
    setErrorType('');

    try {
      const response = await api.post('/Auth/login', formData);
      
      console.log('Login response:', response.data);
      console.log('Response structure:', {
        hasUser: !!response.data.user,
        hasRoleId: !!response.data.roleId,
        hasUserId: !!response.data.userId,
        fullData: response.data
      });
      
      // Code 200: Success
      if (response.status === 200) {
        const { accessToken, refreshToken } = response.data;
        
        // Validate tokens exist
        if (!accessToken || !refreshToken) {
          setErrorMessage('Invalid response from server');
          setErrorType('general');
          return;
        }
        
        // Save to localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Update authStore
        // Save entire response.data as user data
        const userData = response.data || null;
        // Save user data to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        login(userData, accessToken, refreshToken, userData?.roleId);
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const status = error.response?.status;
      const data = error.response?.data;

      console.log('Response status:', status);
      console.log('Response data:', data);

      if (status === 401) {
        // Code 401: Unauthorized
        setErrorMessage(data.detail || 'Invalid credentials');
        setErrorType('unauthorized');
      } else if (status === 429) {
        // Code 429: Account Locked
        setErrorMessage(data.detail || 'Account is locked');
        setErrorType('locked');
      } else {
        // Other errors
        setErrorMessage('Login failed. Please try again.');
        setErrorType('general');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300 rounded-full opacity-30 animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-12 h-12 bg-blue-400 rounded-full opacity-25 animate-pulse"></div>

      {/* Logo - Top Left with extra div */}
      <div className="absolute top-6 left-6 flex items-center space-x-4">
        {/* Logo */}
        <img src={logoImg} alt="Logo" className="w-20 h-20 object-contain" />
        
        {/* Extra div next to logo */}
        <div className="p-2">
          <span className="text-blue-800 text-2xl font-bold">Laboratory Management</span>
        </div>
      </div>


      {/* Main Content - Centered */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-delay">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm">
              Sign in to Laboratory Management System
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-4 p-4 border rounded-xl text-sm animate-shake ${
              errorType === 'locked' 
                ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-800 shadow-lg' 
                : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-600 shadow-md'
            }`}>
              <div className="flex items-center">
                {errorType === 'locked' && (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  {errorType === 'unauthorized' && (
                    <p className="text-xs mt-1 text-red-500">
                      Please check your credentials and try again.
                    </p>
                  )}
                  {errorType === 'locked' && (
                    <p className="text-xs mt-1 text-red-500">
                      Your account has been temporarily locked due to multiple failed login attempts.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-delay-2" noValidate>
            {/* Email Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Email <span className="text-red-500">*</span>
                </label>
                {errors.email && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.email}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.email ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Password <span className="text-red-500">*</span>
                </label>
                {errors.password && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.password}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-20 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.password ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 flex items-center border-l border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-r-xl group"
                >
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 mr-2 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                  <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors duration-200">{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
            </div>

            {/* Links */}
            <div className="flex justify-between items-center text-sm animate-fade-in-delay-3">
              <a href="/forgot-password" className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 hover:scale-105 transform">
                Forgot password?
              </a>
              <span className="text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 hover:scale-105 transform font-medium">
                  Register
                </a>
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md animate-fade-in-delay-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sign In
                </div>
              )}
            </button>

            {/* Separator */}
            <div className="relative animate-fade-in-delay-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm animate-fade-in-delay-6"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

