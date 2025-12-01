import api from './api';

// ============================================
// MOCK DATA - Dữ liệu giả về tài chính
// ============================================

// Mock data cho Revenue (Doanh thu)
const mockRevenues = [
  {
    revenueId: 1,
    date: '2024-01-15',
    testOrderId: 101,
    patientName: 'Nguyễn Văn A',
    testType: 'CBC',
    amount: 500000,
    paymentMethod: 'Cash',
    status: 'Paid',
    createdBy: 'Lab Manager',
    createdAt: '2024-01-15T10:30:00'
  },
  {
    revenueId: 2,
    date: '2024-01-16',
    testOrderId: 102,
    patientName: 'Trần Thị B',
    testType: 'Lipid Panel',
    amount: 750000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    createdBy: 'Lab Manager',
    createdAt: '2024-01-16T14:20:00'
  },
  {
    revenueId: 3,
    date: '2024-01-17',
    testOrderId: 103,
    patientName: 'Lê Văn C',
    testType: 'Comprehensive Metabolic Panel',
    amount: 1200000,
    paymentMethod: 'Credit Card',
    status: 'Paid',
    createdBy: 'Lab Manager',
    createdAt: '2024-01-17T09:15:00'
  },
  {
    revenueId: 4,
    date: '2024-01-18',
    testOrderId: 104,
    patientName: 'Phạm Thị D',
    testType: 'Thyroid Function Test',
    amount: 900000,
    paymentMethod: 'Cash',
    status: 'Pending',
    createdBy: 'Lab Manager',
    createdAt: '2024-01-18T11:45:00'
  },
  {
    revenueId: 5,
    date: '2024-01-19',
    testOrderId: 105,
    patientName: 'Hoàng Văn E',
    testType: 'Liver Function Test',
    amount: 850000,
    paymentMethod: 'Bank Transfer',
    status: 'Paid',
    createdBy: 'Lab Manager',
    createdAt: '2024-01-19T16:30:00'
  }
];

// Mock data cho Expenses (Chi phí)
const mockExpenses = [
  {
    expenseId: 1,
    date: '2024-01-10',
    category: 'Reagents',
    description: 'Blood test reagents purchase',
    amount: 5000000,
    supplier: 'Medical Supplies Co.',
    status: 'Paid',
    createdBy: 'Admin',
    createdAt: '2024-01-10T08:00:00'
  },
  {
    expenseId: 2,
    date: '2024-01-12',
    category: 'Equipment',
    description: 'Laboratory equipment maintenance',
    amount: 3000000,
    supplier: 'Tech Maintenance Ltd.',
    status: 'Paid',
    createdBy: 'Admin',
    createdAt: '2024-01-12T10:30:00'
  },
  {
    expenseId: 3,
    date: '2024-01-14',
    category: 'Utilities',
    description: 'Electricity bill - January',
    amount: 2500000,
    supplier: 'Electric Company',
    status: 'Paid',
    createdBy: 'Admin',
    createdAt: '2024-01-14T14:20:00'
  },
  {
    expenseId: 4,
    date: '2024-01-15',
    category: 'Reagents',
    description: 'Additional reagents for high volume',
    amount: 2000000,
    supplier: 'Medical Supplies Co.',
    status: 'Pending',
    createdBy: 'Admin',
    createdAt: '2024-01-15T09:15:00'
  },
  {
    expenseId: 5,
    date: '2024-01-18',
    category: 'Staff',
    description: 'Overtime payment - January',
    amount: 4000000,
    supplier: 'Internal',
    status: 'Paid',
    createdBy: 'Admin',
    createdAt: '2024-01-18T11:00:00'
  }
];

// Mock data cho Financial Summary (Tổng quan tài chính)
const mockFinancialSummary = {
  currentMonth: {
    revenue: 4200000,
    expenses: 16500000,
    profit: -12300000,
    revenueCount: 4,
    expenseCount: 5
  },
  lastMonth: {
    revenue: 15000000,
    expenses: 12000000,
    profit: 3000000,
    revenueCount: 30,
    expenseCount: 12
  },
  thisYear: {
    revenue: 180000000,
    expenses: 145000000,
    profit: 35000000,
    revenueCount: 450,
    expenseCount: 120
  },
  topRevenueSources: [
    { testType: 'Comprehensive Metabolic Panel', amount: 4800000, count: 4 },
    { testType: 'Lipid Panel', amount: 3750000, count: 5 },
    { testType: 'Thyroid Function Test', amount: 3600000, count: 4 },
    { testType: 'CBC', amount: 2500000, count: 5 },
    { testType: 'Liver Function Test', amount: 2550000, count: 3 }
  ],
  topExpenseCategories: [
    { category: 'Reagents', amount: 7000000, count: 2 },
    { category: 'Staff', amount: 4000000, count: 1 },
    { category: 'Equipment', amount: 3000000, count: 1 },
    { category: 'Utilities', amount: 2500000, count: 1 }
  ]
};

