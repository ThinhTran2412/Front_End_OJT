import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout';
export default function CreateUser() {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dob: '',
    address: '',
    age: '',
    phoneNumber: '',
    identifyNumber: '',
    email: '',
    roleId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const navigate = useNavigate();

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await api.get('/Roles', {
          params: {
            Page: 1,
            PageSize: 100, // Get maximum 100 roles
            SortBy: 'Name',
            SortDesc: false
          }
        });
        // API returns format { items: [...], page: 1, pageSize: 100, total: 7 }
        const rolesData = response.data?.items || response.data?.data || response.data || [];
        
        // Ensure rolesData is an array
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        } else {
          setRoles([]);
        }
      } catch (error) {
        const status = error.response?.status;
        
        if (status === 401 || status === 403) {
          // No access permission - only Admin can create user
          setErrorMessage('Access denied. Only administrators can create users.');
          setErrorType('unauthorized');
          // Can redirect to dashboard or hide form
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          // Other errors - show error details for debugging
          const errorMessage = error.response?.data?.message || 
                             error.response?.data?.detail || 
                             error.message || 
                             'Failed to load roles. Please refresh the page.';
          setErrorMessage(`Error: ${errorMessage} (Status: ${status || 'Unknown'})`);
          setErrorType('general');
        }
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error messages when user starts typing
    if (errorMessage) {
      setErrorMessage('');
      setErrorType('');
    }
    
    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };


  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName || formData.fullName.trim() === '' || formData.fullName.toLowerCase() === 'null') {
      newErrors.fullName = 'Full Name cannot be blank';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.fullName)) {
      newErrors.fullName = 'Full name cannot contain numbers or special characters.';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters.';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender cannot be blank';
    } else if (!['male', 'female'].includes(formData.gender.toLowerCase())) {
      newErrors.gender = 'Gender can only be selected as Male or Female.';
    }

    // DOB validation
    if (!formData.dob) {
      newErrors.dob = 'Date of birth cannot be left blank.';
    } else {
      const selectedDate = new Date(formData.dob);
      const today = new Date();
      const hundredYearsAgo = new Date();
      hundredYearsAgo.setFullYear(today.getFullYear() - 100);

      if (selectedDate > today) {
        newErrors.dob = 'Date of birth cannot exceed the current date.';
      } else if (selectedDate < hundredYearsAgo) {
        newErrors.dob = 'Invalid date of birth (age too old).';
      }
    }

    // Address validation
    if (!formData.address || formData.address.trim() === '' || formData.address.toLowerCase() === 'null') {
      newErrors.address = 'Address cannot be blank';
    } else if (formData.address.length < 5) {
      newErrors.address = 'Address must be at least 5 characters long.';
    } else if (formData.address.length > 255) {
      newErrors.address = 'The address cannot exceed 255 characters.';
    }

    // Age validation
    if (!formData.age || formData.age.trim() === '' || formData.age.toLowerCase() === 'null') {
      newErrors.age = 'Age cannot be blank';
    } else if (isNaN(formData.age) || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 1 and 120.';
    }

    // Phone number validation
    if (!formData.phoneNumber || formData.phoneNumber.trim() === '' || formData.phoneNumber.toLowerCase() === 'null') {
      newErrors.phoneNumber = 'Phone Number cannot be blank';
    } else if (!/^(\+?\d{9,11})$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Invalid phone number. Please enter 9–11 digits.';
    }

    // identifyNumber validation
    if (!formData.identifyNumber || formData.identifyNumber.trim() === '' || formData.identifyNumber.toLowerCase() === 'null') {
      newErrors.identifyNumber = 'Identify Number cannot be blank';
    } else if (!/^\d{9}$|^\d{12}$/.test(formData.identifyNumber)) {
      newErrors.identifyNumber = 'Identify Number must have 9 or 12 digits.';
    }

    // Email validation
    if (!formData.email || formData.email.trim() === '' || formData.email.toLowerCase() === 'null') {
      newErrors.email = 'Email cannot be blank';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email. Please enter in correct format.';
    }

    // Role validation
    if (!formData.roleId) {
      newErrors.roleId = 'Role cannot be blank';
    }

    // Age and DOB consistency validation
    if (formData.dob && formData.age) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const calculatedAge = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate()) 
        ? calculatedAge - 1 
        : calculatedAge;

      if (parseInt(formData.age) !== actualAge) {
        newErrors.age = `Age must match date of birth. Calculated age is ${actualAge}.`;
        newErrors.dob = `Date of birth must match age. Please verify both fields.`;
      }
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
    setSuccessMessage('');

    try {
      const response = await api.post('/User/create', {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        identifyNumber: formData.identifyNumber,
        gender: formData.gender,
        age: parseInt(formData.age),
        address: formData.address,
        dateOfBirth: formData.dob,
        roleId: parseInt(formData.roleId)
      });

      // Code 201: Success
      if (response.status === 201) {
        // Clear form and show success message
        setFormData({
          fullName: '',
          gender: '',
          dob: '',
          address: '',
          age: '',
          phoneNumber: '',
          identifyNumber: '',
          email: '',
          roleId: ''
        });
        setSuccessMessage('User created successfully!');
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 400) {
        // Code 400: Bad Request
        setErrorMessage(data.detail || 'Invalid user data');
        setErrorType('validation');
      } else if (status === 409) {
        // Code 409: Conflict (email already exists)
        setErrorMessage(data.detail || 'Email already exists');
        setErrorType('conflict');
      } else {
        // Other errors
        setErrorMessage('User creation failed. Please try again.');
        setErrorType('general');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Create User Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CREATE USER</h1>
              <p className="text-gray-600 text-sm">
                Create a new user account with complete information
              </p>
            </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 border rounded text-sm bg-green-50 border-green-200 text-green-600">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">{successMessage}</p>
                  <p className="text-xs mt-1 text-green-500">
                    You can now create another user or go back to dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-4 p-3 border rounded text-sm ${
              errorType === 'conflict'
                ? 'bg-red-100 border-red-300 text-red-800'
                : errorType === 'unauthorized'
                ? 'bg-red-100 border-red-300 text-red-800'
                : 'bg-red-50 border-red-200 text-red-600'
              }`}>
              <div className="flex items-center">
                {(errorType === 'conflict' || errorType === 'unauthorized') && (
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <div>
                  <p className="font-medium">{errorMessage}</p>
                  {errorType === 'conflict' && (
                    <p className="text-xs mt-1 text-red-500">
                      Please use a different email address.
                    </p>
                  )}
                  {errorType === 'unauthorized' && (
                    <p className="text-xs mt-1 text-red-500">
                      Redirecting to dashboard in 3 seconds...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create User Form - Only show if user has permission */}
          {errorType !== 'unauthorized' && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-black mb-2">
                    Fullname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.fullName 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Gender Field */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-black mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.gender 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Gender...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>

                {/* DOB Field */}
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-black mb-2">
                    Date of birth <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.dob 
                          ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                          : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                      }`}
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {errors.dob && (
                    <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
                  )}
                </div>

                {/* Role Field */}
                <div>
                  <label htmlFor="roleId" className="block text-sm font-medium text-black mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="roleId"
                    name="roleId"
                    value={formData.roleId || ''}
                    onChange={handleChange}
                    disabled={loadingRoles}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.roleId 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    } ${loadingRoles ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {loadingRoles ? 'Loading roles...' : 'Select role...'}
                    </option>
                    {Array.isArray(roles) && roles.map((role) => (
                      <option key={role.id || role.roleId} value={role.id || role.roleId}>
                        {role.roleName || role.name}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && (
                    <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Age Field */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-black mb-2">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.age 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="Enter age"
                    min="1"
                    max="120"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                {/* Phone Number Field */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-black mb-2">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.phoneNumber 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* identifyNumber Field */}
                <div>
                  <label htmlFor="identifyNumber" className="block text-sm font-medium text-black mb-2">
                    Identify Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="identifyNumber"
                    name="identifyNumber"
                    value={formData.identifyNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.identifyNumber 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="Enter Identify Number (9 or 12 digits)"
                    maxLength="12"
                  />
                  {errors.identifyNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.identifyNumber}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

              </div>
            </div>

            {/* Address Field — FULL WIDTH */}
            <div className="col-span-full">
              <label htmlFor="address" className="block text-sm font-medium text-black mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.address 
                    ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                    : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                }`}
                placeholder="Enter complete address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              {/* Create Button */}
              <button
                type="submit"
                disabled={isLoading || loadingRoles}
                className="flex-1 bg-custom-dark-blue text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Creating User...' : 'Create User'}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
              >
                Cancel
              </button>
            </div>
          </form>
          )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
