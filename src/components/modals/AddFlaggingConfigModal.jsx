import { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
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
  IconButton,
  Switch,
  FormControlLabel
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
if (typeof document !== 'undefined' && !document.getElementById('add-flagging-config-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'add-flagging-config-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function AddFlaggingConfigModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    testCode: '',
    parameterName: '',
    description: '',
    unit: '',
    gender: '',
    min: '',
    max: '',
    isActive: true,
    effectiveDate: dayjs()
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.testCode.trim()) {
      newErrors.testCode = 'Test Code is required';
    }
    
    if (!formData.parameterName.trim()) {
      newErrors.parameterName = 'Parameter Name is required';
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }
    
    if (formData.min === '' || formData.min === null || formData.min === undefined) {
      newErrors.min = 'Min value is required';
    } else if (isNaN(Number(formData.min))) {
      newErrors.min = 'Min must be a valid number';
    }
    
    if (formData.max === '' || formData.max === null || formData.max === undefined) {
      newErrors.max = 'Max value is required';
    } else if (isNaN(Number(formData.max))) {
      newErrors.max = 'Max must be a valid number';
    }
    
    if (formData.min !== '' && formData.max !== '' && Number(formData.min) >= Number(formData.max)) {
      newErrors.max = 'Max must be greater than Min';
    }
    
    if (!formData.effectiveDate || !dayjs(formData.effectiveDate).isValid()) {
      newErrors.effectiveDate = 'Effective Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      effectiveDate: newDate
    }));
    
    if (errors.effectiveDate) {
      setErrors(prev => ({
        ...prev,
        effectiveDate: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formattedData = {
        testCode: formData.testCode.trim(),
        parameterName: formData.parameterName.trim(),
        description: formData.description.trim() || '',
        unit: formData.unit.trim(),
        gender: formData.gender || null,
        min: Number(formData.min),
        max: Number(formData.max),
        isActive: formData.isActive,
        effectiveDate: formData.effectiveDate ? dayjs(formData.effectiveDate).toISOString() : new Date().toISOString()
      };

      const result = await onSuccess([formattedData]);
      
      if (result) {
        handleReset();
        onClose();
      }
    } catch (err) {
      console.error('Error adding flagging configuration:', err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.title ||
                          err.message || 
                          'Failed to add flagging configuration. Please try again.';
      
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
      testCode: '',
      parameterName: '',
      description: '',
      unit: '',
      gender: '',
      min: '',
      max: '',
      isActive: true,
      effectiveDate: dayjs()
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
            <div className="sticky top-0 bg-gradient-to-r from-purple-50 via-white to-indigo-50 flex items-center justify-between p-8 border-b border-gray-100 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Add Flagging Configuration
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 font-medium">
                    Enter flagging configuration details
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
            <div className="p-8 pb-24 bg-gradient-to-br from-gray-50/30 via-white to-purple-50/20 overflow-y-auto max-h-[calc(92vh-180px)]">
              {errors.submit && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Add Error
                    </Typography>
                    <Typography variant="body2">
                      {errors.submit}
                    </Typography>
                  </Alert>
                </Box>
              )}

              <div className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Basic Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Test code and parameter details
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
                        name="testCode"
                        label="Test Code *"
                        value={formData.testCode}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., WBC, Hb, RBC"
                        error={!!errors.testCode}
                        helperText={errors.testCode}
                        autoFocus
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        name="parameterName"
                        label="Parameter Name *"
                        value={formData.parameterName}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., White Blood Cell Count"
                        error={!!errors.parameterName}
                        helperText={errors.parameterName}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                        <TextField
                          name="description"
                          label="Description"
                          multiline
                          rows={3}
                          value={formData.description}
                          onChange={handleChange}
                          fullWidth
                          variant="outlined"
                          placeholder="Description of what the parameter measures"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>

                      <TextField
                        name="unit"
                        label="Unit *"
                        value={formData.unit}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., cells/µL, g/dL, %"
                        error={!!errors.unit}
                        helperText={errors.unit}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <FormControl fullWidth>
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
                          <MenuItem value="">Other (Not Specified)</MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </div>
                </div>

                {/* Reference Range Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Reference Range
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Minimum and maximum threshold values
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
                        name="min"
                        label="Minimum Value *"
                        type="number"
                        value={formData.min}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 4000"
                        error={!!errors.min}
                        helperText={errors.min}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        name="max"
                        label="Maximum Value *"
                        type="number"
                        value={formData.max}
                        onChange={handleChange}
                        required
                        fullWidth
                        variant="outlined"
                        placeholder="e.g., 10000"
                        error={!!errors.max}
                        helperText={errors.max}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  </div>
                </div>

                {/* Status & Date Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Status & Effective Date
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Configuration status and effective date
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
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isActive}
                            onChange={handleChange}
                            name="isActive"
                            color="success"
                          />
                        }
                        label="Active"
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontWeight: 600 
                          } 
                        }}
                      />

                      <DatePicker
                        label="Effective Date *"
                        value={formData.effectiveDate}
                        onChange={handleDateChange}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            error: !!errors.effectiveDate,
                            helperText: errors.effectiveDate,
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                              },
                            },
                          },
                        }}
                        format="MM/DD/YYYY"
                      />
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
                  bgcolor: 'purple.main',
                  '&:hover': {
                    bgcolor: 'purple.dark',
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RingSpinner size="small" text="" theme="purple" />
                    Adding...
                  </div>
                ) : (
                  'Add Configuration'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}
