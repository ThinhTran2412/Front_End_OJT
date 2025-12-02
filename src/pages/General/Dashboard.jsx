import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import api from '../../services/api';
import { getAllPatients } from '../../services/PatientService';
import { getAllMedicalRecords } from '../../services/MedicalRecordService';
import AlphaVantageService from '../../services/AlphaVantageService';

// API functions
const getRoles = async () => {
  try {
    const response = await api.get('/Roles', {
      baseURL: 'http://localhost:5001/api'
    });
    return response.data?.items || [];
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

const getUsers = async () => {
  try {
    const response = await api.get('/User/getListOfUser', {
      baseURL: 'http://localhost:5001/api'
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const getTestOrders = async () => {
  try {
    const response = await api.get('/TestOrder/getList', {
      baseURL: 'http://localhost:5002/api'
    });
    return response.data?.items || [];
  } catch (error) {
    console.error('Error fetching test orders:', error);
    return [];
  }
};

// Format currency
const formatCurrency = (value, currency = 'VND') => {
  if (!value || isNaN(value)) return '0';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  
  if (numValue >= 1000000000000) {
    return `${(numValue / 1000000000000).toFixed(2)}T ${currency}`;
  } else if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(2)}B ${currency}`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(2)}M ${currency}`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(2)}K ${currency}`;
  }
  return `${numValue.toLocaleString()} ${currency}`;
};

// Simple KPI Card with clean design
const PremiumKPICard = ({ title, value, change, icon: Icon, iconColor = 'blue', delay = 0, isCurrency = false }) => {
  const isPositive = change >= 0;
  
  // Simple icon colors - subtle backgrounds
  const iconColors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    pink: { bg: 'bg-pink-50', icon: 'text-pink-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600' }
  };

  const colors = iconColors[iconColor] || iconColors.blue;

  // Format display value
  const displayValue = typeof value === 'string' 
    ? value 
    : isCurrency 
      ? formatCurrency(value) 
      : value.toLocaleString();

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
        aspectRatio: '9/6'
      }}
    >
      <div className="relative h-full p-5 flex flex-col">
        {/* Header: Icon and Change indicator */}
        <div className="flex items-start justify-between mb-4">
          {/* Simple icon */}
          <div className={`p-2.5 rounded-lg ${colors.bg}`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
          
          {/* Change indicator */}
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${
              isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="flex-1 flex items-center">
          <div className="text-3xl font-bold text-gray-900">
            {displayValue}
          </div>
        </div>

        {/* Footer: Title and change text */}
        <div className="mt-auto">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {change !== undefined && (
            <p className="text-xs text-gray-400">
              {isPositive ? '+' : ''}{change.toFixed(2)}% vs last month
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Premium Chart Card with glassmorphism
const PremiumChartCard = ({ title, subtitle, children, tabs, activeTab, onTabChange, className = "" }) => {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col h-full ${className}`}>
      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl" />
      
      <div className="relative p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 font-medium">{subtitle}</p>}
          </div>
        </div>
        
        {/* Tabs */}
        {tabs ? (
          <div className="flex gap-2 mb-4 p-1 bg-gray-100/50 rounded-xl backdrop-blur-sm">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-md scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-4 h-[45px]"></div>
        )}
        
        {/* Chart content - flex-1 để chiếm hết không gian còn lại */}
        <div className="relative flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-2xl p-4">
        <p className="text-sm font-bold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-semibold text-gray-700">{entry.name}:</span>
            <span className="text-sm font-bold text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Generate chart data
const generateRealChartData = (testOrders) => {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayOrders = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    });
    
    const completed = dayOrders.filter(order => 
      order.status === 'Completed' || order.status === 'Reviewed By AI'
    ).length;
    const pending = dayOrders.filter(order => 
      order.status === 'Created' || order.status === 'Pending' || order.status === 'In Progress'
    ).length;
    
    last7Days.push({
      date: dateStr,
      'Completed': completed,
      'Pending': pending,
      'Total': dayOrders.length
    });
  }
  
  return last7Days;
};

const generateRealLineChartData = (testOrders, medicalRecords) => {
  const last30Days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayOrders = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    }).length;
    
    const dayRecords = medicalRecords.filter(record => {
      if (!record.createdAt) return false;
      const recordDate = new Date(record.createdAt);
      return recordDate >= dayStart && recordDate <= dayEnd;
    }).length;
    
    const dayResults = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      const isInDay = orderDate >= dayStart && orderDate <= dayEnd;
      const isCompleted = order.status === 'Completed' || order.status === 'Reviewed By AI';
      return isInDay && isCompleted;
    }).length;
    
    last30Days.push({
      date: dateStr,
      'Patients': dayRecords,
      'Tests': dayOrders,
      'Results': dayResults
    });
  }
  
  return last30Days;
};

