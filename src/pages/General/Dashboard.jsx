import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { LoadingOverlay, InlineLoader } from '../../components/Loading';
import { 
  Card, 
  Title, 
  Text, 
  Metric, 
  Flex, 
  ProgressBar,
  Badge,
  Grid,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell
} from '@tremor/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Heart,
  Stethoscope,
  TestTube,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import api from '../../services/api';
import { getAllPatients } from '../../services/PatientService';
import { getAllMedicalRecords } from '../../services/MedicalRecordService';

// API functions for dashboard data
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

// Generate mock data for charts
const generateMockChartData = () => {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Generate realistic data with some variation
    const baseValue = 15 + Math.floor(Math.random() * 20);
    const completed = Math.floor(baseValue * 0.6 + Math.random() * 5);
    const pending = Math.floor(baseValue * 0.3 + Math.random() * 3);
    
    last7Days.push({
      date: dateStr,
      'Completed': completed,
      'Pending': pending,
      'Total': baseValue
    });
  }
  
  return last7Days;
};

const generateMockLineChartData = () => {
  const last30Days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    last30Days.push({
      date: dateStr,
      'Patients': 20 + Math.floor(Math.random() * 15),
      'Tests': 15 + Math.floor(Math.random() * 20),
      'Results': 12 + Math.floor(Math.random() * 18)
    });
  }
  
  return last30Days;
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

const generateMockTestTypeData = () => {
  return [
    { name: 'Complete Blood Count', value: 145, color: 'blue' },
    { name: 'Lipid Panel', value: 98, color: 'purple' },
    { name: 'Liver Function', value: 87, color: 'emerald' },
    { name: 'Thyroid Test', value: 76, color: 'yellow' },
    { name: 'Urine Analysis', value: 65, color: 'indigo' },
    { name: 'Other Tests', value: 42, color: 'pink' }
  ];
};

// Generate real chart data from actual test orders
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
    
    // Filter orders for this day
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

const generateRealTestTypeData = (testOrders) => {
  const testTypeCounts = {};
  
  testOrders.forEach(order => {
    const testType = order.testType || 'CBC';
    // Normalize test type names
    const normalizedType = testType.includes('CBC') ? 'CBC' : 
                          testType.includes('Lipid') ? 'Lipid Panel' :
                          testType.includes('Metabolic') ? 'Metabolic Panel' :
                          testType.includes('Thyroid') ? 'Thyroid Test' :
                          'Other';
    
    testTypeCounts[normalizedType] = (testTypeCounts[normalizedType] || 0) + 1;
  });
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  return Object.entries(testTypeCounts).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length]
  }));
};

