import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FilterOptions {
  language: string;
  timeRange: string;
  searchType: 'projects' | 'channels';
}

const SearchBox = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    language: '',
    timeRange: '',
    searchType: 'projects'
  });

  const timeRangeOptions = [
    { label: 'Any time', value: '' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last week', value: '7d' },
    { label: 'Last month', value: '30d' },
    { label: 'Last year', value: '365d' }
  ];

  const languageOptions = [
    { label: 'Any language', value: '' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Ruby', value: 'ruby' },
    { label: 'Go', value: 'go' }
  ];

  const handleSearch = () => {
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set('q', searchQuery);
    if (filters.language) queryParams.set('lang', filters.language);
    if (filters.timeRange) queryParams.set('time', filters.timeRange);
    if (filters.searchType) queryParams.set('type', filters.searchType);

    navigate(`/search?${queryParams.toString()}`);
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white pl-4 pr-24 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <div className="absolute right-3 flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button
            onClick={handleSearch}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-4">
            {/* Search Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search for</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    checked={filters.searchType === 'projects'}
                    onChange={() => setFilters({ ...filters, searchType: 'projects' })}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Projects</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-blue-600"
                    checked={filters.searchType === 'channels'}
                    onChange={() => setFilters({ ...filters, searchType: 'channels' })}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Channels</span>
                </label>
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Programming Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Range</label>
              <select
                value={filters.timeRange}
                onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;