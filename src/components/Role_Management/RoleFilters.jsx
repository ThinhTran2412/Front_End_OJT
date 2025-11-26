import { Select } from 'antd';
import PrivilegeTag from './PrivilegeTag';

// Format "READ_ONLY" → "Read Only"
function formatPrivilegeName(name) {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function RoleFilters({
  selectedPrivileges,
  privileges,
  privilegesLoading,
  onPrivilegeFilter,
  onClearFilters,
  compact = false
}) {
  if (compact) {
    return (
      <>
        <style jsx>{`
          .privilege-select-compact .ant-select-selector {
            min-height: 40px !important;
            padding: 6px 12px !important;
            display: flex !important;
            align-items: flex-start !important;
            flex-wrap: wrap !important;
          }
          .privilege-select-compact .ant-select-selection-item {
            margin: 2px 4px 2px 0 !important;
          }
          .privilege-select-compact .ant-select-selection-placeholder {
            line-height: 28px !important;
          }
          .privilege-select-compact .ant-select-selection-search {
            margin: 2px 0 !important;
          }
        `}</style>
        
        <Select
          mode="multiple"
          placeholder="Select privileges..."
          value={selectedPrivileges}
          onChange={onPrivilegeFilter}
          style={{ width: '100%' }}
          loading={privilegesLoading}
          showSearch={true}
          size="middle"
          maxTagCount={2}
          className="privilege-select-compact"
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
          options={privileges.map(privilege => ({
            label: privilege.name,
            value: privilege.privilegeId,
            description: privilege.description
          }))}
          optionRender={(option) => {
            const privilege = privileges.find(p => p.privilegeId === option.value);
            const formattedPrivilege = {
              raw: privilege?.name || option.label,
              name: formatPrivilegeName(privilege?.name || option.label)
            };
            return (
              <div className="flex items-center space-x-2">
                <PrivilegeTag privilege={formattedPrivilege} size="small" />
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            );
          }}
        />
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .privilege-select .ant-select-selector {
          min-height: 48px !important;
          padding: 8px 12px !important;
          display: flex !important;
          align-items: flex-start !important;
          flex-wrap: wrap !important;
        }
        .privilege-select .ant-select-selection-item {
          margin: 2px 4px 2px 0 !important;
        }
        .privilege-select .ant-select-selection-placeholder {
          line-height: 32px !important;
        }
        .privilege-select .ant-select-selection-search {
          margin: 2px 0 !important;
        }
      `}</style>
      
      {/* Privilege Filter */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <span className="text-base font-medium text-gray-700 whitespace-nowrap">Filter by Privileges:</span>
          <div className="w-full lg:w-[400px]">
            <Select
              mode="multiple"
              placeholder="Select privileges to filter"
              value={selectedPrivileges}
              onChange={onPrivilegeFilter}
              style={{ width: '100%' }}
              loading={privilegesLoading}
              showSearch={true}
              size="large"
              maxTagCount={3}
              className="privilege-select"
              filterOption={(input, option) => {
                // Search by privilege name
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
              options={privileges.map(privilege => ({
                label: privilege.name,
                value: privilege.privilegeId,
                description: privilege.description
              }))}
              optionRender={(option) => {
                const privilege = privileges.find(p => p.privilegeId === option.value);
                const formattedPrivilege = {
                  raw: privilege?.name || option.label,
                  name: formatPrivilegeName(privilege?.name || option.label)
                };
                return (
                  <div className="flex items-center space-x-2">
                    <PrivilegeTag privilege={formattedPrivilege} size="small" />
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                );
              }}
            />
          </div>
          {(selectedPrivileges.length > 0 ) && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </>
  );
}