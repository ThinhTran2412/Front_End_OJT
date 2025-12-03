import { useState, useEffect } from 'react';
import { X, Plus, Save, Search, RefreshCw } from 'lucide-react';
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
  FormControlLabel,
  Tabs,
  Tab
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
if (typeof document !== 'undefined' && !document.getElementById('sync-flagging-config-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'sync-flagging-config-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function SyncFlaggingConfigModal({ isOpen, onClose, onSuccess, existingConfigs }) {
  const [mode, setMode] = useState('search'); // 'search' or 'add'
  const [searchTestCode, setSearchTestCode] = useState('');
  const [searchGender, setSearchGender] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  
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

useEffect(() => {
  if (isOpen && mode === 'search' && existingConfigs.length > 0) {
    // Load 10 configs đầu tiên khi mở modal
    const initialResults = existingConfigs.slice(0, 10);
    setSearchResults(initialResults);
  }
}, [isOpen, mode, existingConfigs]);

  const handleSearch = () => {
    if (!searchTestCode.trim()) {
      setErrors({ search: 'Please enter a test code to search' });
      return;
    }

    const results = existingConfigs.filter(config => {
      const testCodeMatch = config.testCode?.toLowerCase() === searchTestCode.toLowerCase();
      if (!searchGender) return testCodeMatch;
      
      if (searchGender === 'null') {
        return testCodeMatch && (config.gender === null || config.gender === undefined);
      }
      return testCodeMatch && config.gender === searchGender;
    });

    setSearchResults(results);
    setErrors({});
    
    if (results.length === 0) {
      setErrors({ search: 'No configurations found. You can add a new one instead.' });
    }
  };

  const handleSelectConfig = (config) => {
  setSelectedConfig(config);
  setFormData({
    testCode: config.testCode,
    parameterName: config.parameterName || '',
    description: config.description || '',
    unit: config.unit || '',
    gender: config.gender || '',
    min: config.min !== null && config.min !== undefined ? config.min : '',
    max: config.max !== null && config.max !== undefined ? config.max : '',
    isActive: config.isActive ?? true,
    effectiveDate: config.effectiveDate ? dayjs(config.effectiveDate) : dayjs()
  });
  setErrors({});
  
  // Scroll xuống form
  setTimeout(() => {
    const formElement = document.getElementById('edit-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

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
    
    // Prevent editing testCode and gender in search mode when config is selected
    if (mode === 'search' && selectedConfig && (name === 'testCode' || name === 'gender')) {
      return;
    }
    
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

  const handleModeChange = (event, newMode) => {
  if (newMode) {
    setMode(newMode);
    handleReset();
    
    // Load lại initial results khi switch về search mode
        if (newMode === 'search' && existingConfigs.length > 0) {
        const initialResults = existingConfigs.slice(0, 10);
        setSearchResults(initialResults);
        }
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
      
      // if onSuccess returns truthy or undefined (success), close/reset
      if (result || result === undefined) {
        handleReset();
        onClose();
      }
    } catch (err) {
      console.error('Error syncing flagging configuration:', err);
      
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.title ||
                          err?.message || 
                          'Failed to sync flagging configuration. Please try again.';
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTestCode('');
    setSearchGender('');
    setSearchResults([]);
    setSelectedConfig(null);
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
    setMode('search');
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
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden animate-fade-in-up border border-gray-100">
           {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-50 via-white to-indigo-50 flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <RefreshCw className="w-5 h-5 text-white" />
                </div>
                <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Sync Flagging Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    Search to update existing or add new configuration
                </p>
                </div>
            </div>
            <IconButton
                onClick={handleClose}
                sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: 2, 
                bgcolor: 'grey.100', 
                '&:hover': { 
                    bgcolor: 'grey.200', 
                    transform: 'scale(1.05)' 
                } 
                }}
            >
                <X size={18} />
            </IconButton>
            </div>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 6, py: 1, bgcolor: 'grey.50' }}>
            <Tabs 
                value={mode} 
                onChange={handleModeChange}
                sx={{
                minHeight: '48px',
                '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    minHeight: '48px',
                    py: 1
                }
                }}
            >
                <Tab 
                icon={<Search size={16} />} 
                iconPosition="start" 
                label="Search & Update" 
                value="search" 
                />
                <Tab 
                icon={<Plus size={16} />} 
                iconPosition="start" 
                label="Add New" 
                value="add" 
                />
            </Tabs>
            </Box>

            {/* Body */}
<div className="p-8 pb-24 bg-gradient-to-br from-gray-50/30 via-white to-purple-50/20 overflow-y-auto max-h-[calc(92vh-240px)]">
  {errors.submit && (
    <Box sx={{ mb: 3 }}>
      <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Sync Error
        </Typography>
        <Typography variant="body2">
          {errors.submit}
        </Typography>
      </Alert>
    </Box>
  )}

  {/* Search Section - Only show in search mode */}
  {mode === 'search' && (
    <div className="space-y-6 mb-6">
      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' }, gap: 3, alignItems: 'start' }}>
            <TextField
              label="Test Code *"
              value={searchTestCode}
              onChange={(e) => {
                setSearchTestCode(e.target.value);
                if (errors.search) setErrors({});
              }}
              placeholder="e.g., WBC, Hb, RBC"
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Gender (Optional)</InputLabel>
              <Select
                value={searchGender}
                label="Gender (Optional)"
                onChange={(e) => {
                  setSearchGender(e.target.value);
                  if (errors.search) setErrors({});
                }}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="null">Not Specified</MenuItem>
              </Select>
            </FormControl>

            <Button
              onClick={handleSearch}
              variant="contained"
              startIcon={<Search size={18} />}
              sx={{ 
                height: 56,
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'blue.600',
                '&:hover': { bgcolor: 'blue.700' }
              }}
            >
              Search
            </Button>
          </Box>

          {errors.search && (
            <Alert severity={searchResults.length === 0 ? "info" : "error"} sx={{ mt: 3, borderRadius: 2 }}>
              {errors.search}
            </Alert>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-800">
              {searchResults.length} Configuration{searchResults.length !== 1 ? 's' : ''} Found
            </h3>
          </div>
          <div className="p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {searchResults.map((config, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectConfig(config)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedConfig === config
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <div className="font-bold text-gray-900">{config.testCode}</div>
                        <div className="text-gray-600">{config.parameterName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.gender ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            config.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                          }`}>
                            {config.gender}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            Other
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      {config.min} - {config.max} {config.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Form Section - Show in Add mode OR when config selected in Search mode */}
  {(mode === 'add' || (mode === 'search' && selectedConfig)) && (
    <div id="edit-form-section" className="space-y-6">
      {mode === 'search' && selectedConfig && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Updating: {selectedConfig.testCode} - {selectedConfig.parameterName}
          </Typography>
          <Typography variant="body2">
            Test Code and Gender fields are locked and cannot be modified.
          </Typography>
        </Alert>
      )}

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
                          disabled={mode === 'search' && selectedConfig}
                          InputProps={{
                            readOnly: mode === 'search' && selectedConfig
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: mode === 'search' && selectedConfig ? 'grey.100' : 'white'
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
                        disabled={mode === 'search' && !selectedConfig}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: mode === 'search' && !selectedConfig ? 'grey.100' : 'white'
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
                            disabled={mode === 'search' && selectedConfig}
                            sx={{
                              borderRadius: 2,
                              bgcolor: mode === 'search' && selectedConfig ? 'grey.100' : 'white'
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
              )}
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
            {(mode === 'add' || (mode === 'search' && selectedConfig)) && (
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
                    bgcolor: 'purple.dark'
                    }
                }}
                >
                {loading ? (
                    <div className="flex items-center gap-2">
                    <RingSpinner size="small" text="" theme="purple" />
                    {mode === 'search' ? 'Updating...' : 'Adding...'}
                    </div>
                ) : (
                    mode === 'search' ? 'Update Configuration' : 'Add Configuration'
                )}
                </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}
