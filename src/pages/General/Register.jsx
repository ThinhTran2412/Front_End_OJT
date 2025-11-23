import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email. Please enter in correct format.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password cannot be left blank.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, numbers and special characters.';
    }

    // Full name validation
    if (!formData.fullName) {
      newErrors.fullName = 'Full Name cannot be blank';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name cannot contain numbers or special characters.';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters.';
    }

    // identifyNumber validation
    if (!formData.identifyNumber) {
      newErrors.identifyNumber = 'Identify Number cannot be blank';
    } else if (!/^\d{9}$|^\d{12}$/.test(formData.identifyNumber)) {
      newErrors.identifyNumber = 'Identify Number must have 9 or 12 digits.';
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
    setErrorMessage('');
    setErrorType('');

    try {
      const response = await api.post('/Registers', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        identifyNumber: formData.identifyNumber
      });
      
      // Code 201: Created (Success)
      if (response.status === 201) {
        // Clear form data
        setFormData({
          email: '',
          password: '',
          fullName: '',
          identifyNumber: ''
        });
        
        // Show success message
        setErrorMessage('Registration successful! Please login with your credentials.');
        setErrorType('success');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please login with your credentials.',
              type: 'success'
            }
          });
        }, 2000); // Wait 2 seconds to show success message
      }
    } catch (error) {
      console.error('Registration error:', error);
      const status = error.response?.status;
      const data = error.response?.data;

      console.log('Response status:', status);
      console.log('Response data:', data);

      if (status === 400) {
        // Code 400: Bad Request
        setErrorMessage(data.detail || 'Invalid registration data');
        setErrorType('validation');
      } else if (status === 409) {
        // Code 409: Conflict (email already exists)
        setErrorMessage(data.detail || 'Email already exists');
        setErrorType('conflict');
      } else {
        // Other errors
        setErrorMessage('Registration failed. Please try again.');
        setErrorType('general');
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
      <div className="absolute top-6 left-6 animate-fade-in">
        <div className="flex items-center space-x-2 group cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-xl font-bold text-blue-800 group-hover:text-blue-900 transition-colors duration-300">Register Page</span>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Register Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-white/20 animate-slide-up">
          {/* Header */}
          <div className="text-center mb-6 animate-fade-in-delay">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-1">
              Create Account
            </h1>
            <p className="text-gray-600 text-sm">
              Join Laboratory Management System
            </p>
          </div>

          {/* Success/Error Message */}
          {errorMessage && (
            <div className={`mb-4 p-4 border rounded-xl text-sm animate-shake ${
              errorType === 'conflict' 
                ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 text-red-800 shadow-lg' 
                : 'bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-600 shadow-md'
            }`}>
              <div className="flex items-center">
                {errorType === 'success' && (
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {errorType === 'conflict' && (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 animate-pulse">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  {errorType === 'conflict' && (
                    <p className="text-xs mt-1 text-red-500">
                      Please use a different email address.
                    </p>
                  )}
                  {errorType === 'success' && (
                    <p className="text-xs mt-1 text-green-500">
                      Redirecting to login page...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-delay-2" noValidate>
            {/* Email Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Email <span className="text-red-500">*</span>
                </label>
                {errors.email && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.email}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.email ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Password <span className="text-red-500">*</span>
                </label>
                {errors.password && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.password}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-16 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.password ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 flex items-center border-l border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-r-lg group"
                >
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Full Name Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {errors.fullName && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.fullName}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.fullName ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* identifyNumber Field */}
            <div className="group">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="identifyNumber" className="text-sm font-medium text-gray-700 group-focus-within:text-blue-600 transition-colors duration-200">
                  Identify Number <span className="text-red-500">*</span>
                </label>
                {errors.identifyNumber && (
                  <span className="text-xs text-red-600 animate-fade-in">{errors.identifyNumber}</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="identifyNumber"
                  name="identifyNumber"
                  value={formData.identifyNumber}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    errors.identifyNumber ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                  }`}
                  placeholder="Enter your Identify Number (9 or 12 digits)"
                  maxLength="12"
                />
              </div>
            </div>

            {/* Links */}
            <div className="flex justify-center items-center text-sm animate-fade-in-delay-3">
              <span className="text-gray-600">
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200 hover:scale-105 transform font-medium"
                >
                  Login
                </a>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 animate-fade-in-delay-4">
              {/* Create Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Account
                  </div>
                )}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 bg-white text-gray-700 py-2.5 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
