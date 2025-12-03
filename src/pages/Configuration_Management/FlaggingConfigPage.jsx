import { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, CheckCircle, X, Settings2, TrendingUp, TrendingDown, Users, Calendar, Plus } from 'lucide-react';
import { getAllFlaggingConfigs, syncFlaggingConfigs } from '../../services/FlaggingConfigService';
import { useToast, ToastContainer } from '../../components/Toast';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
import DashboardLayout from '../../layouts/DashboardLayout';
import SyncFlaggingConfigModal from '../../components/modals/SyncFlaggingConfigModal';

export default function FlaggingConfigPage() {
  const [flaggingConfigs, setFlaggingConfigs] = useState([]);
  const [filteredConfigs, setFilteredConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTestCode, setSelectedTestCode] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
// Thay đổi state name
const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

// Thay đổi handler
const handleSync = async (configsToSync) => {
  try {
    await syncFlaggingConfigs(configsToSync);
    showToast('Flagging configurations synced successfully!', 'success');
    await fetchFlaggingConfigs();
    return true;
  } catch (err) {
    console.error('Error syncing flagging configurations:', err);
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.title ||
                        err.message || 
                        'Failed to sync flagging configurations';
    showToast(errorMessage, 'error');
    throw err;
  }
};

const handleOpenSyncModal = () => {
  setIsSyncModalOpen(true);
};
  
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    fetchFlaggingConfigs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [flaggingConfigs, searchTerm, selectedTestCode, selectedGender, selectedStatus]);

  const fetchFlaggingConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllFlaggingConfigs();
      setFlaggingConfigs(data);
      setFilteredConfigs(data);
    } catch (err) {
      console.error('Error fetching flagging configurations:', err);
      setError('Failed to load flagging configurations. Please try again.');
      showToast('Failed to load flagging configurations', 'error');
      setFlaggingConfigs([]);
      setFilteredConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (configsToAdd) => {
    try {
      await addFlaggingConfigs(configsToAdd);
      showToast('Flagging configurations added successfully!', 'success');
      // Refresh data after add
      await fetchFlaggingConfigs();
      return true;
    } catch (err) {
      console.error('Error adding flagging configurations:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.title ||
                          err.message || 
                          'Failed to add flagging configurations';
      showToast(errorMessage, 'error');
      throw err;
    }
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const applyFilters = () => {
    let filtered = [...flaggingConfigs];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(config =>
        config.testCode?.toLowerCase().includes(searchLower) ||
        config.parameterName?.toLowerCase().includes(searchLower) ||
        config.description?.toLowerCase().includes(searchLower) ||
        config.unit?.toLowerCase().includes(searchLower)
      );
    }

    // Test code filter
    if (selectedTestCode !== 'all') {
      filtered = filtered.filter(config => config.testCode === selectedTestCode);
    }

    // Gender filter
    if (selectedGender !== 'all') {
      if (selectedGender === 'null') {
        filtered = filtered.filter(config => config.gender === null || config.gender === undefined);
      } else {
        filtered = filtered.filter(config => config.gender === selectedGender);
      }
    }

    // Status filter
    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      filtered = filtered.filter(config => config.isActive === isActive);
    }

    setFilteredConfigs(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTestCode('all');
    setSelectedGender('all');
    setSelectedStatus('all');
  };

  const getUniqueTestCodes = () => {
    const codes = [...new Set(flaggingConfigs.map(config => config.testCode))];
    return codes.filter(Boolean).sort();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getGenderBadgeColor = (gender) => {
    if (!gender) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (gender === 'Male') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (gender === 'Female') return 'bg-pink-100 text-pink-800 border-pink-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const groupedByTestCode = filteredConfigs.reduce((acc, config) => {
    const code = config.testCode || 'Unknown';
    if (!acc[code]) {
      acc[code] = [];
    }
    acc[code].push(config);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Main Container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200/60 min-h-[calc(100vh-64px)] overflow-hidden animate-fade-in">
          {/* Header Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-white to-gray-50/30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 transition-transform duration-300 hover:scale-110 hover:rotate-3">
                  <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Flagging Configuration</h1>
                  <p className="text-xs text-gray-500 mt-0.5">View and manage test parameter reference ranges</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleOpenSyncModal}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <Settings2 className="w-4 h-4" />
                  Sync
                </button>
                <div className="flex flex-col items-end">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Configurations</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                      {filteredConfigs.length.toLocaleString()}
                    </p>
                    {filteredConfigs.length !== flaggingConfigs.length && (
                      <span className="text-sm text-gray-500">
                        of {flaggingConfigs.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="border-b border-gray-200/80 px-6 py-4 bg-gradient-to-r from-gray-50/80 to-white">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by test code, parameter name, description, or unit..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium border border-transparent hover:border-gray-200"
                >
                  Clear
                </button>
              </div>

              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                {/* Test Code Filter */}
                <select
                  value={selectedTestCode}
                  onChange={(e) => setSelectedTestCode(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <option value="all">All Test Codes</option>
                  {getUniqueTestCodes().map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>

                {/* Gender Filter */}
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="null">Not Specified</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50/50 px-6 py-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-red-800 flex-1 font-medium">{error}</p>
            </div>
          )}

          {/* Content Section */}
          <div className="overflow-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <InlineLoader 
                  text="Loading flagging configurations" 
                  size="large" 
                  theme="purple" 
                  centered={true}
                />
              </div>
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base font-medium">No flagging configurations found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByTestCode).map(([testCode, configs]) => (
                  <div 
                    key={testCode}
                    className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200/60 shadow-sm overflow-hidden animate-fade-in"
                  >
                    {/* Test Code Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-200/50 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">{testCode}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{configs[0]?.parameterName || testCode}</h3>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {configs.length} configuration{configs.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        {configs[0]?.description && (
                          <p className="text-sm text-gray-600 max-w-md text-right">
                            {configs[0].description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Configurations List */}
                    <div className="divide-y divide-gray-100">
                      {configs.map((config, index) => (
                        <div 
                          key={index}
                          className="px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-transparent transition-all duration-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            {/* Gender */}
                            <div className="lg:col-span-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Gender</div>
                              {config.gender ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border w-fit ${getGenderBadgeColor(config.gender)}`}>
                                  <Users className="w-3 h-3" />
                                  {config.gender}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200 w-fit">
                                  <Users className="w-3 h-3" />
                                  Other
                                </span>
                              )}
                            </div>

                            {/* Status */}
                            <div className="lg:col-span-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Status</div>
                              {config.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 w-fit">
                                  <CheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 w-fit">
                                  <X className="w-3 h-3" />
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Unit */}
                            <div className="lg:col-span-1">
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Unit</div>
                              <div className="text-sm font-semibold text-gray-900">{config.unit || 'N/A'}</div>
                            </div>

                            {/* Range */}
                            <div className="lg:col-span-3">
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Reference Range</div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                  <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-sm font-bold text-blue-700">{config.min ?? 'N/A'}</span>
                                </div>
                                <span className="text-gray-400 font-medium">-</span>
                                <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-sm font-bold text-green-700">{config.max ?? 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Effective Date */}
                            <div className="lg:col-span-3">
                              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Effective Date</div>
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{formatDate(config.effectiveDate)}</span>
                              </div>
                            </div>

                            {/* Description (if different from header) */}
                            {config.description && config.description !== configs[0]?.description && (
                              <div className="lg:col-span-3">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Description</div>
                                <p className="text-sm text-gray-700 line-clamp-2">{config.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/** Sync Modal */}
      <SyncFlaggingConfigModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccess={handleSync}
        existingConfigs={flaggingConfigs}
      />
    </DashboardLayout>
  );
}

