import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import RoleFilters from '../../components/Role_Management/RoleFilters';
import RoleTable from '../../components/Role_Management/RoleTable';
import { message } from 'antd';
import SearchBar from '../../components/General/SearchBar';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useRoleStore } from '../../store/roleStore';
import { usePrivileges } from '../../hooks/usePrivileges';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function RoleManagement() {
  const navigate = useNavigate(); // Navigate to Update Role page

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

  const { roles, loading, error, setRoles, setLoading, setError } = useRoleStore();
  const { privileges, loading: privilegesLoading, error: privilegesError } = usePrivileges();
  const { isAuthenticated } = useAuthStore();

  // Debounce refs
  const filterTimeoutRef = useRef(null);

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
  const handleSearch = useCallback((keyword) => {
    setFilters((prev) => ({
      ...prev,
      searchKeyword: keyword,
      currentPage: 1,
      hasSearched: true,
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

  // Add: handler for Edit button
  const handleEditRole = useCallback(
    (roleId) => {
      navigate(`/role-management/update/${roleId}`);
    },
    [navigate]
  );

  // Delete role handler (show notification instead of redirecting)
  const handleDeleteRole = useCallback(
    async (roleId) => {
      try {
        const res = await api.delete(`/Roles/${roleId}`);
        if (res.status === 200 || res.status === 204) {
          message.success('Deleted role successfully');
        } else {
          message.warning('Delete request sent, please refresh to verify');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        message.error(
          error.response?.data?.message || 'Failed to delete role. Please try again.'
        );
      } finally {
        // Always refresh current list
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
      <style>{`
        .privilege-dropdown .ant-dropdown-menu {
          max-height: 300px !important;
          overflow-y: auto !important;
          padding: 4px 0 !important;
        }
      `}</style>

      <div className="w-full">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Role Management</h1>

{/* Privileges Loading Message */}
{privilegesLoading && (
  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex items-center">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
      <p className="text-blue-800 text-sm">Loading privileges...</p>
    </div>
  </div>
)}

{/* Privileges Error Message */}
{privilegesError && (
  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div className="flex items-center justify-between">
      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.6A1.75 1.75 0 0116.518 17H3.482a1.75 1.75 0 01-1.743-2.3l6.518-11.6zM10 12a.75.75 0 100 1.5A.75.75 0 0010 12zm0-5.5a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5A.75.75 0 0010 6.5z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-yellow-700 text-sm">Error loading privileges.</p>
    </div>
  </div>
)}


        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="w-full lg:w-[550px]">
              <SearchBar
                placeholder="Search roles..."
                value={filters.searchKeyword}
                onSearch={handleSearch}
                showSearchButton={true}
                onClear={handleClearSearch}
                className="w-full"
              />
            </div>
            {(filters.searchKeyword || filters.selectedPrivileges.length > 0) && (
              <button
                onClick={handleClearAll}
                className="px-5 py-3 text-base text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters + Table */}
        <RoleFilters
          selectedPrivileges={filters.selectedPrivileges}
          privileges={privileges}
          privilegesLoading={privilegesLoading}
          onPrivilegeFilter={handlePrivilegeFilter}
          onClearFilters={handleClearFilters}
        />

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
          onEditRole={handleEditRole} // Pass Edit callback
          onDeleteRole={handleDeleteRole} // Pass Delete callback (optional)
        />
      </div>
    </DashboardLayout>
  );
}
