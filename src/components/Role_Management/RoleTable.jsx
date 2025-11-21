import { Table, Popconfirm } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import PrivilegeCell from './PrivilegeCell';

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
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'name' ? (sortDesc ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Role Code',
      dataIndex: 'code', 
      key: 'code',
      width: 120,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'code' ? (sortDesc ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: sortBy === 'description' ? (sortDesc ? 'descend' : 'ascend') : null,
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
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
