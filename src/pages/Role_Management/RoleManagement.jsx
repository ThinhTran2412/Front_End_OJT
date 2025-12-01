import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import RoleFilters from '../../components/Role_Management/RoleFilters';
import RoleTable from '../../components/Role_Management/RoleTable';
import { message } from 'antd';
import { Search, ChevronLeft, ChevronRight, Plus, Shield, AlertCircle, CheckCircle, X } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useRoleStore } from '../../store/roleStore';
import { usePrivileges } from '../../hooks/usePrivileges';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
import CreateRoleModal from '../../components/modals/CreateRoleModal';

export default function RoleManagement() {
  const navigate = useNavigate();

  // Consolidated state management
  const [filters, setFilters] = useState({
    searchKeyword: '',
    selectedPrivileges: [],
    sortBy: null,
    sortDesc: false,
    currentPage: 1,
    pageSize: 10,
    hasSearched: false,
  });

  const [total, setTotal] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  const { roles, loading, error, setRoles, setLoading, setError } = useRoleStore();
  const { privileges, loading: privilegesLoading, error: privilegesError } = usePrivileges();
  const { isAuthenticated } = useAuthStore();

  // Debounce refs
  const filterTimeoutRef = useRef(null);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch roles
  const fetchRoles = useCallback(
    async (filterParams = filters) => {
      if (!isAuthenticated) {
        console.warn('User not authenticated, skipping roles fetch');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filterParams.searchKeyword?.trim()) {
          params.append('Search', filterParams.searchKeyword.trim());
        }
        params.append('Page', filterParams.currentPage.toString());
        params.append('PageSize', filterParams.pageSize.toString());

        if (filterParams.sortBy) {
          params.append('SortBy', filterParams.sortBy);
          params.append('SortDesc', filterParams.sortDesc.toString());
        }

        if (filterParams.selectedPrivileges?.length > 0) {
          filterParams.selectedPrivileges.forEach((id) => params.append('privilegeIds', id));
        }

        const queryString = params.toString();
        const response = await api.get(`/Roles?${queryString}`);

        if (response.status === 200) {
          const responseData = response.data;
          const rolesData = Array.isArray(responseData.items) ? responseData.items : [];
          setRoles(rolesData);
          setTotal(responseData.total || 0);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        if (error.response?.status === 401)
          setError('Session expired. Please login again.');
        else if (error.response?.status === 403)
          setError('You do not have permission to access this page.');
        else if (error.response?.status >= 500)
          setError('Server error. Please try again later.');
        else setError(error.message || 'Failed to load roles list');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, setRoles, setLoading, setError]
  );

  // Debounced fetch
  const debouncedFetchRoles = useMemo(() => {
    const timeoutRef = { current: null };
    return (newFilters) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fetchRoles(newFilters), 150);
    };
  }, [fetchRoles]);

  // Effects
  useEffect(() => {
    if (isAuthenticated) debouncedFetchRoles(filters);
  }, [filters, isAuthenticated, debouncedFetchRoles]);

  useEffect(() => {
    if (isAuthenticated) fetchRoles(filters);
  }, [isAuthenticated]);

  // Handlers
  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      currentPage: 1,
      hasSearched: true,
    }));
  }, []);

  const handleSearchInputChange = useCallback((e) => {
    setFilters((prev) => ({
      ...prev,
      searchKeyword: e.target.value,
    }));
  }, []);

  const handlePrivilegeFilter = useCallback((privilegeIds) => {
    setFilters((prev) => ({
      ...prev,
      selectedPrivileges: privilegeIds,
      currentPage: 1,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      selectedPrivileges: [],
      currentPage: 1,
      sortBy: null,
      sortDesc: false,
    }));
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      searchKeyword: '',
      currentPage: 1,
      hasSearched: false,
    }));
  }, []);

  const handleClearAll = useCallback(() => {
    setFilters({
      searchKeyword: '',
      selectedPrivileges: [],
      sortBy: null,
      sortDesc: false,
      currentPage: 1,
      pageSize: 10,
      hasSearched: false,
    });
  }, []);

  const handleTableChange = useCallback(
    (pagination, tableFilters, sorter) => {
      if (sorter && sorter.field) {
        const sortByMap = {
          roleId: 'id',
          name: 'name',
          code: 'code',
          description: 'description',
        };

        let newSortBy, newSortDesc;
        if (!sorter.order) {
          newSortBy = null;
          newSortDesc = false;
        } else if (sorter.order === 'ascend' && filters.sortBy === sortByMap[sorter.field]) {
          newSortBy = null;
          newSortDesc = false;
        } else {
          newSortBy = sortByMap[sorter.field] || 'id';
          newSortDesc = sorter.order === 'descend';
        }

        if (newSortBy !== filters.sortBy || newSortDesc !== filters.sortDesc) {
          setFilters((prev) => ({
            ...prev,
            sortBy: newSortBy,
            sortDesc: newSortDesc,
            currentPage: 1,
          }));
        }
      }
    },
    [filters.sortBy, filters.sortDesc]
  );

  const handlePaginationChange = useCallback((page, size) => {
    setFilters((prev) => ({
      ...prev,
      currentPage: page,
      pageSize: size !== prev.pageSize ? size : prev.pageSize,
    }));
  }, []);

  const handleEditRole = useCallback(
    (roleId) => {
      navigate(`/role-management/update/${roleId}`);
    },
    [navigate]
  );

  const handleCreateRole = useCallback(() => {
    setShowCreateRoleModal(true);
  }, []);

  const handleCreateRoleSuccess = useCallback(() => {
    fetchRoles(filters);
    setSuccessMessage('Role created successfully!');
  }, [fetchRoles, filters]);

  const handleDeleteRole = useCallback(
    async (roleId) => {
      try {
        const res = await api.delete(`/Roles/${roleId}`);
        if (res.status === 200 || res.status === 204) {
          setSuccessMessage('Role deleted successfully!');
        } else {
          message.warning('Delete request sent, please refresh to verify');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        setError(error.response?.data?.message || 'Failed to delete role. Please try again.');
      } finally {
        fetchRoles(filters);
      }
    },
    [fetchRoles, filters]
  );

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Main Container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 animate-slide-in-left">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Role Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage user roles and permissions</p>
                </div>
              </div>
              <div className="flex flex-col items-end animate-slide-in-right">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Roles</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex flex-col gap-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="text"
                      value={filters.searchKeyword}
                      onChange={handleSearchInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search roles by name, code, or description"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium border border-transparent hover:border-gray-200"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="px-5 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md disabled:shadow-none"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleCreateRole}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Create Role
                </button>
              </div>

              {/* Privilege Filter Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Privileges:</span>
                <div className="flex-1 max-w-md">
                  <RoleFilters
                    selectedPrivileges={filters.selectedPrivileges}
                    privileges={privileges}
                    privilegesLoading={privilegesLoading}
                    onPrivilegeFilter={handlePrivilegeFilter}
                    onClearFilters={handleClearFilters}
                    compact={true}
                  />
                </div>
                {(filters.searchKeyword || filters.selectedPrivileges.length > 0) && (
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="border-b border-green-200/60 bg-gradient-to-r from-green-50 to-emerald-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-green-800 flex-1 font-medium">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage('')}
                className="text-green-600 hover:text-green-800 hover:bg-green-100 rounded-full p-1 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-red-800 flex-1 font-medium">{error}</p>
            </div>
          )}

          {/* Privileges Loading/Error Messages */}
          {privilegesLoading && (
            <div className="border-b border-blue-200/60 bg-gradient-to-r from-blue-50 to-blue-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <InlineLoader size="small" text="" theme="blue" centered={false} />
              <p className="text-sm text-blue-800 font-medium">Loading privileges...</p>
            </div>
          )}

          {privilegesError && (
            <div className="border-b border-yellow-200/60 bg-gradient-to-r from-yellow-50 to-yellow-50/50 px-6 py-3 flex items-center gap-3 animate-slide-up shadow-sm">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-sm text-yellow-800 font-medium">Error loading privileges.</p>
            </div>
          )}

          {/* Table Section */}
          <div className="overflow-hidden">
            <RoleTable
              roles={roles}
              loading={loading}
              sortBy={filters.sortBy}
              sortDesc={filters.sortDesc}
              currentPage={filters.currentPage}
              pageSize={filters.pageSize}
              total={total}
              onTableChange={handleTableChange}
              onPaginationChange={handlePaginationChange}
              onEditRole={handleEditRole}
              onDeleteRole={handleDeleteRole}
            />
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal
        isOpen={showCreateRoleModal}
        onClose={() => setShowCreateRoleModal(false)}
        onSuccess={handleCreateRoleSuccess}
      />
    </DashboardLayout>
  );
}