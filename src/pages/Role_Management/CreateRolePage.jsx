import { RoleService } from "../../services/RoleService";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { usePrivileges } from "../../hooks/usePrivileges";
import { Select } from "antd";

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

export default function CreateRolePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    privilegeIds: [],
  });

  const [errors, setErrors] = useState({});
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false); // Track if user manually edited code
  const { privileges, loading: privilegesLoading, error: privilegesError } = usePrivileges();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Update name
      setFormData((prev) => {
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
      setFormData((prev) => ({ ...prev, code: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role Name is required.";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Role Code is required.";
    } else if (formData.code.length < 3) {
      newErrors.code = "Role Code must be at least 3 characters.";
    }

    if (formData.description.length > 200) {
      newErrors.description = "Description cannot exceed 200 characters.";
    }

    if (!formData.privilegeIds || formData.privilegeIds.length === 0) {
      newErrors.privilegeIds = "At least one privilege is required.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const result = await RoleService.createRole({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        privilegeIds: formData.privilegeIds,
      });
      if (result?.success) {
        setSuccessMessage("Role created successfully!");
        setErrorMessage("");
        setFormData({ name: "", code: "", description: "", privilegeIds: [] });
        setIsCodeManuallyEdited(false); // Reset the flag
      } else {
        setErrorMessage(result?.message || "Failed to create role");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      setErrorMessage("Unexpected error while creating role!");
      setSuccessMessage("");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-4 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CREATE ROLE</h1>
              <p className="text-gray-600 text-sm">Create a new role and set its privileges</p>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-4 p-3 border rounded text-sm bg-green-50 border-green-200 text-green-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">{successMessage}</p>
                    <p className="text-xs mt-1 text-green-500">You can create another role or go back to role list.</p>
                  </div>
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="mb-4 p-3 border rounded text-sm bg-red-50 border-red-200 text-red-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

        {/* Role Name */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter role name (e.g., Lab Manager, Trần Thái Thịnh)"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.name 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Role Code will be auto-generated based on Role Name
          </p>
        </div>

        {/* Privilege + Role Code */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Privileges <span className="text-red-500">*</span>
            </label>
            <Select
              mode="multiple"
              placeholder="Select privileges..."
              value={formData.privilegeIds}
              onChange={(vals) => {
                // Normalize privilege IDs to include required dependencies
                const normalizedIds = normalizePrivilegeIds(vals);
                setFormData(prev => ({ ...prev, privilegeIds: normalizedIds }));
                setErrors(prev => ({ ...prev, privilegeIds: '' }));
              }}
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
            />
            {errors.privilegeIds && (
              <p className="mt-1 text-sm text-red-600">{errors.privilegeIds}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Role Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Auto-generated or enter custom code"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono ${
                errors.code 
                  ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                  : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {isCodeManuallyEdited 
                ? '⚠️ Manually edited - auto-generation disabled' 
                : '✓ Auto-generated from Role Name'}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            className={`w-full px-4 py-3 h-24 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.description 
                ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 bg-custom-dark-blue text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Create Role
          </button>
          <button
            type="button"
            onClick={() => navigate('/role-management')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Cancel
          </button>
        </div>
        </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}