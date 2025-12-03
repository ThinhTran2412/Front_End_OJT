import { useState, useEffect } from 'react';
import { X, Save, Shield } from 'lucide-react';
import {
  TextField,
  Box,
  Typography,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { Select } from 'antd';
import { RingSpinner } from '../Loading';
import { RoleService } from '../../services/RoleService';
import { usePrivileges } from '../../hooks/usePrivileges';

// Privilege dependency mapping - matches backend PrivilegeDependencyMap
const PRIVILEGE_DEPENDENCY_MAP = {
  // Patient Test Order Privileges (1-8) - Depend on READ_ONLY (1)
  3: 1,   // MODIFY_TEST_ORDER -> READ_ONLY
  5: 1,   // REVIEW_TEST_ORDER -> READ_ONLY
  7: 1,   // MODIFY_COMMENT -> READ_ONLY
  
  // Configuration Privileges (9-12) - Depend on VIEW_CONFIGURATION (9)
  11: 9,  // MODIFY_CONFIGURATION -> VIEW_CONFIGURATION
  
  // User Management Privileges (13-17) - Depend on VIEW_USER (13)
  15: 13, // MODIFY_USER -> VIEW_USER
  17: 13, // LOCK_UNLOCK_USER -> VIEW_USER
  
  // Role Management Privileges (18-21) - Depend on VIEW_ROLE (18)
  20: 18, // UPDATE_ROLE -> VIEW_ROLE
  
  // Lab Management Privileges (22-29)
  24: 22, // MODIFY_REAGENTS -> VIEW_EVENT_LOGS
  28: 27  // ACTIVATE_DEACTIVATE_INSTRUMENT -> VIEW_INSTRUMENT
};

// Function to normalize privilege IDs by adding required dependencies
const normalizePrivilegeIds = (initialIds) => {
  if (!initialIds || initialIds.length === 0) {
    return [];
  }

  const uniqueIds = new Set(initialIds);
  const idsToAdd = new Set();

  // Check each selected privilege for dependencies
  initialIds.forEach(actionId => {
    const requiredViewId = PRIVILEGE_DEPENDENCY_MAP[actionId];
    if (requiredViewId && !uniqueIds.has(requiredViewId)) {
      idsToAdd.add(requiredViewId);
    }
  });

  // Add all required dependencies
  idsToAdd.forEach(id => uniqueIds.add(id));

  return Array.from(uniqueIds);
};

// Function to convert Vietnamese text to ASCII and format as Role Code
// "Trần Thái Thịnh" → "Tran_Thai_Thinh"
const generateRoleCode = (text) => {
  if (!text) return '';
  
  // Vietnamese characters mapping
  const vietnameseMap = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'Đ': 'D',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
  };

  // Remove Vietnamese accents
  let result = text.split('').map(char => vietnameseMap[char] || char).join('');
  
  // Replace spaces with underscore and remove special characters
  result = result
    .trim()
    .replace(/\s+/g, '_')  // Replace spaces with underscore
    .replace(/[^a-zA-Z0-9_]/g, '')  // Remove special characters except underscore
    .replace(/_+/g, '_')  // Replace multiple underscores with single
    .replace(/^_|_$/g, '');  // Remove leading/trailing underscores
  
  return result;
};

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
if (typeof document !== 'undefined' && !document.getElementById('create-role-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'create-role-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function CreateRoleModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    privilegeIds: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const { privileges, loading: privilegesLoading } = usePrivileges();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role Name is required.';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Role Code is required.';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Role Code must be at least 3 characters.';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters.';
    }

    if (!formData.privilegeIds || formData.privilegeIds.length === 0) {
      newErrors.privilegeIds = 'At least one privilege is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Update name
      setFormData(prev => {
        const newData = { ...prev, name: value };
        
        // Auto-generate code only if user hasn't manually edited it
        if (!isCodeManuallyEdited) {
          newData.code = generateRoleCode(value);
        }
        
        return newData;
      });
    } else if (name === 'code') {
      // User manually editing code
      setIsCodeManuallyEdited(true);
      setFormData(prev => ({ ...prev, code: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePrivilegeChange = (vals) => {
    // Normalize privilege IDs to include required dependencies
    const normalizedIds = normalizePrivilegeIds(vals);
    setFormData(prev => ({ ...prev, privilegeIds: normalizedIds }));
    setErrors(prev => ({ ...prev, privilegeIds: '' }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));

    try {
      const result = await RoleService.createRole({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        privilegeIds: formData.privilegeIds,
      });

      if (result?.success) {
        handleReset();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrors(prev => ({
          ...prev,
          submit: result?.message || 'Failed to create role'
        }));
      }
    } catch (error) {
      console.error('Error creating role:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.detail ||
                          error.message || 
                          'Failed to create role. Please try again.';
      
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
      name: '',
      code: '',
      description: '',
      privilegeIds: [],
    });
    setErrors({});
    setIsCodeManuallyEdited(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
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
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Create New Role
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Create a new role and set its privileges
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
                    Creation Error
                  </Typography>
                  <Typography variant="body2">
                    {errors.submit}
                  </Typography>
                </Alert>
              </Box>
            )}

            <div className="space-y-8">
              {/* Role Information Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Role Information
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Basic role details and configuration
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3 
                  }}>
                    <TextField
                      name="name"
                      label="Role Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., Lab Manager, Trần Thái Thịnh"
                      error={!!errors.name}
                      helperText={errors.name || "Role Code will be auto-generated based on Role Name"}
                      autoFocus
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />

                    <TextField
                      name="code"
                      label="Role Code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      placeholder="Auto-generated or enter custom code"
                      error={!!errors.code}
                      helperText={
                        errors.code || 
                        (isCodeManuallyEdited 
                          ? '⚠️ Manually edited - auto-generation disabled' 
                          : '✓ Auto-generated from Role Name')
                      }
                      InputProps={{
                        style: { fontFamily: 'monospace' }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />

                    <TextField
                      name="description"
                      label="Description"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., Full system access role"
                      error={!!errors.description}
                      helperText={errors.description}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                </div>
              </div>

              {/* Privileges Section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Privileges
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Select privileges for this role (required)
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privileges <span className="text-red-500">*</span>
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Select privileges..."
                      value={formData.privilegeIds}
                      onChange={handlePrivilegeChange}
                      options={(Array.isArray(privileges) ? privileges : []).map(p => ({
                        label: p.name,
                        value: p.privilegeId,
                      }))}
                      showSearch
                      filterOption={(input, option) =>
                        option?.label?.toLowerCase().includes(input.toLowerCase())
                      }
                      size="large"
                      className="w-full"
                      loading={privilegesLoading}
                      disabled={privilegesLoading}
                    />
                    {errors.privilegeIds && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.privilegeIds}
                      </Typography>
                    )}
                  </div>
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
              disabled={loading || privilegesLoading}
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
                  Creating Role...
                </div>
              ) : (
                'Create Role'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}