const generateRealWeeklyData = (testOrders) => {
  const last4Weeks = [];
  const today = new Date();
  
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekLabel = `Week ${4 - i}`;
    
    const weekOrders = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= weekStart && orderDate <= weekEnd;
    });
    
    last4Weeks.push({
      week: weekLabel,
      'Test Orders': weekOrders.length,
      'Completed': weekOrders.filter(order => 
        order.status === 'Completed' || order.status === 'Reviewed By AI'
      ).length
    });
  }
  
  return last4Weeks;
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
    
    // Count orders for this day
    const dayOrders = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= dayStart && orderDate <= dayEnd;
    }).length;
    
    // Count medical records for this day
    const dayRecords = medicalRecords.filter(record => {
      if (!record.createdAt) return false;
      const recordDate = new Date(record.createdAt);
      return recordDate >= dayStart && recordDate <= dayEnd;
    }).length;
    
    // Count completed tests (results)
    const dayResults = testOrders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      const isInDay = orderDate >= dayStart && orderDate <= dayEnd;
      const isCompleted = order.status === 'Completed' || order.status === 'Reviewed By AI';
      return isInDay && isCompleted;
    }).length;
    
    last30Days.push({
      date: dateStr,
      'Patients': dayRecords, // New medical records = new patients
      'Tests': dayOrders,
      'Results': dayResults
    });
  }
  
  return last30Days;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
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
  const [recentTestOrders, setRecentTestOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [testTypeData, setTestTypeData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [patientsData, testOrders, medicalRecords, roles, users] = await Promise.all([
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
        })
      ]);

      // Extract totals
      const totalPatients = patientsData.totalCount || patientsData.patients?.length || 0;
      const totalMedicalRecords = Array.isArray(medicalRecords) ? medicalRecords.length : 0;
      const totalRoles = roles.length;
      const totalUsers = users.length;

      console.log('Dashboard Data:', {
        totalPatients,
        totalTestOrders: testOrders.length,
        totalMedicalRecords,
        totalRoles,
        totalUsers,
        testOrders: testOrders.slice(0, 3), // Log first 3 for debugging
      });

      const totalTestOrders = testOrders.length;
      
      // Calculate status-based statistics
      const pendingOrders = testOrders.filter(order => 
        order.status === 'Pending' || order.status === 'Created' || order.status === 'In Progress'
      ).length;
      const completedOrders = testOrders.filter(order => 
        order.status === 'Completed' || order.status === 'Reviewed By AI'
      ).length;

      // Get today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = testOrders.filter(order => {
        const orderDate = order.createdAt;
        if (!orderDate) return false;
        const date = new Date(orderDate).toISOString().split('T')[0];
        return date === today;
      }).length;

      // Calculate this week's orders for growth calculation
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekOrders = testOrders.filter(order => {
        const orderDate = order.createdAt;
        if (!orderDate) return false;
        return new Date(orderDate) >= oneWeekAgo;
      }).length;

      // Calculate weekly growth percentage
      const weeklyGrowth = totalTestOrders > 0 ? ((thisWeekOrders / totalTestOrders) * 100).toFixed(1) : 0;

      // Get recent test orders (last 10)
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
          testType: order.testType || 'CBC', // Default to CBC as per your mapping
          status: order.status || 'Created',
          createdDate: order.createdAt || 'N/A',
          priority: order.priority || 'Normal',
          age: order.age,
          gender: order.gender
        }));

      // Generate chart data - mix real and mock data
      const chartData = generateRealChartData(testOrders); // Real data for 7-day chart
      const testTypeData = generateMockTestTypeData(); // Mock data for better visualization
      const weeklyData = generateMockWeeklyData(); // Mock data for better visualization  
      const lineChartData = generateRealLineChartData(testOrders, medicalRecords); // Real data for trends

      setStats({
        totalPatients,
        totalTestOrders,
        pendingOrders,
        completedOrders,
        totalMedicalRecords,
        totalRoles,
        totalUsers,
        todayOrders,
        weeklyGrowth: parseFloat(weeklyGrowth)
      });
      setRecentTestOrders(recent);
      setChartData(chartData); // Last 7 days from real data
      setWeeklyData(weeklyData);
      setTestTypeData(testTypeData);
      setLineChartData(lineChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use mock data on error
      setUseMockData(true);
      const mockData = generateMockData();
      setStats(mockData.stats);
      setRecentTestOrders(mockData.recentOrders);
      setChartData(mockData.chartData);
      setWeeklyData(mockData.weeklyData);
      setTestTypeData(mockData.testTypeData);
      setLineChartData(mockData.lineChartData);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock test orders
  const generateMockTestOrders = () => {
    const statuses = ['Completed', 'Pending', 'In Progress', 'Reviewed By AI', 'Created'];
    const testTypes = ['Complete Blood Count', 'Lipid Panel', 'Liver Function Test', 'Thyroid Test', 'Urine Analysis', 'X-Ray'];
    const names = ['John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown', 'Emily Davis', 'Robert Miller', 'Lisa Wilson'];
    
    const orders = [];
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      orders.push({
        testOrderId: `order-${i}`,
        id: `order-${i}`,
        patientName: names[Math.floor(Math.random() * names.length)],
        fullName: names[Math.floor(Math.random() * names.length)],
        testType: testTypes[Math.floor(Math.random() * testTypes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdDate: date.toISOString(),
        createdAt: date.toISOString(),
        priority: ['Normal', 'High', 'Urgent'][Math.floor(Math.random() * 3)]
      });
    }
    return orders;
  };

  // Generate complete mock data
  const generateMockData = () => {
    return {
      stats: {
        totalPatients: 342,
        totalTestOrders: 513,
        pendingOrders: 87,
        completedOrders: 398,
        totalMedicalRecords: 410,
        todayOrders: 23,
        weeklyGrowth: 12.5
      },
      recentOrders: generateMockTestOrders().slice(0, 10),
      chartData: generateMockChartData(),
      weeklyData: generateMockWeeklyData(),
      testTypeData: generateMockTestTypeData(),
      lineChartData: generateMockLineChartData()
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Reviewed By AI':
        return 'emerald';
      case 'Pending':
      case 'Created':
        return 'yellow';
      case 'In Progress':
      case 'Processing':
        return 'blue';
      case 'Cancelled':
        return 'red';
      default:
        return 'gray';
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

  const metricCards = [
    {
      title: 'Total Patients',
      metric: stats.totalPatients,
      icon: Users,
      color: 'blue',
      description: 'Registered patients',
      trend: '+5.2%'
    },
    {
      title: 'Test Orders',
      metric: stats.totalTestOrders,
      icon: ClipboardList,
      color: 'purple',
      description: 'All test orders',
      trend: '+12.5%'
    },
    {
      title: 'Pending Orders',
      metric: stats.pendingOrders,
      icon: Clock,
      color: 'yellow',
      description: 'Awaiting processing',
      trend: '-3.1%'
      },
    {
      title: 'Completed',
      metric: stats.completedOrders,
      icon: CheckCircle2,
      color: 'emerald',
      description: 'Completed tests',
      trend: '+8.7%'
    },
    {
      title: 'Today\'s Orders',
      metric: stats.todayOrders,
      icon: Activity,
      color: 'indigo',
      description: 'Orders created today',
      trend: '+15.3%'
      },
    {
      title: 'Medical Records',
      metric: stats.totalMedicalRecords,
      icon: FileText,
      color: 'teal',
      description: 'Patient records',
      trend: '+6.1%'
    },
    {
      title: 'System Roles',
      metric: stats.totalRoles,
      icon: Users,
      color: 'orange',
      description: 'User roles',
      trend: '0%'
    },
    {
      title: 'Active Users',
      metric: stats.totalUsers,
      icon: Users,
      color: 'pink',
      description: 'System users',
      trend: '+4.2%'
    },
    {
      title: 'Completion Rate',
      metric: stats.totalTestOrders > 0 
        ? `${Math.round((stats.completedOrders / stats.totalTestOrders) * 100)}%`
        : '0%',
      icon: TrendingUp,
      color: 'green',
      description: 'Success rate',
      trend: `+${stats.weeklyGrowth}%`
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <InlineLoader 
            text="Loading dashboard" 
            size="large" 
            theme="blue" 
            centered={true}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 min-h-screen" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="mb-10">
          <Title className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight" style={{ fontFamily: 'Arial, sans-serif' }}>Medical Dashboard</Title>
          <Text className="text-lg text-gray-600 font-light" style={{ fontFamily: 'Arial, sans-serif' }}>
            Comprehensive overview of laboratory operations and patient statistics
          </Text>
        </div>

        {/* Metrics Grid */}
        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-10">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            const colorClasses = {
              blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500', accent: 'text-blue-600' },
              purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500', accent: 'text-purple-600' },
              yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500', accent: 'text-yellow-600' },
              emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500', accent: 'text-emerald-600' },
              indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500', accent: 'text-indigo-600' },
              green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500', accent: 'text-green-600' }
            };
            const colors = colorClasses[card.color] || colorClasses.blue;
            const isPositive = card.trend?.startsWith('+');
            return (
              <Card 
                key={index} 
                className={`
                  bg-white border-t-4 ${colors.border} 
                  shadow-xl hover:shadow-2xl 
                  transition-all duration-300 
                  border border-gray-200
                  hover:-translate-y-1
                  rounded-lg
                `}
              >
                <Flex alignItems="start">
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{card.title}</Text>
                      {card.trend && (
                        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '↑' : '↓'} {card.trend}
                        </span>
                      )}
                    </div>
                    <Metric className="text-4xl font-extrabold mb-2 text-gray-900">{card.metric}</Metric>
                    <Text className="text-sm text-gray-400 font-light">{card.description}</Text>
                  </div>
                  <div className={`p-3.5 rounded-xl ${colors.bg} ml-4 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                </Flex>
              </Card>
            );
          })}
        </Grid>

        {/* Charts and Tables */}
        <TabGroup className="mb-6">
          <TabList className="bg-white rounded-lg p-1.5 shadow-lg border border-gray-200">
            <Tab className="px-6 py-2.5 text-sm font-semibold">Overview</Tab>
            <Tab className="px-6 py-2.5 text-sm font-semibold">Analytics</Tab>
            <Tab className="px-6 py-2.5 text-sm font-semibold">Recent Orders</Tab>
            <Tab className="px-6 py-2.5 text-sm font-semibold">Test Types</Tab>
          </TabList>
          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <Grid numItems={1} numItemsLg={2} className="gap-6">
                {/* Test Orders Trend Chart */}
                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <div className="mb-6">
                    <Title className="text-2xl font-bold text-gray-900 mb-1">Test Orders Trend</Title>
                    <Text className="text-gray-500 text-sm font-light">Last 7 days performance</Text>
                  </div>
                  <div className="mt-4 h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="square"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Completed" 
                          stackId="1"
                          stroke="#22c55e" 
                          fill="#22c55e" 
                          fillOpacity={0.6}
                          name="Completed"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Pending" 
                          stackId="1"
                          stroke="#eab308" 
                          fill="#eab308" 
                          fillOpacity={0.6}
                          name="Pending"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Status Distribution */}
                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <Title className="text-2xl font-bold text-gray-900 mb-1">Order Status Distribution</Title>
                  <Text className="text-gray-500 text-sm font-light mb-6">Current order status breakdown</Text>
                  <div className="mt-6 space-y-5">
                    <div>
                      <Flex className="mb-2 items-center justify-between">
                        <Flex className="items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <Text className="font-medium">Completed</Text>
                        </Flex>
                        <Text className="font-bold text-lg">
                          {stats.completedOrders} 
                          <span className="text-sm text-gray-500 ml-1">
                            ({stats.totalTestOrders > 0 ? Math.round((stats.completedOrders / stats.totalTestOrders) * 100) : 0}%)
                          </span>
                        </Text>
                      </Flex>
                      <ProgressBar 
                        value={stats.totalTestOrders > 0 ? (stats.completedOrders / stats.totalTestOrders) * 100 : 0} 
                        color="emerald" 
                        className="mt-2 h-3"
                      />
                </div>
                <div>
                      <Flex className="mb-2 items-center justify-between">
                        <Flex className="items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <Text className="font-medium">Pending</Text>
                        </Flex>
                        <Text className="font-bold text-lg">
                          {stats.pendingOrders}
                          <span className="text-sm text-gray-500 ml-1">
                            ({stats.totalTestOrders > 0 ? Math.round((stats.pendingOrders / stats.totalTestOrders) * 100) : 0}%)
                          </span>
                        </Text>
                      </Flex>
                      <ProgressBar 
                        value={stats.totalTestOrders > 0 ? (stats.pendingOrders / stats.totalTestOrders) * 100 : 0} 
                        color="amber" 
                        className="mt-2 h-3"
                      />
                </div>
                    <div>
                      <Flex className="mb-2 items-center justify-between">
                        <Flex className="items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <Text className="font-medium">In Progress</Text>
                        </Flex>
                        <Text className="font-bold text-lg">
                          {stats.totalTestOrders - stats.completedOrders - stats.pendingOrders}
                        </Text>
                      </Flex>
                      <ProgressBar 
                        value={stats.totalTestOrders > 0 ? ((stats.totalTestOrders - stats.completedOrders - stats.pendingOrders) / stats.totalTestOrders) * 100 : 0} 
                        color="blue" 
                        className="mt-2 h-3"
                      />
              </div>
            </div>
                </Card>
              </Grid>
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel>
              <Grid numItems={1} numItemsLg={2} className="gap-6 mb-6">
                {/* Weekly Test Distribution */}
                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <Title className="text-2xl font-bold text-gray-900 mb-1">Weekly Test Distribution</Title>
                  <Text className="text-gray-500 text-sm font-light mb-6">Tests by category this week</Text>
                  <div className="mt-4 h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="day" 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '0.75rem' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="square"
                        />
                        <Bar dataKey="Blood Tests" fill="#3b82f6" name="Blood Tests" />
                        <Bar dataKey="Urine Tests" fill="#a855f7" name="Urine Tests" />
                        <Bar dataKey="X-Ray" fill="#22c55e" name="X-Ray" />
                        <Bar dataKey="Other" fill="#eab308" name="Other" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Test Types Distribution */}
                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <Title className="text-2xl font-bold text-gray-900 mb-1">Test Types Distribution</Title>
                  <Text className="text-gray-500 text-sm font-light mb-6">Most requested test types</Text>
                  <div className="mt-4 h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={testTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          innerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {testTypeData.map((entry, index) => {
                            const colors = ['#3b82f6', '#a855f7', '#22c55e', '#eab308', '#6366f1', '#ec4899'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.875rem'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {testTypeData.map((item, index) => {
                      const colorMap = {
                        blue: 'bg-blue-500',
                        purple: 'bg-purple-500',
                        emerald: 'bg-emerald-500',
                        yellow: 'bg-yellow-500',
                        indigo: 'bg-indigo-500',
                        pink: 'bg-pink-500'
                      };
                      return (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colorMap[item.color] || 'bg-gray-500'}`}></div>
                          <Text className="text-sm text-gray-600 flex-1 truncate">{item.name}</Text>
                          <Text className="text-sm font-semibold text-gray-900">{item.value}</Text>
                        </div>
                      );
                    })}
          </div>
                </Card>
              </Grid>
              
              {/* Line Chart - 30 Days Trend */}
              <Card className="bg-white shadow-xl border border-gray-200 rounded-lg mt-6">
                <Title className="text-2xl font-bold text-gray-900 mb-1">30 Days Activity Trend</Title>
                <Text className="text-gray-500 text-sm font-light mb-6">Patients, Tests, and Results over the last 30 days</Text>
                <div className="mt-4 h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280"
                        style={{ fontSize: '0.75rem' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '0.75rem' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Patients" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Tests" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Results" 
                        stroke="#eab308" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </TabPanel>

            {/* Recent Orders Tab */}
            <TabPanel>
              <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Title className="text-2xl font-bold text-gray-900 mb-1">Recent Test Orders</Title>
                    <Text className="text-gray-500 text-sm font-light">Latest 10 test orders</Text>
                  </div>
                  <button
                    onClick={() => navigate('/test-orders')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg"
                  >
                    View All
                  </button>
                </div>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Patient Name</TableHeaderCell>
                      <TableHeaderCell>Test Type</TableHeaderCell>
                      <TableHeaderCell>Priority</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Created Date</TableHeaderCell>
                      <TableHeaderCell>Action</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTestOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <Text>No test orders found</Text>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTestOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <Flex className="items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                              </div>
                              <Text className="font-medium">{order.patientName}</Text>
                            </Flex>
                          </TableCell>
                          <TableCell>
                            <Text>{order.testType}</Text>
                          </TableCell>
                          <TableCell>
                            <span 
                              className={`
                                inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold
                                ${
                                  order.priority === 'Urgent' 
                                    ? 'text-red-700 bg-red-50 border border-red-200' :
                                  order.priority === 'High' 
                                    ? 'text-amber-700 bg-amber-50 border border-amber-200' 
                                    : 'text-gray-700 bg-gray-50 border border-gray-200'
                                }
                              `}
                            >
                              {order.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span 
                              className={`
                                inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold
                                ${
                                  order.status === 'Completed' || order.status === 'Reviewed By AI'
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' :
                                  order.status === 'Pending' || order.status === 'Created'
                                    ? 'text-amber-700 bg-amber-50 border border-amber-200' :
                                  order.status === 'In Progress' || order.status === 'Processing'
                                    ? 'text-blue-700 bg-blue-50 border border-blue-200' :
                                  order.status === 'Cancelled'
                                    ? 'text-red-700 bg-red-50 border border-red-200'
                                    : 'text-gray-700 bg-gray-50 border border-gray-200'
                                }
                              `}
                            >
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Text className="text-sm">{formatDate(order.createdDate)}</Text>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/test-orders`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                            >
                              View Details
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabPanel>
                  
            {/* Test Types Tab */}
            <TabPanel>
              <Grid numItems={1} numItemsLg={2} className="gap-6">
                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <Title className="text-2xl font-bold text-gray-900 mb-1">Test Types Overview</Title>
                  <Text className="text-gray-500 text-sm font-light mb-6">Detailed breakdown by test type</Text>
                  <div className="mt-6 space-y-4">
                    {testTypeData.map((item, index) => {
                      const colorMap = {
                        blue: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                        purple: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
                        emerald: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                        yellow: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                        indigo: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                        pink: { text: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' }
                      };
                      const colors = colorMap[item.color] || colorMap.blue;
                      return (
                        <div key={index} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
                          <Flex className="items-center justify-between mb-2">
                            <Text className="font-semibold text-gray-900">{item.name}</Text>
                            <span className={`px-3 py-1 rounded-md text-sm font-semibold ${colors.text} ${colors.bg} ${colors.border} border`}>
                              {item.value}
                            </span>
                          </Flex>
                          <ProgressBar 
                            value={(item.value / testTypeData.reduce((sum, t) => sum + t.value, 0)) * 100} 
                            color={item.color}
                            className="mt-2"
                          />
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="bg-white shadow-xl border border-gray-200 rounded-lg">
                  <Title className="text-2xl font-bold text-gray-900 mb-1">Quick Actions</Title>
                  <Text className="text-gray-500 text-sm font-light mb-6">Common tasks and shortcuts</Text>
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => navigate('/test-orders/create')}
                      className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Text className="font-bold text-gray-900 text-base">Create Test Order</Text>
                        <Text className="text-sm text-gray-500">Add a new test order for a patient</Text>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/patients')}
                      className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-green-500 hover:shadow-lg rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Text className="font-bold text-gray-900 text-base">Manage Patients</Text>
                        <Text className="text-sm text-gray-500">View and manage patient records</Text>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/test-orders')}
                      className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <Text className="font-bold text-gray-900 text-base">View All Orders</Text>
                        <Text className="text-sm text-gray-500">Browse all test orders</Text>
                      </div>
                    </button>
                    <button
                      onClick={() => navigate('/medical-records')}
                      className="w-full flex items-center gap-4 p-5 bg-white border-2 border-gray-200 hover:border-indigo-500 hover:shadow-lg rounded-lg transition-all duration-200 text-left group"
                    >
                      <div className="p-2.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <Stethoscope className="w-5 h-5 text-indigo-600" />
                </div>
                      <div className="flex-1">
                        <Text className="font-bold text-gray-900 text-base">Medical Records</Text>
                        <Text className="text-sm text-gray-500">Access patient medical history</Text>
          </div>
                    </button>
        </div>
                </Card>
              </Grid>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </DashboardLayout>
  );
}
