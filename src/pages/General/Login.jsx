import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import logoImg from '../../assets/icons/logo.png';
import {
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Box,
  Typography,
  Paper,
  Container
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';


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

  const getUserFromStorage = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const resolveHomePath = () => {
    const storedUser = getUserFromStorage();
    const rawPrivileges =
      storedUser?.privileges ||
      storedUser?.Privilege ||
      storedUser?.Privileges ||
      [];

    let privileges = rawPrivileges;
    if (typeof privileges === 'string') privileges = [privileges];
    if (!Array.isArray(privileges)) privileges = [];

    const hasViewUser = privileges.includes('VIEW_USER');

    // Default user (no VIEW_USER privilege) -> go to own medical records
    return hasViewUser ? '/home' : '/home';
  };

  // Check if already logged in then redirect to dashboard
  useEffect(() => {
    initializeAuth();
    if (isAuthenticated) {
      navigate(resolveHomePath(), { replace: true });
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
        
        // Navigate based on privileges
        navigate(resolveHomePath());
      }
    } catch (error) {
      console.error('Login error:', error);
      const status = error.response?.status;
      const data = error.response?.data;
    
      console.log('Response status:', status);
      console.log('Response data:', data);
    
      // Extract error message from backend
      let backendMessage = '';
      
      // Try to get the actual error message from different possible locations
      if (data?.title) {
        backendMessage = data.title;
      } else if (data?.detail) {
        backendMessage = data.detail;
      } else if (data?.message) {
        backendMessage = data.message;
      } else if (typeof data === 'string') {
        backendMessage = data;
      }
    
      // Extract only the main error message (first line before stack trace)
      // Extract only the main error message (first line before stack trace)
      if (backendMessage) {
        // Split by newline and take only the first line
        const firstLine = backendMessage.split('\n')[0].trim();
        // Remove "Exception:" suffix if exists
        backendMessage = firstLine.replace(/Exception:\s*$/, '').trim();
        // Remove exception class name prefix (e.g., "IAM_Service.Application.Common.Exceptions.AccountLockedException:")
        backendMessage = backendMessage.replace(/^[\w.]+Exception:\s*/, '').trim();
      }
    
      if (status === 401) {
        // Code 401: Invalid Credentials
        setErrorMessage(backendMessage || 'Invalid credentials. Please check your email and password.');
        setErrorType('unauthorized');
      } else if (status === 403 || status === 429) {
        // Code 403/429: Account Locked
        setErrorMessage(backendMessage || 'Your account is locked due to multiple failed login attempts.');
        setErrorType('locked');
      } else if (status === 400) {
        // Code 400: Bad Request (validation errors, etc.)
        setErrorMessage(backendMessage || 'Invalid request. Please check your input.');
        setErrorType('validation');
      } else {
        // Other errors
        setErrorMessage(backendMessage || 'Login failed. Please try again.');
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
        {/* Logo with link to home */}
        <Link to="/home" className="flex items-center space-x-4 hover:opacity-80 transition-opacity duration-200">
          <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" />
          
          {/* Extra div next to logo */}
          <div className="p-2">
            <span className="text-blue-800 text-2xl font-bold hover:text-blue-900 transition-colors duration-200">
              Laboratory Management
            </span>
          </div>
        </Link>
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
            <div className="mb-4 text-center">
              <p className={`text-sm font-medium ${errorType === 'locked' ? 'text-red-600' : 'text-red-600'}`}>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} noValidate>
            {/* Email Field */}
            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              placeholder="Enter your email"
            />

            {/* Password Field */}
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              required
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              placeholder="Enter your password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Links */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                component="a" 
                href="/forgot-password" 
                variant="body2" 
                sx={{ 
                  color: 'primary.main', 
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Forgot password?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Typography 
                  component="a" 
                  href="/register" 
                  sx={{ 
                    color: 'primary.main', 
                    textDecoration: 'none',
                    fontWeight: 'medium',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Register
                </Typography>
              </Typography>
            </Box>

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? null : <LoginIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                },
                '&:disabled': {
                  background: 'rgba(0, 0, 0, 0.12)',
                }
              }}
            >
              {isLoading ? 'Logging in...' : 'Sign In'}
            </Button>

            {/* Separator */}
            <Box sx={{ position: 'relative', my: 3 }}>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', borderTop: 1, borderColor: 'grey.300' }} />
              </Box>
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Typography variant="body2" sx={{ px: 2, bgcolor: 'white', color: 'grey.500', fontWeight: 'medium' }}>
                  Or continue with
                </Typography>
              </Box>
            </Box>

            {/* Google Login Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              fullWidth
              variant="outlined"
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: 'grey.300',
                color: 'grey.700',
                '&:hover': {
                  bgcolor: 'grey.50',
                  borderColor: 'grey.400',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 20, height: 20, marginRight: 12 }} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Box>
            </Button>
          </Box>
        </div>
      </div>
    </div>
  );
}