const generateMockTestTypeData = () => {
  return [
    { name: 'Complete Blood Count', value: 145, color: '#3b82f6' },
    { name: 'Lipid Panel', value: 98, color: '#a855f7' },
    { name: 'Liver Function', value: 87, color: '#22c55e' },
    { name: 'Thyroid Test', value: 76, color: '#eab308' },
    { name: 'Urine Analysis', value: 65, color: '#6366f1' },
    { name: 'Other Tests', value: 42, color: '#ec4899' }
  ];
};

const generateMockWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    'Blood Tests': 12 + Math.floor(Math.random() * 8),
    'Urine Tests': 8 + Math.floor(Math.random() * 6),
    'X-Ray': 5 + Math.floor(Math.random() * 4),
    'Other': 3 + Math.floor(Math.random() * 3)
  }));
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTestOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalMedicalRecords: 0,
    totalRoles: 0,
    totalUsers: 0,
    todayOrders: 0,
    weeklyGrowth: 0
  });
  const [financialData, setFinancialData] = useState(null);
  const [recentTestOrders, setRecentTestOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [testTypeData, setTestTypeData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('Monthly');
  const [activeView, setActiveView] = useState('Overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [patientsData, testOrders, medicalRecords, roles, users, financial] = await Promise.all([
        getAllPatients().catch(err => {
          console.warn('Error fetching patients:', err);
          return { patients: [], totalCount: 0 };
        }),
        getTestOrders().catch(err => {
          console.warn('Error fetching test orders:', err);
          return [];
        }),
        getAllMedicalRecords().catch(err => {
          console.warn('Error fetching medical records:', err);
          return [];
        }),
        getRoles().catch(err => {
          console.warn('Error fetching roles:', err);
          return [];
        }),
        getUsers().catch(err => {
          console.warn('Error fetching users:', err);
          return [];
        }),
        AlphaVantageService.getFinancialDashboardData('IBM').catch(err => {
          console.warn('Error fetching financial data:', err);
          return null;
        })
      ]);

      const totalPatients = patientsData.totalCount || patientsData.patients?.length || 0;
      const totalMedicalRecords = Array.isArray(medicalRecords) ? medicalRecords.length : 0;
      const totalRoles = roles.length;
      const totalUsers = users.length;
      const totalTestOrders = testOrders.length;
      
      const pendingOrders = testOrders.filter(order => 
        order.status === 'Pending' || order.status === 'Created' || order.status === 'In Progress'
      ).length;
      const completedOrders = testOrders.filter(order => 
        order.status === 'Completed' || order.status === 'Reviewed By AI'
      ).length;

      const today = new Date().toISOString().split('T')[0];
      const todayOrders = testOrders.filter(order => {
        const orderDate = order.createdAt;
        if (!orderDate) return false;
        const date = new Date(orderDate).toISOString().split('T')[0];
        return date === today;
      }).length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekOrders = testOrders.filter(order => {
        const orderDate = order.createdAt;
        if (!orderDate) return false;
        return new Date(orderDate) >= oneWeekAgo;
      }).length;
      const weeklyGrowth = totalTestOrders > 0 ? ((thisWeekOrders / totalTestOrders) * 100) : 0;

      const recent = testOrders
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 10)
        .map(order => ({
          id: order.testOrderId,
          patientName: order.patientName || 'N/A',
          testType: order.testType || 'CBC',
          status: order.status || 'Created',
          createdDate: order.createdAt || 'N/A',
          priority: order.priority || 'Normal'
        }));

      const chartData = generateRealChartData(testOrders);
      const testTypeData = generateMockTestTypeData();
      const weeklyData = generateMockWeeklyData();
      const lineChartData = generateRealLineChartData(testOrders, medicalRecords);

      setStats({
        totalPatients,
        totalTestOrders,
        pendingOrders,
        completedOrders,
        totalMedicalRecords,
        totalRoles,
        totalUsers,
        todayOrders,
        weeklyGrowth: parseFloat(weeklyGrowth.toFixed(1))
      });
      setFinancialData(financial);
      setRecentTestOrders(recent);
      setChartData(chartData);
      setWeeklyData(weeklyData);
      setTestTypeData(testTypeData);
      setLineChartData(lineChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const financialMetrics = financialData ? {
    revenue: financialData.metrics.latestRevenue,
    revenueChange: financialData.metrics.revenueGrowth,
    netIncome: financialData.metrics.latestNetIncome,
    profitChange: financialData.metrics.profitMargin,
    grossProfit: financialData.metrics.latestGrossProfit,
    grossProfitChange: financialData.annualData?.[0] && financialData.annualData?.[1]
      ? ((financialData.annualData[0].grossProfitVND - financialData.annualData[1].grossProfitVND) / financialData.annualData[1].grossProfitVND * 100)
      : 0
  } : null;

  const getFinancialChartData = () => {
    if (!financialData) return [];
    if (timeFrame === 'Monthly') {
      return financialData.quarterlyData?.slice(0, 12).map((item, index) => ({
        month: `M${index + 1}`,
        label: item.quarter.substring(5, 10),
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000
      })) || [];
    } else if (timeFrame === 'Quarterly') {
      return financialData.quarterlyData?.slice(0, 8).map(item => ({
        quarter: item.quarter.substring(5, 10),
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000
      })) || [];
    } else {
      return financialData.annualData?.map(item => ({
        year: item.year,
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000
      })) || [];
    }
  };

  const financialChartData = getFinancialChartData();
  const financialXAxisKey = timeFrame === 'Monthly' ? 'label' : timeFrame === 'Quarterly' ? 'quarter' : 'year';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-60 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          {/* Header with animated title */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600 font-medium">Comprehensive overview of laboratory operations</p>
              </div>
              
              {/* View switcher */}
              <div className="flex gap-2 bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-lg border border-white/20">
                <button
                  onClick={() => setActiveView('Overview')}
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeView === 'Overview'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('Details')}
                  className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeView === 'Details'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  Details
                </button>
              </div>
            </div>
          </div>

          {/* Content based on active view */}
          {activeView === 'Overview' ? (
            <>
              {/* Overview: Lab Metrics KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <PremiumKPICard
                  title="Total Patients"
                  value={stats.totalPatients}
                  change={5.2}
                  icon={Users}
                  iconColor="blue"
                  delay={0.1}
                />
                <PremiumKPICard
                  title="Test Orders"
                  value={stats.totalTestOrders}
                  change={12.5}
                  icon={ClipboardList}
                  iconColor="purple"
                  delay={0.2}
                />
                <PremiumKPICard
                  title="Completed"
                  value={stats.completedOrders}
                  change={8.7}
                  icon={CheckCircle2}
                  iconColor="green"
                  delay={0.3}
                />
                <PremiumKPICard
                  title="Pending"
                  value={stats.pendingOrders}
                  change={-3.1}
                  icon={Clock}
                  iconColor="orange"
                  delay={0.4}
                />
              </div>

              {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Test Orders Trend */}
              <PremiumChartCard
                title="Test Orders Trend"
                subtitle="Last 7 days performance overview"
                >
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Completed" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCompleted)"
                        name="Completed"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Pending" 
                        stroke="#eab308" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPending)"
                        name="Pending"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PremiumChartCard>

              {/* Financial Revenue Chart */}
              {financialData && (
                <PremiumChartCard
                  title="Revenue Statistics"
                  subtitle={`Total revenue ${formatCurrency(financialMetrics.revenue)}`}
                  tabs={['Monthly', 'Quarterly', 'Annually']}
                  activeTab={timeFrame}
                  onTabChange={setTimeFrame}
                >
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financialChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey={financialXAxisKey} 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          tickFormatter={(value) => `${value}M`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)"
                          name="Revenue"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="#22c55e" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProfit)"
                          name="Net Income"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </PremiumChartCard>
              )}
            </div>
            </>
          ) : (
            <>
              {/* Details: Financial Metrics KPI Cards */}
              {financialMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <PremiumKPICard
                    title="Total Revenue"
                    value={financialMetrics.revenue}
                    change={financialMetrics.revenueChange}
                    icon={DollarSign}
                    iconColor="indigo"
                    delay={0.1}
                  />
                  <PremiumKPICard
                    title="Net Income"
                    value={financialMetrics.netIncome}
                    change={financialMetrics.profitChange}
                    icon={TrendingUp}
                    iconColor="green"
                    delay={0.2}
                  />
                  <PremiumKPICard
                    title="Gross Profit"
                    value={financialMetrics.grossProfit}
                    change={financialMetrics.grossProfitChange}
                    icon={BarChart3}
                    iconColor="purple"
                    delay={0.3}
                  />
                  <PremiumKPICard
                    title="Today's Orders"
                    value={stats.todayOrders}
                    change={15.3}
                    icon={Activity}
                    iconColor="pink"
                    delay={0.4}
                  />
                </div>
              )}

              {/* Details View - Full Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                {/* Activity Trend */}
                <PremiumChartCard
                  title="Activity Trend"
                  subtitle="30 days comprehensive analysis"
                  tabs={['Monthly', 'Quarterly', 'Annually']}
                  activeTab={timeFrame}
                  onTabChange={setTimeFrame}
                >
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Patients" 
                          stroke="#3b82f6" 
                          strokeWidth={4}
                          dot={{ r: 5, fill: '#3b82f6' }}
                          activeDot={{ r: 8 }}
                          name="Patients"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Tests" 
                          stroke="#22c55e" 
                          strokeWidth={4}
                          dot={{ r: 5, fill: '#22c55e' }}
                          activeDot={{ r: 8 }}
                          name="Tests"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Results" 
                          stroke="#eab308" 
                          strokeWidth={4}
                          dot={{ r: 5, fill: '#eab308' }}
                          activeDot={{ r: 8 }}
                          name="Results"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </PremiumChartCard>

                {/* Weekly Distribution */}
                <PremiumChartCard
                  title="Weekly Test Distribution"
                  subtitle="Tests by category this week"
                >
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey="day" 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem', fontWeight: 600 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="square"
                        />
                        <Bar dataKey="Blood Tests" fill="#3b82f6" radius={[12, 12, 0, 0]} />
                        <Bar dataKey="Urine Tests" fill="#a855f7" radius={[12, 12, 0, 0]} />
                        <Bar dataKey="X-Ray" fill="#22c55e" radius={[12, 12, 0, 0]} />
                        <Bar dataKey="Other" fill="#eab308" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </PremiumChartCard>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                {/* Financial Performance */}
                {financialData && (
                  <PremiumChartCard
                    title="Financial Performance"
                    subtitle="Revenue and profit comparison"
                    tabs={['Monthly', 'Quarterly', 'Annually']}
                    activeTab={timeFrame}
                    onTabChange={setTimeFrame}
                  >
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={financialChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis 
                            dataKey={financialXAxisKey} 
                            stroke="#6b7280"
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          />
                          <YAxis 
                            stroke="#6b7280"
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                            tickFormatter={(value) => `${value}M`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3b82f6" 
                            strokeWidth={4}
                            dot={{ r: 5, fill: '#3b82f6' }}
                            activeDot={{ r: 8 }}
                            name="Revenue"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#22c55e" 
                            strokeWidth={4}
                            dot={{ r: 5, fill: '#22c55e' }}
                            activeDot={{ r: 8 }}
                            name="Net Income"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </PremiumChartCard>
                )}

                {/* Test Types Distribution */}
                <PremiumChartCard
                  title="Test Types Distribution"
                  subtitle="Most requested test types"
                >
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {testTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {testTypeData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <p className="text-sm text-gray-600 flex-1 truncate font-medium">{item.name}</p>
                        <p className="text-sm font-bold text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </PremiumChartCard>
              </div>

              {/* Recent Orders Table */}
              <PremiumChartCard
                title="Recent Test Orders"
                subtitle="Latest 10 test orders"
                className="mb-6"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Patient</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Test Type</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentTestOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500">No test orders found</p>
                          </td>
                        </tr>
                      ) : (
                        recentTestOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <p className="font-semibold text-gray-900">{order.patientName}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-700">{order.testType}</td>
                            <td className="px-4 py-4">
                              <span 
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                  order.priority === 'Urgent' 
                                    ? 'bg-red-100 text-red-700 border-2 border-red-200' :
                                  order.priority === 'High' 
                                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' 
                                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                                }`}
                              >
                                {order.priority}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span 
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                  order.status === 'Completed' || order.status === 'Reviewed By AI'
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' :
                                  order.status === 'Pending' || order.status === 'Created'
                                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' :
                                  order.status === 'In Progress' || order.status === 'Processing'
                                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' :
                                  order.status === 'Cancelled'
                                    ? 'bg-red-100 text-red-700 border-2 border-red-200'
                                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200'
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-600">{formatDate(order.createdDate)}</td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => navigate('/test-orders')}
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors"
                              >
                                View →
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </PremiumChartCard>
            </>
          )}
        </div>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
