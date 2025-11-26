import { Table, Button } from 'antd';
import { Users } from 'lucide-react';
import { InlineLoader } from '../Loading';

export default function UserTable({
  users,
  loading = false,
  onView,
  onDelete,
  onChange,
  genderFilter // controlled filter value from parent
}) {
  // Ensure users is always an array
  const tableData = Array.isArray(users) ? users : [];
  const columns = [
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: true,
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      width: 260,
      ellipsis: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Identify Number',
      dataIndex: 'identifyNumber',
      key: 'identifyNumber',
      render: (val) => <span className="font-mono text-xs">{val}</span>,
      width: 140,
      ellipsis: true,
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' }
      ],
      // support both string and array values from parent (multi-select)
      filteredValue: Array.isArray(genderFilter)
        ? genderFilter
        : (genderFilter ? [genderFilter] : []),
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      sorter: true,
      width: 90,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 260,
      ellipsis: true,
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '-',
      width: 140,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_text, record) => (
        <div className="flex items-center gap-2">
          <Button size="small" type="primary" onClick={() => onView && onView(record)}>
            View
          </Button>
          <button
            type="button"
            aria-label="Delete user"
            className="p-1.5 rounded hover:bg-red-50"
            onClick={() => onDelete && onDelete(record)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
              <path fillRule="evenodd" d="M16.5 4.478V4.25A2.25 2.25 0 0014.25 2h-4.5A2.25 2.25 0 007.5 4.25v.228A2.251 2.251 0 006.25 6.5h11.5a2.251 2.251 0 00-1.25-2.022zM18.75 7.5H5.25l.9 12.15A2.25 2.25 0 008.394 21h7.212a2.25 2.25 0 002.244-1.35L18.75 7.5zM9.75 10.5a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5zm4.5 0a.75.75 0 011.5 0v7.5a.75.75 0 01-1.5 0v-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <InlineLoader 
            text="Loading users" 
            size="large" 
            theme="blue" 
            centered={true}
          />
        </div>
      ) : tableData.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-base font-medium">No users found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={tableData}
            loading={false}
            rowKey={(row) => row.userId || row.id || row.email}
            pagination={false}
            onChange={onChange}
            size="middle"
            locale={{ emptyText: 'No Data' }}
            scroll={{ x: 1400 }}
            className="custom-user-table"
          />
        </div>
      )}
    </>
  );
}