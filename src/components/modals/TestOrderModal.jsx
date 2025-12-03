import { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';
import {
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Box,
  Typography,
  Alert,
  Button,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import { RingSpinner } from '../Loading';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
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
if (typeof document !== 'undefined' && !document.getElementById('test-order-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'test-order-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function TestOrderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onDelete,
  mode = 'create',
  initialData = null,
  patientData = null
}) {
  const [formData, setFormData] = useState({
    identifyNumber: '',
    patientName: '',
    dateOfBirth: null, // Will be dayjs object
    age: '',
    gender: 'Male',
    address: '',
    phoneNumber: '',
    email: '',
    priority: 'Normal',
    note: '',
    testType: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const priorities = ['Normal', 'Urgent', 'STAT'];
  const genders = ['Male', 'Female', 'Other'];
  
  // Helper function to determine if patient fields should be read-only
  const isPatientFieldReadOnly = () => {
    return mode === 'create'; // Only read-only for existing patient, not for new patient
  };
  
  // Test types for selection (display labels)
  const testTypes = [
    'Complete Blood Count (CBC)',
    'Lipid Panel',
    'Comprehensive Metabolic Panel',
    'Thyroid Function Test',
    'Liver Function Test',
    'Renal Function Test',
    'Urinalysis',
    'Blood Glucose Test',
    'Hemoglobin A1C',
    'Vitamin D Test'
  ];

  // Map display test type to actual backend test type
  // For demo purposes, all test types map to 'CBC' as only CBC has data
  const mapTestTypeForBackend = (displayTestType) => {
    // Always return 'CBC' for demo as other test types don't have data yet
    return 'CBC';
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          identifyNumber: initialData.identifyNumber || '',
          patientName: initialData.patientName || '',
          dateOfBirth: initialData.dateOfBirth ? dayjs(initialData.dateOfBirth) : null,
          age: String(initialData.age || ''),
          gender: initialData.gender || 'Male',
          address: initialData.address || '',
          phoneNumber: initialData.phoneNumber || '',
          email: initialData.email || '',
          priority: initialData.priority || 'Normal',
          note: initialData.note || '',
          testType: initialData.testType || ''
        });
      } else if (mode === 'create' && patientData) {
        // Mode: Tạo test order cho patient có sẵn (auto-fill patient data)
        console.log('TestOrderModal - Auto-filling with patientData:', patientData);
        setFormData({
          identifyNumber: patientData.identifyNumber || '',
          patientName: patientData.fullName || '',
          dateOfBirth: patientData.dateOfBirth ? dayjs(patientData.dateOfBirth) : null,
          age: String(patientData.age || ''),
          gender: patientData.gender || 'Male',
          address: patientData.address || '',
          phoneNumber: patientData.phoneNumber || '',
          email: patientData.email || '',
          priority: 'Normal',
          note: '',
          testType: ''
        });
      } else if (mode === 'create_new_patient') {
        // Mode: Tạo test order cho patient mới (tất cả field đều trống và có thể nhập)
        setFormData({
          identifyNumber: '',
          patientName: '',
          dateOfBirth: null,
          age: '',
          gender: 'Male',
          address: '',
          phoneNumber: '',
          email: '',
          priority: 'Normal',
          note: '',
          testType: ''
        });
      }
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, initialData, patientData]);

  const validateForm = () => {
    const newErrors = {};
    
    // For CREATE mode with existing patient, only validate testType (patient data is auto-filled and read-only)
    if (mode === 'create') {
      if (!formData.testType.trim()) {
        newErrors.testType = 'Test Type is required';
      }
    }
    
    // For CREATE_NEW_PATIENT mode, validate all fields (all fields are editable)
    if (mode === 'create_new_patient') {
      if (!formData.identifyNumber.trim()) {
        newErrors.identifyNumber = 'Identify Number is required';
      }
      
      if (!formData.patientName.trim()) {
        newErrors.patientName = 'Patient Name is required';
      }
      
      if (!formData.dateOfBirth || !dayjs(formData.dateOfBirth).isValid()) {
        newErrors.dateOfBirth = 'Date of Birth is required';
      }
      
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone Number is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      
      if (!formData.testType.trim()) {
        newErrors.testType = 'Test Type is required';
      }
    }
    
    // For EDIT mode, validate all fields
    if (mode === 'edit') {
      if (!formData.identifyNumber.trim()) {
        newErrors.identifyNumber = 'Identify Number is required';
      }
      
      if (!formData.patientName.trim()) {
        newErrors.patientName = 'Patient Name is required';
      }
      
      if (!formData.dateOfBirth || !dayjs(formData.dateOfBirth).isValid()) {
        newErrors.dateOfBirth = 'Date of Birth is required';
      }
      
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone Number is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      
      const ageNum = parseInt(formData.age);
      if (!formData.age || isNaN(ageNum) || ageNum <= 0) {
        newErrors.age = 'Valid age is required';
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

  const handleTestTypeChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      testType: newValue || ''
    }));
    
    if (errors.testType) {
      setErrors(prev => ({
        ...prev,
        testType: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let submitData;
      
      if (mode === 'create' || mode === 'create_new_patient') {
        // CREATE: Use the exact API format requested
        submitData = {
          fullName: formData.patientName.trim(),
          dateOfBirth: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format('YYYY-MM-DD') : '',
          gender: formData.gender,
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          testType: mapTestTypeForBackend(formData.testType.trim()), // Map to backend test type (always CBC for demo)
          priority: formData.priority,
          note: formData.note.trim(),
          identifyNumber: formData.identifyNumber.trim()
        };
      } else {
        // EDIT: full patient info + priority + note + status
        submitData = {
          identifyNumber: formData.identifyNumber.trim(),
          patientName: formData.patientName.trim(),
          dateOfBirth: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format('YYYY-MM-DD') : '',
          age: parseInt(formData.age),
          gender: formData.gender,
          address: formData.address.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          priority: formData.priority,
          note: formData.note.trim(),
          status: initialData?.status || 'Created'
        };
      }

      console.log(`${mode.toUpperCase()} payload:`, submitData);
      console.log('Original formData.identifyNumber:', formData.identifyNumber);
      
      // Log the test type mapping for debugging
      if (mode === 'create' || mode === 'create_new_patient') {
        console.log(`Test type mapping: "${formData.testType}" -> "${mapTestTypeForBackend(formData.testType)}"`);
      }
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting:', error);
      setErrors({ 
        submit: error.response?.data?.errors 
          ? Object.values(error.response.data.errors).flat().join(', ')
          : error.response?.data?.message || error.message || 'Failed to submit test order'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to delete test order' });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden animate-fade-in-up border border-gray-100">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 via-white to-purple-50 flex items-center justify-between p-8 border-b border-gray-100 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {mode === 'create' ? 'Create New Test Order' : 
                   mode === 'create_new_patient' ? 'New Patient Test Order' : 
                   'Edit Test Order'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  {mode === 'edit' ? `Order ID: ${initialData?.testOrderId}` : 
                   mode === 'create_new_patient' ? 'Complete patient information and test requirements' :
                   'Configure test parameters for existing patient'}
                </p>
              </div>
            </div>
            <IconButton
              onClick={onClose}
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
          <div className="p-8 bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 overflow-y-auto max-h-[calc(92vh-180px)]">
            {errors.submit && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Submission Error
                  </Typography>
                  <Typography variant="body2">
                    {errors.submit}
                  </Typography>
                </Alert>
              </Box>
            )}

            <div className="space-y-8">
              {/* Patient Information Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Patient Information
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {mode === 'create' && 'Auto-filled from selected patient'}
                        {mode === 'create_new_patient' && 'Enter complete patient details'}
                        {mode === 'edit' && 'Patient identification details'}
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
    placeholder="e.g., 079203004567"
    disabled={isPatientFieldReadOnly()}
    error={!!errors.identifyNumber}
    helperText={errors.identifyNumber}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '&:hover fieldset': {
          borderColor: isPatientFieldReadOnly() ? 'rgba(0, 0, 0, 0.23)' : 'primary.main',
        },
        '&.Mui-disabled fieldset': {
          borderColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  />

  <TextField
    name="patientName"
    label="Patient Name"
    value={formData.patientName}
    onChange={handleChange}
    required
    fullWidth
    variant="outlined"
    placeholder="Enter patient name"
    disabled={isPatientFieldReadOnly()}
    error={!!errors.patientName}
    helperText={errors.patientName}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '&.Mui-disabled fieldset': {
          borderColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  />

 <DatePicker
  label="Date of Birth *"
  value={formData.dateOfBirth}
  onChange={handleDateChange}
  disabled={isPatientFieldReadOnly()}
  slotProps={{
    textField: {
      fullWidth: true,
      variant: 'outlined',
      error: !!errors.dateOfBirth,
      helperText: errors.dateOfBirth,
      InputProps: {
        sx: {
          borderRadius: 2,
        },
      },
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        },
      },
    },
    inputAdornment: {
      sx: {
        '& .MuiIconButton-root.Mui-disabled': {
          color: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  }}
  format="MM/DD/YYYY"
/>

  <TextField
    name="gender"
    label="Gender"
    value={formData.gender}
    onChange={handleChange}
    required
    fullWidth
    select
    variant="outlined"
    disabled={isPatientFieldReadOnly()}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '&.Mui-disabled fieldset': {
          borderColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  >
    {genders.map(gender => (
      <option key={gender} value={gender}>
        {gender}
      </option>
    ))}
  </TextField>

  <TextField
    name="phoneNumber"
    label="Phone Number"
    value={formData.phoneNumber}
    onChange={handleChange}
    required
    fullWidth
    variant="outlined"
    placeholder="e.g., 0909123456"
    disabled={isPatientFieldReadOnly()}
    error={!!errors.phoneNumber}
    helperText={errors.phoneNumber}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: 2,
        '&.Mui-disabled fieldset': {
          borderColor: 'rgba(0, 0, 0, 0.3)',
        },
      },
      '& .MuiInputBase-input.Mui-disabled': {
        WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
      },
    }}
  />

  <Box sx={{ gridColumn: { md: 'span 2' } }}>
    <TextField
      name="email"
      label="Email"
      type="email"
      value={formData.email}
      onChange={handleChange}
      required
      fullWidth
      variant="outlined"
      placeholder="example@email.com"
      disabled={isPatientFieldReadOnly()}
      error={!!errors.email}
      helperText={errors.email}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '&.Mui-disabled fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    />
  </Box>

  <Box sx={{ gridColumn: { md: 'span 2' } }}>
    <TextField
      name="address"
      label="Address"
      value={formData.address}
      onChange={handleChange}
      required
      fullWidth
      variant="outlined"
      placeholder="Enter full address"
      disabled={isPatientFieldReadOnly()}
      error={!!errors.address}
      helperText={errors.address}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '&.Mui-disabled fieldset': {
            borderColor: 'rgba(0, 0, 0, 0.3)',
          },
        },
        '& .MuiInputBase-input.Mui-disabled': {
          WebkitTextFillColor: 'rgba(0, 0, 0, 0.7)',
        },
      }}
    />
  </Box>
</Box>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Details
                  {mode === 'create' && (
                    <span className="text-sm font-normal text-gray-500 ml-2">(Manual input required)</span>
                  )}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Test Type */}
                  <Box>
                    <Autocomplete
                      options={testTypes}
                      value={formData.testType || null}
                      onChange={handleTestTypeChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Test Type"
                          required
                          variant="outlined"
                          placeholder="Select a test type"
                          error={!!errors.testType}
                          helperText={errors.testType}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                  </Box>

                  {/* Priority */}
                  <Box>
                    <FormControl component="fieldset" required>
                      <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}>
                        Priority <span style={{ color: '#ef4444' }}>*</span>
                      </FormLabel>
                      <RadioGroup
                        row
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        sx={{ gap: 2 }}
                      >
                        {priorities.map(priority => (
                          <FormControlLabel
                            key={priority}
                            value={priority}
                            control={<Radio size="small" />}
                            label={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: priority === 'STAT' ? '#dc2626' :
                                         priority === 'Urgent' ? '#ea580c' :
                                         '#374151'
                                }}
                              >
                                {priority}
                              </Typography>
                            }
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>

                  {/* Note */}
                  <Box>
                    <TextField
                      name="note"
                      label="Note"
                      value={formData.note}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                      placeholder="Enter any additional notes..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div>
              {mode === 'edit' && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
                sx={{ borderRadius: 2, color: 'grey.700', borderColor: 'grey.300' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? null : <Save size={16} />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ borderRadius: 2, minWidth: 120 }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RingSpinner size="small" text="" theme="blue" />
                  </Box>
                ) : (
                  mode === 'create' ? 'Create Order' : 'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Test Order</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this test order? All associated data will be permanently removed.
              </p>
              
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </LocalizationProvider>
  );
}