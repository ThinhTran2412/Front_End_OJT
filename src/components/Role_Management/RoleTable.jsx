import { Table, Popconfirm } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import PrivilegeCell from './PrivilegeCell';
import { InlineLoader } from '../Loading';

// Format "LAB_MANAGER" → "Lab Manager" hoặc "ADMIN" → "Admin"
function formatRoleName(name) {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')  // LAB_MANAGER → LAB MANAGER
    .toLowerCase()       // lab manager
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))  // Lab Manager
    .join(' ');
}

export default function RoleTable({
  roles,
  loading,
  sortBy,
  sortDesc,
  currentPage,
  pageSize,
  total,
  onTableChange,
  onPaginationChange,
  onDeleteRole
}) {
  // Ant Design Table columns configuration
  const columns = [
    {
      title: 'Role ID',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 100,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'id' ? (sortDesc ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Role Name',
      dataIndex: 'name', 
      key: 'name',
      width: 180,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'name' ? (sortDesc ? 'descend' : 'ascend') : null,
      render: (text) => {
        // Format name: LAB_MANAGER → Lab Manager
        const displayName = formatRoleName(text);
        return <span className="font-medium text-gray-900">{displayName}</span>;
      }
    },
    {
      title: 'Role Code',
      dataIndex: 'code',  // Sử dụng field 'code' từ backend
      key: 'code',
      width: 240,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'code' ? (sortDesc ? 'descend' : 'ascend') : null,
      render: (text, record) => {
        // Hiển thị code nếu có, nếu không thì hiển thị name (cho các role cũ)
        const displayCode = text || record.name || 'N/A';
        return (
          <span className="font-mono text-sm px-2.5 py-1 bg-purple-50 text-purple-700 rounded border border-purple-200">
            {displayCode}
          </span>
        );
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'description' ? (sortDesc ? 'descend' : 'ascend') : null,
      render: (text) => (
        <span className="text-gray-600">{text || '-'}</span>
      )
    },
    {
      title: 'Privilege',
      dataIndex: 'privileges', 
      key: 'privileges',
      render: (privileges) => <PrivilegeCell privileges={privileges} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => {
        // Get ID from multiple possible fields
        const roleId = record.roleId || record.id || record.roleID;
        
        if (!roleId) {
          console.warn('Role ID not found for record:', record);
          return <span className="text-gray-400 text-sm">N/A</span>;
        }

        // Check if this is the Admin role - hide Edit and Delete buttons
        const isAdminRole = record.name?.toLowerCase() === 'admin' || 
                           record.name?.toUpperCase() === 'ADMIN';

        if (isAdminRole) {
          return (
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-400 italic">Protected Role</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/role-management/update/${roleId}`}
              className="px-3 py-1 text-sm rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
            >
              Edit
            </Link>
            <Popconfirm
              placement="topRight"
              icon={<ExclamationCircleOutlined className="text-yellow-500" />}
              title={
                <div className="text-base font-semibold text-gray-900">Delete role</div>
              }
              description={
                <div className="text-sm text-gray-600">
                  Are you sure you want to delete role <span className="font-semibold">#{roleId}</span>?
                </div>
              }
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
              okButtonProps={{ className: 'bg-red-600 hover:bg-red-700 border-none' }}
              cancelButtonProps={{ className: 'border-gray-300 hover:border-gray-400' }}
              onConfirm={() => onDeleteRole && onDeleteRole(roleId)}
            >
              <button
                type="button"
                className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors duration-200"
              >
                Delete
              </button>
            </Popconfirm>
          </div>
        );
      }
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <InlineLoader 
            text="Loading roles..." 
            size="medium" 
            theme="purple" 
            centered={true}
          />
        </div>
      )}
      <Table
        columns={columns}
        dataSource={roles}
        loading={false}
        rowKey="roleId"
        onChange={onTableChange}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
          onChange: onPaginationChange
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </div>
  );
}