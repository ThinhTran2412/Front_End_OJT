import { useState } from 'react';
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
if (typeof document !== 'undefined' && !document.getElementById('add-patient-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'add-patient-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    identifyNumber: '',
    fullName: '',
    dateOfBirth: null,
    gender: '',
    phoneNumber: '',
    email: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.identifyNumber.trim()) {
      newErrors.identifyNumber = 'Identify Number is required';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }
    
    if (!formData.dateOfBirth || !dayjs(formData.dateOfBirth).isValid()) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    }
    
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
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

  try {
    const result = await onSuccess({
      identifyNumber: formData.identifyNumber.trim(),
      fullName: formData.fullName.trim(),
      dateOfBirth: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format('YYYY-MM-DD') : '',
      gender: formData.gender.trim(),
      phoneNumber: formData.phoneNumber.trim() || '',
      email: formData.email.trim() || '',
      address: formData.address.trim() || ''
    });
    
    if (result) {
      handleReset();
      onClose();
    }
  } catch (err) {
    console.error('Error adding patient:', err);
    
    // PHẦN SỬA ĐỔI BẮT ĐẦU TỪ ĐÂY
    let errorMessage = err.response?.data?.message || 
                       err.response?.data?.title ||
                       err.message || 
                       'Failed to add patient. Please try again.';
    
    // Check if error is about IAM Service (which means email already exists)
    if (errorMessage.includes('Could not create User in IAM Service')) {
      errorMessage = 'This email address is already registered in the system. Please use a different email address.';
    }
    // PHẦN SỬA ĐỔI KẾT THÚC
    
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
      identifyNumber: '',
      fullName: '',
      dateOfBirth: null,
      gender: '',
      phoneNumber: '',
      email: '',
      address: ''
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
            <div className="sticky top-0 bg-gradient-to-r from-green-50 via-white to-emerald-50 flex items-center justify-between p-8 border-b border-gray-100 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Add New Patient
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 font-medium">
                    Enter complete patient information for registration
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

            {/* Body */}
            <div className="p-8 pb-24 bg-gradient-to-br from-gray-50/30 via-white to-green-50/20 overflow-y-auto max-h-[calc(92vh-180px)]">
              {errors.submit && (
                <Box sx={{ mb: 3 }}>
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
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Personal Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Basic patient identification details
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
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

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
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                        {errors.gender && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                            {errors.gender}
                          </Typography>
                        )}
                      </FormControl>
                    </Box>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Contact Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Phone, email and address details (optional)
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
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 0123456789"
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
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., patient@example.com"
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
                          fullWidth
                          variant="outlined"
                          placeholder="e.g., 123 Main Street, City"
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
                disabled={loading}
                startIcon={loading ? null : <Save size={18} />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RingSpinner size="small" text="" theme="green" />
                    Adding Patient...
                  </div>
                ) : (
                  'Add Patient'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}