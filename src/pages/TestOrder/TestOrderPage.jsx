import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../../services/api';
import TestOrderDetailModal from '../../components/TestOrder_Management/TestOrderDetailModal';
import { useToast, ToastContainer } from '../../components/Toast';
import DashboardLayout from '../../layouts/DashboardLayout';

export default function TestOrderPage() {
  const navigate = useNavigate();
  const [testOrders, setTestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    fetchTestOrders();
  }, [currentPage, pageSize, searchTerm]);

  const fetchTestOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await api.get(`/TestOrder/getList?${params.toString()}`);
      
      if (response.data) {
        const data = response.data;
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setTestOrders(data);
          setTotalCount(data.length);
        } else if (data.items && Array.isArray(data.items)) {
          setTestOrders(data.items);
          setTotalCount(data.totalCount || data.total || data.items.length);
        } else {
          setTestOrders([]);
          setTotalCount(0);
        }
      } else {
        setTestOrders([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error fetching test orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load test orders');
      showToast('Failed to load test orders', 'error');
      setTestOrders([]);
    } finally {
    setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/test-orders/create');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchTestOrders();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getStatusColor = (status) => {
    if (status === 'Reviewed By AI') {
      return 'bg-purple-100 text-purple-800';
    }
    if (status === 'Completed') {
      return 'bg-green-100 text-green-800';
    }
    if (status === 'In Progress' || status === 'Processing') {
      return 'bg-blue-100 text-blue-800';
    }
    if (status === 'Pending' || status === 'Created') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (status === 'Cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Test Orders</h1>
        <p className="mt-2 text-sm text-gray-700">Manage laboratory test orders and view their status</p>
      </div>

      {/* Search and Create */}
      <div className="flex justify-between items-center mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search test orders..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Search
          </button>
        </form>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Order
        </button>
      </div>

      {/* Test Orders Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No test orders found
                  </td>
                </tr>
              ) : (
                testOrders.map((order) => {
                  const orderStatus = order.status || 'Created';
                  
                  return (
                    <tr key={order.testOrderId || order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.orderCode || order.testOrderId?.substring(0, 8) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.patientName || order.medicalRecord?.patient?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.testType || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(orderStatus)}`}>
                          {orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.createdAt 
                          ? new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.testOrderId);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details & Test Results"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && testOrders.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage * pageSize >= totalCount}
              className="p-2 border rounded-lg disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Test Order Detail Modal */}
      <TestOrderDetailModal
        testOrderId={selectedOrderId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrderId(null);
        }}
        onUpdate={() => {
          fetchTestOrders();
        }}
      />
      </div>
    </DashboardLayout>
  );
}