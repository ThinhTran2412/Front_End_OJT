import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import logoImg from '../../assets/icons/logo.png';
import {
  TextField,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    identifyNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const navigate = useNavigate();

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
    // Clear error messages when user starts typing (but not success messages)
    if (errorMessage && errorType !== 'success') {
      setErrorMessage('');
      setErrorType('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email cannot be blank';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password cannot be blank';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Full Name validation
    if (!formData.fullName) {
      newErrors.fullName = 'Full Name cannot be blank';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters';
    }

    // Identify Number validation
    if (!formData.identifyNumber) {
      newErrors.identifyNumber = 'Identify Number cannot be blank';
    } else if (!/^\d{9}$|^\d{12}$/.test(formData.identifyNumber)) {
      newErrors.identifyNumber = 'Identify Number must be 9 or 12 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setErrorMessage('Please fix the validation errors');
      setErrorType('validation');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setErrorType('');

    try {
      const response = await api.post('/Registers', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        identifyNumber: formData.identifyNumber
      });

      if (response.status === 200 || response.status === 201) {
        setErrorMessage('Account created successfully!');
        setErrorType('success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 409) {
        setErrorMessage('Email already exists. Please use a different email.');
        setErrorType('conflict');
      } else if (error.response?.status === 400) {
        setErrorMessage(error.response.data?.message || 'Invalid registration data');
        setErrorType('validation');
      } else {
        setErrorMessage('Registration failed. Please try again.');
        setErrorType('error');
      }
    } finally {
      setIsLoading(false);
    }
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

      {/* Logo - Top Left */}
      <div className="absolute top-6 left-6 flex items-center space-x-4">
        <img src={logoImg} alt="Logo" className="w-20 h-20 object-contain" />
        <div className="p-2">
          <span className="text-blue-800 text-2xl font-bold">Laboratory Management</span>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Register Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-delay">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21Z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 text-sm">
              Join Laboratory Management System
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-6 p-4 rounded-xl border-l-4 animate-fade-in ${
              errorType === 'success' 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : errorType === 'validation'
                ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                : errorType === 'conflict'
                ? 'bg-orange-50 border-orange-500 text-orange-700'
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              <div className="font-medium text-sm">
                {errorMessage}
              </div>
              {errorType === 'validation' && (
                <div className="text-xs mt-1 opacity-75">
                  Please correct the errors above.
                </div>
              )}
              {errorType === 'conflict' && (
                <div className="text-xs mt-1 opacity-75">
                  Please use a different email address.
                </div>
              )}
              {errorType === 'success' && (
                <div className="text-xs mt-1 opacity-75">
                  Redirecting to login page...
                </div>
              )}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-delay-2">
            {/* Full Name Field */}
            <div className="animate-fade-in-delay-3">
              <TextField
                fullWidth
                id="fullName"
                name="fullName"
                label="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field */}
            <div className="animate-fade-in-delay-4">
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                placeholder="Enter your email"
              />
            </div>

            {/* Identify Number Field */}
            <div className="animate-fade-in-delay-5">
              <TextField
                fullWidth
                id="identifyNumber"
                name="identifyNumber"
                label="Identify Number"
                value={formData.identifyNumber}
                onChange={handleChange}
                error={!!errors.identifyNumber}
                helperText={errors.identifyNumber}
                required
                inputProps={{ maxLength: 12 }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                placeholder="Enter your ID number (9 or 12 digits)"
              />
            </div>

            {/* Password Field */}
            <div className="animate-fade-in-delay-6">
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
            </div>

            {/* Links */}
            <div className="text-center text-sm text-gray-600 animate-fade-in-delay-7">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors">
                Sign In
              </a>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg animate-fade-in-delay-8"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}