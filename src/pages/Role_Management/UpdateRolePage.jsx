import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleService } from "../../services/RoleService";
import DashboardLayout from "../../layouts/DashboardLayout";
import { usePrivileges } from "../../hooks/usePrivileges";
import { Select } from "antd";
import { InlineLoader } from '../../components/Loading';
import PrivilegeTag from '../../components/Role_Management/PrivilegeTag';

// Format "READ_ONLY" → "Read Only"
function formatPrivilegeName(name) {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Privilege dependency map - child privileges require parent privileges
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

export default function UpdateRolePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    privilegeIds: [],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { privileges, loading: privilegesLoading, error: privilegesError } = usePrivileges();

  // Load Role data when entering the page
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!id) {
        setErrorMessage("Invalid role ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");
        
        console.log("Fetching role with ID:", id);
        
        const roleRes = await RoleService.getById(id);

        console.log("Role response:", roleRes);

        // Check API response
        if (!roleRes.success) {
          const errorMsg = roleRes.message || `Failed to load role data. ${roleRes.error || ''}`;
          console.error("Role fetch failed:", roleRes);
          setErrorMessage(errorMsg);
          setLoading(false);
          return;
        }

        // RoleService has handled nested data structure
        const role = roleRes.data;

        if (!role) {
          console.error("No role data found in response:", roleRes);
          setErrorMessage("Role data not found in response");
          setLoading(false);
          return;
        }

        console.log("Extracted role data:", role);
        console.log("Role privileges raw:", role.privileges);
        console.log("Role privilegeIds raw:", role.privilegeIds);
        
        // Note: We'll map privilege names to IDs after privileges are loaded
        // Store the raw privilege names temporarily
        setFormData({
          name: role.name || "",
          code: role.code || "",
          description: role.description || "",
          privilegeIds: [], // Will be set in a separate effect after privileges load
          _privilegeNames: role.privileges || [] // Temporary storage
        });



      } catch (error) {
        console.error("Error fetching role:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        const errorMsg = error.response?.data?.message || 
                        error.message || 
                        "Failed to load role data. Please check the console for details.";
        setErrorMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleData();
  }, [id]);

  // Map privilege names to IDs after privileges are loaded
  useEffect(() => {
    if (formData._privilegeNames && privileges.length > 0) {
      console.log("🔄 Mapping privilege names to IDs");
      console.log("Privilege names from role:", formData._privilegeNames);
      console.log("Available privileges:", privileges);
      
      const privilegeIds = formData._privilegeNames
        .map(name => {
          const privilege = privileges.find(p => p.name === name);
          if (privilege) {
            console.log(`✅ Mapped '${name}' -> ID ${privilege.privilegeId}`);
            return privilege.privilegeId;
          } else {
            console.warn(`❌ Could not find privilege with name: ${name}`);
            return null;
          }
        })
        .filter(id => id != null && !isNaN(id));
      
      console.log("✅ Final mapped privilege IDs:", privilegeIds);
      
      setFormData(prev => ({
        ...prev,
        privilegeIds: privilegeIds,
        _privilegeNames: undefined // Clean up temporary field
      }));
    }
  }, [privileges, formData._privilegeNames]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (successMessage) setSuccessMessage("");
    if (errorMessage) setErrorMessage("");
  };

  // Handle privilege selection with dependency checking
  const handlePrivilegeChange = (selectedIds) => {
    const validIds = selectedIds.filter(id => !isNaN(id) && id != null);
    
    // Auto-add required dependencies
    const idsWithDependencies = new Set(validIds);
    
    validIds.forEach(id => {
      const requiredParent = PRIVILEGE_DEPENDENCY_MAP[id];
      if (requiredParent && !idsWithDependencies.has(requiredParent)) {
        idsWithDependencies.add(requiredParent);
      }
    });
    
    const finalIds = Array.from(idsWithDependencies).sort((a, b) => a - b);
    
    setFormData(prev => ({ ...prev, privilegeIds: finalIds }));
    setErrors(prev => ({ ...prev, privilegeIds: '' }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await RoleService.update(id, {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        privilegeIds: formData.privilegeIds,
      });

      if (result?.success) {
        setSuccessMessage("Role updated successfully!");
        setErrorMessage("");
        setTimeout(() => {
          navigate("/role-management");
        }, 1500);
      } else {
        setErrorMessage(result?.message || "Failed to update role");
        setSuccessMessage("");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setErrorMessage("Unexpected error while updating role!");
      setSuccessMessage("");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 py-4 w-full flex items-center justify-center">
          <InlineLoader 
            text="Loading role data" 
            size="large" 
            theme="purple" 
            centered={true}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-4 w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-custom-dark-blue mb-2">UPDATE ROLE</h1>
              <p className="text-gray-600 text-sm">Update role information and privileges</p>
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
                    <p className="text-xs mt-1 text-green-500">Redirecting to role list...</p>
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
                  placeholder="Enter role name"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                      : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Privileges + Role Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Privileges <span className="text-red-500">*</span>
                  </label>
                  
                  <style jsx>{`
                    .privilege-select-update .ant-select-selector {
                      min-height: 48px !important;
                      padding: 8px 12px !important;
                      display: flex !important;
                      align-items: flex-start !important;
                      flex-wrap: wrap !important;
                    }
                    .privilege-select-update .ant-select-selection-item {
                      margin: 2px 4px 2px 0 !important;
                    }
                    .privilege-select-update .ant-select-selection-placeholder {
                      line-height: 32px !important;
                    }
                    .privilege-select-update .ant-select-selection-search {
                      margin: 2px 0 !important;
                    }
                  `}</style>

                  <Select
                    mode="multiple"
                    placeholder="Select privileges..."
                    value={formData.privilegeIds.filter(id => !isNaN(id) && id != null)}
                    onChange={handlePrivilegeChange}
                    options={privileges
                      .filter(p => p.privilegeId != null && !isNaN(p.privilegeId))
                      .map(p => ({
                        label: p.name,
                        value: p.privilegeId,
                        description: p.description
                      }))}
                    showSearch
                    size="large"
                    maxTagCount={4}
                    className={`privilege-select-update w-full ${errors.privilegeIds ? 'border-red-500' : ''}`}
                    loading={privilegesLoading}
                    disabled={privilegesLoading || privileges.length === 0}
                    filterOption={(input, option) => {
                      const privilegeName = option.label?.toLowerCase() || '';
                      const privilegeDesc = option.description?.toLowerCase() || '';
                      const searchTerm = input.toLowerCase();
                      return privilegeName.includes(searchTerm) || privilegeDesc.includes(searchTerm);
                    }}
                    tagRender={(props) => {
                      const { label, value, closable, onClose } = props;
                      const privilege = privileges.find(p => p.privilegeId === value);
                      const formattedPrivilege = {
                        raw: privilege?.name || label,
                        name: formatPrivilegeName(privilege?.name || label)
                      };
                      return (
                        <PrivilegeTag 
                          privilege={formattedPrivilege} 
                          size="small" 
                          closable={closable}
                          onClose={onClose}
                          className="mr-1 mb-1"
                        />
                      );
                    }}
                    optionRender={(option) => {
                      const privilege = privileges.find(p => p.privilegeId === option.value);
                      const formattedPrivilege = {
                        raw: privilege?.name || option.label,
                        name: formatPrivilegeName(privilege?.name || option.label)
                      };
                      return (
                        <div className="flex items-center space-x-2">
                          <PrivilegeTag privilege={formattedPrivilege} size="small" />
                          <div className="text-xs text-gray-500 truncate">{option.description}</div>
                        </div>
                      );
                    }}
                  />

                  {/* Show errors or loading states */}
                  {privilegesError && (
                    <p className="mt-1 text-sm text-red-600">
                      Error loading privileges: {privilegesError}
                    </p>
                  )}
                  {!privilegesLoading && privileges.length === 0 && !privilegesError && (
                    <p className="mt-1 text-sm text-amber-600">
                      No privileges available
                    </p>
                  )}
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
                    placeholder="Enter role code"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.code 
                        ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                        : 'border-gray-300 hover:border-gray-400 focus:ring-blue-500'
                    }`}
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
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
                  Update Role
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