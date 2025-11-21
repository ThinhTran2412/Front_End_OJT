import { Select, InputNumber, Space, Button } from 'antd';
import SearchBar from '../General/SearchBar';

const { Option } = Select;

export default function UserFilters({
  filters = {},
  onSearch,
  onAgeFilter,
  onClear
}) {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        <div className="flex items-center gap-3 flex-1">
          <Select
            value={filters.filterField || ''}
            onChange={(v) => onSearch && onSearch(filters.keyword || '', v)}
            style={{ width: 120, height: 50 }}
            placeholder="Search by"
            size="large"
            className="h-[40px] "
          >
            <Option value="">Search by</Option>
            <Option value="fullName">Full Name</Option>
            <Option value="email">Email</Option>
            <Option value="address">Address</Option>
          </Select>

          <SearchBar
            value={filters.keyword}
            onSearch={(val) => onSearch && onSearch(val, filters.filterField)}
            placeholder="Search users..."
            className="flex-1"
            inputClassName="h-12 text-base"
          />
        </div>

        <div className="flex items-center gap-3">
          <InputNumber
            placeholder="Min age"
            value={filters.minAge}
            onChange={(v) => onAgeFilter && onAgeFilter(v, filters.maxAge)}
            min={0}
            size="large"
            style={{ width: 160, height: 50 }}
            className="h-[40px]"
          />
          <span className="font-bold">-</span>
          <InputNumber
            placeholder="Max age"
            value={filters.maxAge}
            onChange={(v) => onAgeFilter && onAgeFilter(filters.minAge, v)}
            min={0}
            size="large"
            style={{ width: 160, height: 50 }}
            className="h-[40px]"
          />

          <Button onClick={onClear} size="large">Clear</Button>
        </div>
      </div>
    </div>
  );
}