// Mock data cho Transactions (Giao dịch)
const mockTransactions = [
  ...mockRevenues.map(r => ({
    transactionId: `REV-${r.revenueId}`,
    type: 'Revenue',
    date: r.date,
    description: `Payment for ${r.testType} - ${r.patientName}`,
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    status: r.status,
    referenceId: r.testOrderId
  })),
  ...mockExpenses.map(e => ({
    transactionId: `EXP-${e.expenseId}`,
    type: 'Expense',
    date: e.date,
    description: `${e.category}: ${e.description}`,
    amount: -e.amount,
    paymentMethod: 'Bank Transfer',
    status: e.status,
    referenceId: e.expenseId
  }))
].sort((a, b) => new Date(b.date) - new Date(a.date));

// ============================================
// API FUNCTIONS - Có thể chuyển sang real API sau
// ============================================

// Lấy danh sách doanh thu
export const getRevenues = async (params = {}) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.get('/Financial/revenues', { params });
    // return response.data;
    
    // Mock implementation
    const { pageNumber = 1, pageSize = 10, startDate, endDate, status } = params;
    
    let filtered = [...mockRevenues];
    
    if (startDate) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(endDate));
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      revenues: paginated,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1
    };
  } catch (error) {
    console.error('Error fetching revenues:', error);
    throw error;
  }
};

// Lấy danh sách chi phí
export const getExpenses = async (params = {}) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.get('/Financial/expenses', { params });
    // return response.data;
    
    // Mock implementation
    const { pageNumber = 1, pageSize = 10, startDate, endDate, category, status } = params;
    
    let filtered = [...mockExpenses];
    
    if (startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(endDate));
    }
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    if (status) {
      filtered = filtered.filter(e => e.status === status);
    }
    
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      expenses: paginated,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1
    };
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Lấy tổng quan tài chính
export const getFinancialSummary = async (period = 'currentMonth') => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.get(`/Financial/summary?period=${period}`);
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      ...mockFinancialSummary,
      period
    };
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    throw error;
  }
};

// Lấy danh sách giao dịch
export const getTransactions = async (params = {}) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.get('/Financial/transactions', { params });
    // return response.data;
    
    // Mock implementation
    const { pageNumber = 1, pageSize = 10, startDate, endDate, type, status } = params;
    
    let filtered = [...mockTransactions];
    
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
    }
    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }
    
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      transactions: paginated,
      totalCount,
      pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1
    };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Tạo doanh thu mới (khi thanh toán test order)
export const createRevenue = async (revenueData) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.post('/Financial/revenues', revenueData);
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRevenue = {
      revenueId: mockRevenues.length + 1,
      ...revenueData,
      status: 'Paid',
      createdAt: new Date().toISOString(),
      createdBy: 'System'
    };
    
    mockRevenues.push(newRevenue);
    
    return newRevenue;
  } catch (error) {
    console.error('Error creating revenue:', error);
    throw error;
  }
};

// Tạo chi phí mới
export const createExpense = async (expenseData) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.post('/Financial/expenses', expenseData);
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newExpense = {
      expenseId: mockExpenses.length + 1,
      ...expenseData,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      createdBy: 'System'
    };
    
    mockExpenses.push(newExpense);
    
    return newExpense;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// Cập nhật trạng thái thanh toán
export const updatePaymentStatus = async (transactionId, status) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.patch(`/Financial/transactions/${transactionId}/status`, { status });
    // return response.data;
    
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Update in mock data
    const transaction = mockTransactions.find(t => t.transactionId === transactionId);
    if (transaction) {
      transaction.status = status;
    }
    
    return { success: true, transactionId, status };
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Xuất báo cáo tài chính
export const exportFinancialReport = async (params = {}) => {
  try {
    // TODO: Thay thế bằng API thật khi backend sẵn sàng
    // const response = await api.get('/Financial/export', { 
    //   params,
    //   responseType: 'blob'
    // });
    // return response.data;
    
    // Mock implementation - return a sample report structure
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Financial report exported successfully',
      fileName: `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error('Error exporting financial report:', error);
    throw error;
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

const FinancialService = {
  getRevenues,
  getExpenses,
  getFinancialSummary,
  getTransactions,
  createRevenue,
  createExpense,
  updatePaymentStatus,
  exportFinancialReport
};

export default FinancialService;

