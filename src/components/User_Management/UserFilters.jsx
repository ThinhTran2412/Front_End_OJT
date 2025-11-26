import { Select, InputNumber, Space, Button } from 'antd';
import { Search } from 'lucide-react';
import SearchBar from '../General/SearchBar';

const { Option } = Select;

export default function UserFilters({
  filters = {},
  onSearch,
  onAgeFilter,
  onClear
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-72 group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={filters.keyword || ''}
            onChange={(e) => onSearch && onSearch(e.target.value, filters.filterField || '')}
            onKeyPress={(e) => e.key === 'Enter' && onSearch && onSearch(filters.keyword || '', filters.filterField || '')}
            placeholder="Search by name, email, or address"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium border border-transparent hover:border-gray-200"
          >
            Clear
          </button>
          <button
            onClick={() => onSearch && onSearch(filters.keyword || '', filters.filterField || '')}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md disabled:shadow-none"
          >
            Search
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <InputNumber
          placeholder="Min age"
          value={filters.minAge}
          onChange={(v) => onAgeFilter && onAgeFilter(v, filters.maxAge)}
          min={0}
          size="large"
          style={{ width: 120 }}
          className="h-[40px]"
        />
        <span className="font-bold text-gray-500">-</span>
        <InputNumber
          placeholder="Max age"
          value={filters.maxAge}
          onChange={(v) => onAgeFilter && onAgeFilter(filters.minAge, v)}
          min={0}
          size="large"
          style={{ width: 120 }}
          className="h-[40px]"
        />
      </div>
    </div>
  );
}