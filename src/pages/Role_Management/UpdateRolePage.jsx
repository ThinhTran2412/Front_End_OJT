import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RoleService } from "../../services/RoleService";
import DashboardLayout from "../../layouts/DashboardLayout";
import { usePrivileges } from "../../hooks/usePrivileges";
import { Select } from "antd";

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
        
        const [roleRes, privilegesRes] = await Promise.all([
          RoleService.getById(id),
          RoleService.getAllPrivileges(),
        ]);

        console.log("Role response:", roleRes);
        console.log("Privileges response:", privilegesRes);

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
        
        // Extract privilege IDs from role data
        // API might return privileges as array of objects or array of IDs
        let privilegeIds = [];
        if (role.privileges && Array.isArray(role.privileges)) {
          privilegeIds = role.privileges.map(p => {
            if (typeof p === 'object' && p !== null) {
              return p.privilegeId || p.id || p.privilegeId;
            }
            return typeof p === 'number' || typeof p === 'string' ? p : null;
          }).filter(Boolean).map(id => typeof id === 'string' ? parseInt(id, 10) : id);
        } else if (role.privilegeIds && Array.isArray(role.privilegeIds)) {
          privilegeIds = role.privilegeIds.map(id => 
            typeof id === 'string' ? parseInt(id, 10) : id
          ).filter(Boolean);
        }

        console.log("Extracted privilege IDs:", privilegeIds);

        setFormData({
          name: role.name || "",
          code: role.code || "",
          description: role.description || "",
          privilegeIds: privilegeIds,
        });

        if (!privilegesRes.success) {
          console.warn("Failed to load privileges:", privilegesRes.message);
        }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading role data...</p>
          </div>
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
                  <Select
                    mode="multiple"
                    placeholder="Select privileges..."
                    value={formData.privilegeIds}
                    onChange={(vals) => {
                      setFormData(prev => ({ ...prev, privilegeIds: vals }));
                      setErrors(prev => ({ ...prev, privilegeIds: '' }));
                    }}
                    options={(Array.isArray(privileges) ? privileges : []).map(p => ({
                      label: p.name,
                      value: p.privilegeId,
                    }))}
                    showSearch
                    size="large"
                    className={`w-full ${
                      errors.privilegeIds ? 'border-red-500' : ''
                    }`}
                    loading={privilegesLoading}
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
