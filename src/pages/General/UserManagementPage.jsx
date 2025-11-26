import { useState, useEffect } from "react";
import api from "../../services/api";
import UserFilters from "../../components/User_Management/UserFilters";
import { useAuthStore } from "../../store/authStore";
import DashboardLayout from "../../layouts/DashboardLayout";
import { usePrivileges } from "../../hooks/usePrivileges";
import { Users, AlertCircle, Eye, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
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
  const navigate = useNavigate();
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

  // Handle create user
  const handleCreateUser = () => {
    navigate('/create-user');
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

  // Format functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${month}/${day}/${year} ${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Main Container - Gộp tất cả vào một card, chiếm toàn bộ không gian */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 animate-slide-in-left">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage and track system users</p>
                </div>
              </div>
              <div className="flex flex-col items-end animate-slide-in-right">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {users.length > 0 ? users.length.toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex-1 w-full">
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
              <button 
                onClick={handleCreateUser}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create User
              </button>
            </div>
          </div>

          {/* Validation Error Messages */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Validation Errors:</h3>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {Object.values(validationErrors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <InlineLoader 
                  text="Loading users" 
                  size="large" 
                  theme="blue" 
                  centered={true}
                />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">No users found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Full Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">
                          Date of Birth / Age
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                          Gender
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                          Phone Number
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">
                          Identify Number
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100/50">
                      {users.map((user, index) => (
                        <tr 
                          key={user.userId || user.id || user.email} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-transparent transition-all duration-300 group animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.fullName || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap w-40">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{formatDate(user.dateOfBirth)}</div>
                              <div className="text-sm text-gray-500">{user.age ? `${user.age} years old` : 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-24">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all duration-200 ${
                              user.gender === 'Male' || user.gender === 'male'
                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200/50' 
                                : user.gender === 'Female' || user.gender === 'female'
                                ? 'bg-gradient-to-r from-pink-100 to-pink-50 text-pink-800 border border-pink-200/50'
                                : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200/50'
                            }`}>
                              {user.gender || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-32">
                            {user.phoneNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 w-40">
                            <span className="font-mono text-xs">{user.identifyNumber || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={user.address}>
                            {user.address || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleViewClick(user)}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-blue-200/50 hover:border-blue-300"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-red-200/50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

      {/* User Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">User Details</h2>
                    <p className="text-blue-100 text-sm">{selectedUser?.fullName}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-white">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <span className="ml-4 text-gray-700 font-medium">Loading user details...</span>
                </div>
              ) : userDetails ? (
                <div className="space-y-6">
                  {/* User Basic Info */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                      Basic Information
                    </h3>
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
                  <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-blue-100/30">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full"></div>
                      Role Information
                    </h3>
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
                  <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm bg-gradient-to-br from-purple-50/50 to-purple-100/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"></div>
                        Privileges
                      </h3>
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
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
