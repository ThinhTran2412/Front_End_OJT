import { useState, useEffect } from "react";
import api from "../../services/api";
import UserFilters from "../../components/User_Management/UserFilters";
import UserTable from "../../components/User_Management/UserTable";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../layouts/DashboardLayout";
import { usePrivileges } from "../../hooks/usePrivileges";
// JWT Decode function
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get access token from store
  const { accessToken } = useAuthStore();

  // Decode JWT token to get privileges
  const tokenPayload = accessToken ? decodeJWT(accessToken) : null;
  
  // Try different possible field names for privileges
  const jwtPrivileges = tokenPayload?.privilege || 
                        tokenPayload?.privileges || 
                        tokenPayload?.Privilege || 
                        tokenPayload?.Privileges || 
                        tokenPayload?.claims?.privilege ||
                        tokenPayload?.claims?.privileges ||
                        tokenPayload?.claims?.Privilege ||
                        tokenPayload?.claims?.Privileges ||
                        tokenPayload?.permissions ||
                        tokenPayload?.Permissions ||
                        tokenPayload?.roles ||
                        tokenPayload?.Roles ||
                        [];
  
  // Fallback to localStorage user privileges
  const localStorageUser = localStorage.getItem('user');
  const parsedUser = localStorageUser ? JSON.parse(localStorageUser) : null;
  const localStoragePrivileges = parsedUser?.privileges || [];
  
  // Use JWT privileges first, fallback to localStorage
  let userPrivileges = jwtPrivileges.length > 0 ? jwtPrivileges : localStoragePrivileges;
  
  // If still empty, try to get from localStorage user object with different field names
  if (userPrivileges.length === 0 && parsedUser) {
    userPrivileges = parsedUser?.privileges || 
                    parsedUser?.Privileges || 
                    parsedUser?.permissions ||
                    parsedUser?.Permissions ||
                    parsedUser?.roles ||
                    parsedUser?.Roles ||
                    [];
  }

  // Debug privileges
  console.log('=== JWT DEBUG ===');
  console.log('Access token:', accessToken);
  console.log('Token payload:', tokenPayload);
  console.log('Token payload keys:', tokenPayload ? Object.keys(tokenPayload) : 'No payload');
  
  // Debug each possible privilege field
  console.log('Checking privilege fields:');
  console.log('  tokenPayload.privilege:', tokenPayload?.privilege);
  console.log('  tokenPayload.privileges:', tokenPayload?.privileges);
  console.log('  tokenPayload.Privilege:', tokenPayload?.Privilege);
  console.log('  tokenPayload.Privileges:', tokenPayload?.Privileges);
  console.log('  tokenPayload.claims:', tokenPayload?.claims);
  console.log('  tokenPayload.claims?.privilege:', tokenPayload?.claims?.privilege);
  console.log('  tokenPayload.claims?.privileges:', tokenPayload?.claims?.privileges);
  console.log('  tokenPayload.claims?.Privilege:', tokenPayload?.claims?.Privilege);
  console.log('  tokenPayload.claims?.Privileges:', tokenPayload?.claims?.Privileges);
  console.log('  tokenPayload.permissions:', tokenPayload?.permissions);
  console.log('  tokenPayload.Permissions:', tokenPayload?.Permissions);
  console.log('  tokenPayload.roles:', tokenPayload?.roles);
  console.log('  tokenPayload.Roles:', tokenPayload?.Roles);
  
  console.log('JWT privileges:', jwtPrivileges);
  console.log('localStorage privileges:', localStoragePrivileges);
  console.log('Final user privileges:', userPrivileges);
  console.log('Privileges type:', typeof userPrivileges);
  console.log('Privileges length:', userPrivileges?.length);
  console.log('================');

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Privilege management state
  const [selectedPrivilegesToAdd, setSelectedPrivilegesToAdd] = useState([]);
  const [showPrivilegeDropdown, setShowPrivilegeDropdown] = useState(false);
  const [updatingPrivileges, setUpdatingPrivileges] = useState(false);
  
  // Get all available privileges
  const { privileges: allPrivileges, loading: privilegesLoading } = usePrivileges();

  // Filter & Sort State
  const [keyword, setKeyword] = useState("");
  const [filterField, setFilterField] = useState("");
  // store gender as an array to support multi-select filters from Ant Design Table
  const [gender, setGender] = useState([]);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [address, setAddress] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  // Validation State
  const [validationErrors, setValidationErrors] = useState({});

  // Check if current user can view user details based on privileges
  const canViewUserDetails = () => {
    // Privilege required to view user details
    const requiredPrivilege = 'VIEW_USER';
    
    // Check if user has VIEW_USER privilege
    const hasViewPrivilege = userPrivileges.includes(requiredPrivilege);
    
    // Temporary fix: Force enable for testing (DISABLED for proper privilege check)
    const forceEnable = false;
    
    console.log('Privilege check:', {
      userPrivileges,
      requiredPrivilege,
      hasViewPrivilege,
      forceEnable,
      canView: hasViewPrivilege || forceEnable
    });
    
    return hasViewPrivilege || forceEnable;
  };

  // Fetch user details with role and privileges
  const fetchUserDetails = async (user) => {
    try {
      setModalLoading(true);
      // Backend expects email parameter, not userId
      const response = await api.get(`/User/detail?email=${user.email}`);
      
      console.log('=== Fetch User Details ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      // Handle different possible field names for privileges
      let privileges = [];
      if (response.data) {
        // Try different field names (case-insensitive)
        privileges = response.data.privileges || 
                     response.data.Privileges || 
                     response.data.privilege || 
                     response.data.Privilege ||
                     response.data.permissions ||
                     response.data.Permissions ||
                     [];
      }
      
      // Ensure privileges is an array
      if (!Array.isArray(privileges)) {
        console.warn('Privileges is not an array:', privileges);
        privileges = [];
      }
      
      console.log('Extracted privileges:', privileges);
      console.log('Privileges count:', privileges.length);
      console.log('Privileges type:', typeof privileges);
      
      // Build user details data with normalized privileges
      const userDetailsData = {
        ...response.data,
        privileges: privileges
      };
      
      console.log('Final userDetailsData:', userDetailsData);
      console.log('Final privileges array:', userDetailsData.privileges);
      console.log('========================');
      
      setUserDetails(userDetailsData);
    } catch (error) {
      console.error("Error fetching user details:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      setUserDetails(null);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle view button click
  const handleViewClick = async (u) => {
    if (!canViewUserDetails()) {
      alert("You do not have permission to view user details");
      return;
    }

    setSelectedUser(u);
    setShowModal(true);
    await fetchUserDetails(u);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserDetails(null);
    setSelectedPrivilegesToAdd([]);
    setShowPrivilegeDropdown(false);
  };
  
  // Get available privileges that user doesn't have
  const getAvailablePrivileges = () => {
    if (!allPrivileges || !userDetails) return [];
    
    // Get user privileges with multiple fallbacks
    const userPrivilegesArray = userDetails.privileges || 
                                 userDetails.Privileges || 
                                 userDetails.privilege || 
                                 userDetails.Privilege || 
                                 [];
    
    const userPrivilegeNames = Array.isArray(userPrivilegesArray) 
      ? userPrivilegesArray.map(p => typeof p === 'string' ? p : p?.name || p?.privilegeName || p?.Name || String(p))
      : [];
    
    const available = allPrivileges.filter(priv => {
      // Handle both string and object formats
      const privName = typeof priv === 'string' ? priv : priv?.name || priv?.privilegeName || priv?.Name;
      return privName && !userPrivilegeNames.includes(privName);
    });
    
    // Debug log
    console.log('=== Get Available Privileges ===');
    console.log('All privileges:', allPrivileges);
    console.log('User privileges array:', userPrivilegesArray);
    console.log('User privilege names:', userPrivilegeNames);
    console.log('Available privileges:', available);
    console.log('================================');
    
    return available;
  };
  
  // Handle add privileges
  const handleAddPrivileges = async () => {
    if (!selectedPrivilegesToAdd || selectedPrivilegesToAdd.length === 0) {
      alert("Vui lòng chọn ít nhất một privilege để thêm");
      return;
    }
    
    if (!selectedUser) {
      alert("Không tìm thấy thông tin người dùng");
      return;
    }
    
    try {
      setUpdatingPrivileges(true);
      
      // Get privilege IDs - selectedPrivilegesToAdd contains IDs (numbers or strings that can be parsed)
      const privilegeIds = selectedPrivilegesToAdd.map(priv => {
        // If it's already a number, return it
        if (typeof priv === 'number') return priv;
        
        // If it's a string, try to parse it as a number first
        const parsed = parseInt(priv, 10);
        if (!isNaN(parsed) && parsed.toString() === priv) {
          // It's a valid numeric string
          return parsed;
        }
        
        // If parsing fails or it's not a pure number, try to find the privilege by name/identifier
        const found = allPrivileges.find(p => {
          if (typeof p === 'string') {
            return p === priv;
          }
          // Check by ID first
          if ((p?.privilegeId && String(p.privilegeId) === String(priv)) || 
              (p?.id && String(p.id) === String(priv))) {
            return true;
          }
          // Check by name
          const pName = p?.name || p?.privilegeName;
          return pName === priv;
        });
        
        if (found) {
          return found?.privilegeId || found?.id || null;
        }
        
        // Last resort: try to parse as number anyway
        const lastResort = parseInt(priv, 10);
        return !isNaN(lastResort) ? lastResort : null;
      }).filter(id => id != null && !isNaN(id) && id > 0);
      
      if (privilegeIds.length === 0) {
        throw new Error('Không tìm thấy privilege ID hợp lệ');
      }
      
      const userId = selectedUser?.userId || selectedUser?.id;
      if (!userId) {
        throw new Error('Missing userId');
      }
      
      // Get email from selectedUser or userDetails
      const email = selectedUser?.email || userDetails?.email;
      if (!email) {
        throw new Error('Missing email');
      }
      
      console.log('Adding privileges:', {
        userId,
        email,
        privilegeIds,
        selectedPrivilegesToAdd
      });
      
      const response = await api.put('/User/update', {
        UserId: userId,
        Email: email,
        ActionType: 'add',
        PrivilegeIds: privilegeIds
      });
      
      console.log('API Response:', response.data);
      
      // Wait a bit to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh user details - ensure we have the latest data
      console.log('Refreshing user details after adding privileges...');
      await fetchUserDetails(selectedUser);
      
      // Wait a bit more and fetch again to ensure we have the latest data
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUserDetails(selectedUser);
      
      // Also refresh the user list to ensure consistency
      setRefreshKey((k) => k + 1);
      
      // Clear selection
      setSelectedPrivilegesToAdd([]);
      setShowPrivilegeDropdown(false);
      
      alert("Thêm privilege thành công!");
    } catch (error) {
      console.error('Error adding privileges:', error);
      alert(error.response?.data?.message || error.message || 'Thêm privilege thất bại. Vui lòng thử lại.');
    } finally {
      setUpdatingPrivileges(false);
    }
  };
  
  // Handle reset privileges
  const handleResetPrivileges = async () => {
    if (!selectedUser) {
      alert("Không tìm thấy thông tin người dùng");
      return;
    }
    
    const confirmed = window.confirm("Bạn có chắc muốn reset các privilege đã thêm?");
    if (!confirmed) return;
    
    // Hiển thị thông báo trước khi thực hiện reset
    alert("Đang reset các privilege đã thêm. Vui lòng đợi...");
    
    try {
      setUpdatingPrivileges(true);
      
      const userId = selectedUser?.userId || selectedUser?.id;
      if (!userId) {
        throw new Error('Missing userId');
      }
      
      // Get email from selectedUser or userDetails
      const email = selectedUser?.email || userDetails?.email;
      if (!email) {
        throw new Error('Missing email');
      }
      
      console.log('Resetting privileges:', {
        userId,
        email
      });
      
      const response = await api.put('/User/update', {
        UserId: userId,
        Email: email,
        ActionType: 'reset'
      });
      
      console.log('API Response:', response.data);
      
      // Wait a bit to ensure backend has processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh user details - ensure we have the latest data
      console.log('Refreshing user details after resetting privileges...');
      await fetchUserDetails(selectedUser);
      
      // Wait a bit more and fetch again to ensure we have the latest data
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUserDetails(selectedUser);
      
      // Also refresh the user list to ensure consistency
      setRefreshKey((k) => k + 1);
      
      // Clear selection
      setSelectedPrivilegesToAdd([]);
      setShowPrivilegeDropdown(false);
      
      // Hiển thị thông báo thành công sau khi đã refresh và hiển thị privileges mới
      alert("Reset privilege thành công! Các privilege đã được reset về trạng thái ban đầu.");
    } catch (error) {
      console.error('Error resetting privileges:', error);
      alert(error.response?.data?.message || 'Reset privilege thất bại. Vui lòng thử lại.');
    } finally {
      setUpdatingPrivileges(false);
    }
  };

  // Validation functions
  const validateMinAge = (value) => {
    // Consider 0 as a valid provided value, so check for null/empty explicitly
    const provided = value !== '' && value !== null && value !== undefined;
    if (provided) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        return "MinAge must be greater than or equal to 0";
      }
    }
    return null;
  };

  const validateMaxAge = (value) => {
    // Consider 0 as a valid provided value, so check for null/empty explicitly
    const provided = value !== '' && value !== null && value !== undefined;
    if (provided) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        return "MaxAge must be greater than or equal to 0";
      }
    }
    return null;
  };

  const validateAgeRange = (minAge, maxAge) => {
    const minProvided = minAge !== '' && minAge !== null && minAge !== undefined;
    const maxProvided = maxAge !== '' && maxAge !== null && maxAge !== undefined;
    if (minProvided && maxProvided) {
      const minNum = Number(minAge);
      const maxNum = Number(maxAge);
      if (!isNaN(minNum) && !isNaN(maxNum) && minNum >= maxNum) {
        return "MinAge must be less than MaxAge";
      }
    }
    return null;
  };

  // Validate all fields
  const validateFields = () => {
    const errors = {};

    const minAgeError = validateMinAge(minAge);
    if (minAgeError) errors.minAge = minAgeError;

    const maxAgeError = validateMaxAge(maxAge);
    if (maxAgeError) errors.maxAge = maxAgeError;

    const ageRangeError = validateAgeRange(minAge, maxAge);
    if (ageRangeError) errors.ageRange = ageRangeError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Validate fields before making API call
        if (!validateFields()) {
          setLoading(false);
          return;
        }

        // Normalize gender for API: backend usually expects a string or undefined.
        // If user selects multiple genders, send as comma-separated string (e.g. 'male,female').
        let genderParam;
        if (Array.isArray(gender)) {
          if (gender.length === 0) genderParam = undefined;
          else if (gender.length === 1) genderParam = gender[0];
          else genderParam = gender.join(',');
        } else {
          genderParam = gender || undefined;
        }

        const params = {
          Keyword: keyword,
          FilterField: filterField,
          Gender: genderParam,
          MinAge: minAge || undefined,
          MaxAge: maxAge || undefined,
          Address: address,
          SortBy: sortBy,
          SortOrder: sortOrder,
        };
        const res = await api.get("/User/getListOfUser", { params });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [keyword, filterField, gender, minAge, maxAge, address, sortBy, sortOrder, refreshKey]);

  // Handlers for UserFilters
  const handleSearch = (searchValue, field = '') => {
    setKeyword(searchValue || '');
    setFilterField(field || '');
  };

  const handleAgeFilter = (min, max) => {
    setMinAge(min ?? '');
    setMaxAge(max ?? '');
  };

  const handleClearFilters = () => {
    setKeyword('');
    setFilterField('');
    setGender([]);
    setMinAge('');
    setMaxAge('');
    setAddress('');
    setSortBy('');
    setSortOrder('asc');
    setValidationErrors({});
  };

  // Handle table change (sorting) from Ant Design Table
  const handleTableChange = (_pagination, filters, sorter) => {
    // Handle sorting
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s) {
      if (s.field) {
        setSortBy(s.field || '');
      }
      if (s.order) {
        setSortOrder(s.order === 'descend' ? 'desc' : 'asc');
      } else {
        setSortOrder('asc');
      }
    }
    // Handle gender filter coming from AntD Table filters (can be multi-select array)
    if (filters && Object.prototype.hasOwnProperty.call(filters, 'gender')) {
      if (Array.isArray(filters.gender) && filters.gender.length > 0) {
        // store full array so we preserve multi-select (male + female)
        setGender(filters.gender);
      } else {
        setGender([]);
      }
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    const name = user?.fullName || user?.email || 'this user';
    const confirmed = window.confirm(`Are you sure you want to delete ${name}?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      // Delete by userId using DELETE method
      const userId = user?.userId || user?.id;
      if (!userId) throw new Error('Missing userId');
      await api.delete(`/User/delete/${userId}`);
      // refresh list
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
      </div>

      {/* Filter & Sort Controls (replaced by UserFilters) */}
      <div className="px-6 py-4">
        <UserFilters
          filters={{
            keyword,
            filterField,
            minAge,
            maxAge,
          }}
          onSearch={handleSearch}
          onAgeFilter={handleAgeFilter}
          onClear={handleClearFilters}
        />
      </div>

      {/* Validation Error Messages */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="px-4 pb-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Validation Errors:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table (replaced by UserTable) */}
      <div className="flex-1 p-6">
        <UserTable
          users={users}
          loading={loading}
          onView={handleViewClick}
          onDelete={handleDeleteUser}
          onChange={handleTableChange}
          genderFilter={gender}
        />
      </div>

      {/* User Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">User Details</h2>
                  <p className="text-blue-100">{selectedUser?.fullName}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* User Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{userDetails.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{userDetails.phoneNumber || "-"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Age</label>
                        <p className="text-gray-900">{userDetails.age}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900">{userDetails.gender || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role Information */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Role ID</label>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {userDetails.roleId}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Role Name</label>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {userDetails.roleName}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Role Code</label>
                        <p className="text-gray-900">{userDetails.roleCode || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Privileges */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Privileges</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowPrivilegeDropdown(!showPrivilegeDropdown)}
                          disabled={updatingPrivileges || privilegesLoading}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </button>
                        <button
                          onClick={handleResetPrivileges}
                          disabled={updatingPrivileges}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset
                        </button>
                      </div>
                    </div>
                    
                    {/* Privilege Dropdown */}
                    {showPrivilegeDropdown && (
                      <div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chọn privileges để thêm (có thể chọn nhiều):
                        </label>
                        <select
                          multiple
                          value={selectedPrivilegesToAdd}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedPrivilegesToAdd(values);
                          }}
                          className="w-full min-h-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={updatingPrivileges || privilegesLoading}
                        >
                          {getAvailablePrivileges().map((priv, index) => {
                            const privName = typeof priv === 'string' ? priv : priv?.name || priv?.privilegeName || `Privilege ${priv?.privilegeId || index}`;
                            // Get privilege ID - prioritize privilegeId, then id, then try to find by name
                            let privId;
                            if (typeof priv === 'object') {
                              privId = priv?.privilegeId || priv?.id;
                              // If no ID found, we'll need to find it by name later
                              if (!privId) {
                                // Use name as identifier, will be resolved in handleAddPrivileges
                                privId = privName;
                              }
                            } else {
                              // String format - use as is, will be resolved in handleAddPrivileges
                              privId = privName;
                            }
                            return (
                              <option key={index} value={String(privId)}>
                                {privName}
                              </option>
                            );
                          })}
                        </select>
                        {getAvailablePrivileges().length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">Không còn privilege nào để thêm</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleAddPrivileges}
                            disabled={updatingPrivileges || selectedPrivilegesToAdd.length === 0}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingPrivileges ? 'Đang thêm...' : 'Xác nhận thêm'}
                          </button>
                          <button
                            onClick={() => {
                              setShowPrivilegeDropdown(false);
                              setSelectedPrivilegesToAdd([]);
                            }}
                            disabled={updatingPrivileges}
                            className="px-4 py-2 text-sm bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(() => {
                        // Get privileges array with multiple fallbacks
                        const privilegesArray = userDetails?.privileges || 
                                                userDetails?.Privileges || 
                                                userDetails?.privilege || 
                                                userDetails?.Privilege || 
                                                [];
                        
                        const normalizedPrivileges = Array.isArray(privilegesArray) 
                          ? privilegesArray 
                          : [];
                        
                        console.log('Rendering privileges:', {
                          userDetails,
                          privilegesArray,
                          normalizedPrivileges,
                          count: normalizedPrivileges.length
                        });
                        
                        if (normalizedPrivileges.length > 0) {
                          return normalizedPrivileges.map((privilege, index) => {
                            // Handle both string and object formats
                            const privilegeName = typeof privilege === 'string' 
                              ? privilege 
                              : privilege?.name || privilege?.privilegeName || privilege?.Name || String(privilege);
                            
                            return (
                              <div
                                key={`${privilegeName}-${index}`}
                                className="bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 hover:bg-purple-100 transition-colors"
                                title={privilegeName}
                              >
                                {privilegeName}
                              </div>
                            );
                          });
                        } else {
                          return (
                            <p className="text-gray-500 col-span-full">No privileges assigned</p>
                          );
                        }
                      })()}
                    </div>
                    {/* Debug info */}
                    {userDetails && (
                      <div className="mt-2 text-xs text-gray-400">
                        Total privileges: {(() => {
                          const privs = userDetails?.privileges || 
                                       userDetails?.Privileges || 
                                       userDetails?.privilege || 
                                       userDetails?.Privilege || 
                                       [];
                          return Array.isArray(privs) ? privs.length : 0;
                        })()}
                        {process.env.NODE_ENV === 'development' && (
                          <span className="ml-2">
                            (Raw: {JSON.stringify(userDetails.privileges || userDetails.Privileges || 'none')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading User Details</h3>
                  <p className="text-gray-500">Unable to fetch user information. Please try again.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
