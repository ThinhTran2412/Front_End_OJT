import { useState, useEffect, useRef } from 'react';
import { X, Save, User } from 'lucide-react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { RingSpinner } from '../Loading';
import dayjs from 'dayjs';
import api from '../../services/api';

// Add custom CSS for animations
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('create-user-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'create-user-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: null,
    address: '',
    age: '',
    phoneNumber: '',
    identifyNumber: '',
    email: '',
    roleId: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Refs for scrolling
  const modalBodyRef = useRef(null);
  const errorAlertRef = useRef(null);

  // Fetch roles from API
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await api.get('/Roles', {
          params: {
            Page: 1,
            PageSize: 100,
            SortBy: 'Name',
            SortDesc: false
          }
        });
        const rolesData = response.data?.items || response.data?.data || response.data || [];
        
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [isOpen]);

  // Auto-scroll to top when errors change
  useEffect(() => {
    if (Object.keys(errors).length > 0 && modalBodyRef.current) {
      // Scroll modal body to top with smooth behavior
      modalBodyRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // If there's an error alert, focus it for accessibility
      if (errorAlertRef.current) {
        setTimeout(() => {
          errorAlertRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 100);
      }
    }
  }, [errors]);

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
    if (!formData.dateOfBirth || !dayjs(formData.dateOfBirth).isValid()) {
      newErrors.dateOfBirth = 'Date of birth cannot be left blank.';
    } else {
      const selectedDate = dayjs(formData.dateOfBirth);
      const today = dayjs();
      const hundredYearsAgo = today.subtract(100, 'year');

      if (selectedDate.isAfter(today)) {
        newErrors.dateOfBirth = 'Date of birth cannot exceed the current date.';
      } else if (selectedDate.isBefore(hundredYearsAgo)) {
        newErrors.dateOfBirth = 'Invalid date of birth (age too old).';
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
    if (formData.dateOfBirth && formData.age) {
      const dobDate = dayjs(formData.dateOfBirth);
      const today = dayjs();
      const calculatedAge = today.diff(dobDate, 'year');
      
      if (parseInt(formData.age) !== calculatedAge) {
        newErrors.age = `Age must match date of birth. Calculated age is ${calculatedAge}.`;
        newErrors.dateOfBirth = `Date of birth must match age. Please verify both fields.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: newDate
    }));
    
    if (errors.dateOfBirth) {
      setErrors(prev => ({
        ...prev,
        dateOfBirth: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      const response = await api.post('/User/create', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        identifyNumber: formData.identifyNumber.trim(),
        gender: formData.gender.trim(),
        age: parseInt(formData.age),
        address: formData.address.trim(),
        dateOfBirth: dayjs(formData.dateOfBirth).format('YYYY-MM-DD'),
        roleId: parseInt(formData.roleId)
      });

      if (response.status === 201) {
        handleReset();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error response:', error.response);
      
      const status = error.response?.status;
      const data = error.response?.data;
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      // Helper function to extract clean error message
      const extractCleanMessage = (text) => {
        if (!text || typeof text !== 'string') return null;
        
        // If it's a stack trace (contains " at " and multiple lines), extract first line
        if (text.includes(' at ') && text.includes('\n')) {
          // Extract first line which typically contains the actual error message
          const firstLine = text.split('\n')[0].trim();
          
          // Remove exception type prefix (e.g., "System.InvalidOperationException: ")
          const colonIndex = firstLine.indexOf(':');
          if (colonIndex > 0 && firstLine.substring(0, colonIndex).includes('Exception')) {
            return firstLine.substring(colonIndex + 1).trim();
          }
          
          return firstLine;
        }
        
        return text;
      };
      
      // Try to extract error message from different possible response formats
      if (data) {
        // Check for detail field (common in ASP.NET Core)
        if (data.detail) {
          const cleanMessage = extractCleanMessage(data.detail);
          if (cleanMessage) errorMessage = cleanMessage;
        }
        // Check for message field
        else if (data.message) {
          const cleanMessage = extractCleanMessage(data.message);
          if (cleanMessage) errorMessage = cleanMessage;
        }
        // Check for title field (ProblemDetails)
        else if (data.title) {
          const cleanMessage = extractCleanMessage(data.title);
          if (cleanMessage) errorMessage = cleanMessage;
        }
        // Check for errors object (validation errors)
        else if (data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat();
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ');
          }
        }
        // If data is a string, try to clean it
        else if (typeof data === 'string') {
          const cleanMessage = extractCleanMessage(data);
          if (cleanMessage) errorMessage = cleanMessage;
        }
      }
      
      // Add status-specific handling with friendly messages
      if (status === 400) {
        // Keep the extracted message if it exists
        if (!data?.detail && !data?.message && !data?.title) {
          errorMessage = 'Invalid user data. Please check all fields.';
        }
      } else if (status === 409) {
        // For conflict errors, if no message was extracted, use default
        if (errorMessage === 'Failed to create user. Please try again.') {
          errorMessage = 'Email already exists in the system.';
        }
      } else if (status === 401 || status === 403) {
        errorMessage = 'Access denied. Only administrators can create users.';
      } else if (status === 500) {
        // For server errors, keep the extracted message if it's meaningful
        if (errorMessage === 'Failed to create user. Please try again.') {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      }
      
      console.log('Final error message:', errorMessage);
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      gender: '',
      dateOfBirth: null,
      address: '',
      age: '',
      phoneNumber: '',
      identifyNumber: '',
      email: '',
      roleId: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
            onClick={handleClose}
          />
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden animate-fade-in-up border border-gray-100">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-white to-indigo-50 flex items-center justify-between p-8 border-b border-gray-100 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Create New User
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 font-medium">
                    Enter complete user information for registration
                  </p>
                </div>
              </div>
              <IconButton
                onClick={handleClose}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 3, 
                  bgcolor: 'grey.100', 
                  '&:hover': { 
                    bgcolor: 'grey.200', 
                    transform: 'scale(1.05)' 
                  } 
                }}
              >
                <X size={20} />
              </IconButton>
            </div>

            {/* Body - Added ref for scrolling */}
            <div 
              ref={modalBodyRef}
              className="p-8 pb-24 bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 overflow-y-auto max-h-[calc(92vh-180px)]"
            >
              {errors.submit && (
                <Box ref={errorAlertRef} sx={{ mb: 3 }}>
                  <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Registration Error
                    </Typography>
                    <Typography variant="body2">
                      {errors.submit}
                    </Typography>
                  </Alert>
                </Box>
              )}

              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Personal Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Basic user identification details
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                      gap: 3 
                    }}>
                      <TextField
                        name="fullName"
                        label="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., Nguyen Van A"
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        name="identifyNumber"
                        label="Identify Number"
                        value={formData.identifyNumber}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 123456789003"
                        error={!!errors.identifyNumber}
                        helperText={errors.identifyNumber}
                        inputProps={{ maxLength: 12 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <DatePicker
                        label="Date of Birth *"
                        value={formData.dateOfBirth}
                        onChange={handleDateChange}
                        maxDate={dayjs()}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            required: true,
                            error: !!errors.dateOfBirth,
                            helperText: errors.dateOfBirth,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            },
                          },
                        }}
                        format="MM/DD/YYYY"
                      />

                      <TextField
                        name="age"
                        label="Age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 25"
                        error={!!errors.age}
                        helperText={errors.age}
                        inputProps={{ min: 1, max: 120 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <FormControl 
                        fullWidth 
                        error={!!errors.gender}
                        required
                      >
                        <InputLabel>Gender</InputLabel>
                        <Select
                          name="gender"
                          value={formData.gender}
                          label="Gender"
                          onChange={handleChange}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                        </Select>
                        {errors.gender && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {errors.gender}
                          </Typography>
                        )}
                      </FormControl>

                      <FormControl 
                        fullWidth 
                        error={!!errors.roleId}
                        required
                        disabled={loadingRoles}
                      >
                        <InputLabel>Role</InputLabel>
                        <Select
                          name="roleId"
                          value={formData.roleId}
                          label="Role"
                          onChange={handleChange}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="">
                            {loadingRoles ? 'Loading roles...' : 'Select role...'}
                          </MenuItem>
                          {Array.isArray(roles) && roles.map((role) => (
                            <MenuItem key={role.id || role.roleId} value={role.id || role.roleId}>
                              {role.roleName || role.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.roleId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {errors.roleId}
                          </Typography>
                        )}
                      </FormControl>
                    </Box>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Contact Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Phone, email and address details
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                      gap: 3 
                    }}>
                      <TextField
                        name="phoneNumber"
                        label="Phone Number"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 0123456789"
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        name="email"
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., user@example.com"
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                        <TextField
                          name="address"
                          label="Address"
                          multiline
                          rows={3}
                          value={formData.address}
                          onChange={handleChange}
                          required
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., 123 Main Street, City"
                          error={!!errors.address}
                          helperText={errors.address}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center justify-end gap-4 p-6 border-t border-gray-100">
              <Button
                onClick={handleClose}
                variant="outlined"
                disabled={loading}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading || loadingRoles}
                startIcon={loading ? null : <Save size={18} />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RingSpinner size="small" text="" theme="blue" />
                    Creating User...
                  </div>
                ) : (
                  'Create User'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}