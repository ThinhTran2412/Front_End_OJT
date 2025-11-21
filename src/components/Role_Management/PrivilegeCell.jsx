import { Dropdown, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import PrivilegeTag from './PrivilegeTag';

// ✅ Format "READ_ONLY" → "Read Only"
function formatPrivilegeName(name) {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function PrivilegeCell({ privileges }) {
  const [privilegesData, setPrivilegesData] = useState([]);

  useEffect(() => {
    if (!privileges || privileges.length === 0) {
      setPrivilegesData([]);
      return;
    }

    const parsed = privileges.map(p => {
      const raw = typeof p === "string"
        ? p
        : p?.name || `Privilege_${p?.privilegeId}`;

      return {
        raw,
        name: formatPrivilegeName(raw)
      };
    });

    setPrivilegesData(parsed);
  }, [privileges]);

  if (!privilegesData.length) {
    return <PrivilegeTag privilege={{ name: "No Privileges" }} size="small" />;
  }

  const visible = privilegesData.slice(0, 3);
  const hidden = privilegesData.slice(3);

  const dropdownMenu = {
    items: hidden.map((priv, idx) => ({
      key: idx,
      label: (
        <div className="py-0.5">
          <PrivilegeTag privilege={priv} size="small" />
        </div>
      ),
    })),
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map((priv, idx) => (
        <PrivilegeTag key={idx} privilege={priv} size="small" />
      ))}

      {hidden.length > 0 && (
        <Dropdown 
          menu={dropdownMenu}
          trigger={['click']}
          placement="bottomLeft"
          overlayStyle={{ maxHeight: '300px', overflowY: 'auto', padding: '4px 0' }}
        >
          <Button 
            type="text" 
            size="small" 
            className="text-blue-500 hover:text-blue-700 p-0 h-auto"
          >
            +{hidden.length} more <DownOutlined className="text-xs" />
          </Button>
        </Dropdown>
      )}
    </div>
  );
}
