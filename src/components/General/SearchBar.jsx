import { useState, useEffect } from 'react';

export default function SearchBar({ 
  placeholder = "Keyword, topic,...", 
  onSearch, 
  className = "",
  value = "",
  onChange,
  showSearchButton = false,
  onClear
}) {
  const [searchValue, setSearchValue] = useState(value);

  // Sync local state with parent state
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    
    // Call onChange if provided (controlled component)
    if (onChange) {
      onChange(e);
    }
    
    // Only call onSearch if there's no search button
    if (onSearch && !showSearchButton) {
      onSearch(newValue);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && showSearchButton) {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative max-w-xl ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${showSearchButton ? 'pr-20' : 'pr-10'}`}
      />
      
      {showSearchButton ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {/* Clear button - only show when there's text */}
          {searchValue && (
            <button
              onClick={handleClear}
              className="mr-3 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Search button */}
          <button
            onClick={handleSearch}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors duration-200"
            title="Search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}
    </div>
  );
}
