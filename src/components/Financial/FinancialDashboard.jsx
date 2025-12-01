import { useState, useEffect } from 'react';
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
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  X,
  MoreVertical,
  Calendar
} from 'lucide-react';
import AlphaVantageService from '../../services/AlphaVantageService';

// Format currency
const formatCurrency = (value, currency = 'VND') => {
  if (!value || isNaN(value)) return '0';
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B ${currency}`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M ${currency}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K ${currency}`;
  }
  return `${value.toLocaleString()} ${currency}`;
};

// Compact KPI Card Component (matching image style)
const KPICard = ({ title, value, change, icon: Icon, iconColor = 'blue' }) => {
  const isPositive = change >= 0;
  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-gray-50 ${iconColors[iconColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
          </div>
        )}
      </div>
      <div className="mb-1">
        <p className="text-sm text-gray-600 font-medium">{title}</p>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {formatCurrency(value)}
      </div>
      {change !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          {isPositive ? '+' : ''}{change.toFixed(2)}% Vs last month
        </p>
      )}
    </div>
  );
};

// Chart Card Component with tabs
const ChartCard = ({ title, subtitle, children, tabs, activeTab, onTabChange, onMenuClick }) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>
      
      {tabs && (
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      
      {children}
    </div>
  );
};

// Detail Modal
const DetailModal = ({ isOpen, onClose, title, data, type = 'annual' }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {type === 'annual' ? 'Annual data' : 'Quarterly data'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {data.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {type === 'annual' ? `Year ${item.year}` : `Quarter ${item.quarter}`}
                  </h3>
                  <span className="text-xs text-gray-500">{item.date}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Revenue</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(item.revenueVND)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Gross Profit</p>
                    <p className="font-semibold text-emerald-600">{formatCurrency(item.grossProfitVND)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Operating Expenses</p>
                    <p className="font-semibold text-orange-600">{formatCurrency(item.operatingExpensesVND)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Operating Income</p>
                    <p className="font-semibold text-purple-600">{formatCurrency(item.operatingIncomeVND)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Net Income</p>
                    <p className="font-semibold text-green-600">{formatCurrency(item.netIncomeVND)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Profit Margin</p>
                    <p className="font-semibold text-gray-700">
                      {item.revenueVND > 0 
                        ? ((item.netIncomeVND / item.revenueVND) * 100).toFixed(2)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FinancialDashboard() {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [modalType, setModalType] = useState('annual');
  const [timeFrame, setTimeFrame] = useState('Monthly');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const data = await AlphaVantageService.getFinancialDashboardData('IBM');
      setFinancialData(data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-500">Unable to load financial data</p>
      </div>
    );
  }

  const { overview, annualData, quarterlyData, metrics } = financialData;

  // Prepare chart data based on timeframe
  const getChartData = () => {
    if (timeFrame === 'Monthly') {
      // Use quarterly data for monthly view (last 12 months)
      return quarterlyData?.slice(0, 12).map((item, index) => ({
        month: `M${index + 1}`,
        label: item.quarter.substring(5, 10),
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000,
        grossProfit: item.grossProfitVND / 1000000
      })) || [];
    } else if (timeFrame === 'Quarterly') {
      return quarterlyData?.slice(0, 8).map(item => ({
        quarter: item.quarter.substring(5, 10),
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000
      })) || [];
    } else {
      // Annually
      return annualData?.map(item => ({
        year: item.year,
        revenue: item.revenueVND / 1000000,
        profit: item.netIncomeVND / 1000000,
        grossProfit: item.grossProfitVND / 1000000
      })) || [];
    }
  };

  const chartData = getChartData();
  const xAxisKey = timeFrame === 'Monthly' ? 'label' : timeFrame === 'Quarterly' ? 'quarter' : 'year';

  // Calculate previous period for comparison
  const previousRevenue = annualData?.[1]?.revenueVND || 0;
  const currentRevenue = annualData?.[0]?.revenueVND || 0;
  const revenueChange = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue * 100) 
    : 0;

  const previousProfit = annualData?.[1]?.netIncomeVND || 0;
  const currentProfit = annualData?.[0]?.netIncomeVND || 0;
  const profitChange = previousProfit > 0 
    ? ((currentProfit - previousProfit) / previousProfit * 100) 
    : 0;

  const previousGrossProfit = annualData?.[1]?.grossProfitVND || 0;
  const currentGrossProfit = annualData?.[0]?.grossProfitVND || 0;
  const grossProfitChange = previousGrossProfit > 0 
    ? ((currentGrossProfit - previousGrossProfit) / previousGrossProfit * 100) 
    : 0;

  // Expense breakdown for pie chart
  const latestData = annualData?.[0];
  const expenseBreakdown = latestData ? [
    { name: 'Cost of Revenue', value: latestData.costOfRevenueVND / 1000000, color: '#ef4444' },
    { name: 'Operating Expenses', value: latestData.operatingExpensesVND / 1000000, color: '#f59e0b' },
    { name: 'Net Income', value: latestData.netIncomeVND / 1000000, color: '#22c55e' }
  ] : [];

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={metrics.latestRevenue}
          change={revenueChange}
          icon={DollarSign}
          iconColor="blue"
        />
        <KPICard
          title="Net Income"
          value={metrics.latestNetIncome}
          change={profitChange}
          icon={TrendingUp}
          iconColor="green"
        />
        <KPICard
          title="Gross Profit"
          value={metrics.latestGrossProfit}
          change={grossProfitChange}
          icon={TrendingUp}
          iconColor="purple"
        />
        <KPICard
          title="Profit Margin"
          value={metrics.profitMargin * 10000}
          change={metrics.profitMargin}
          icon={TrendingUp}
          iconColor="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Statistics Chart */}
        <ChartCard
          title="Revenue Statistics"
          subtitle={`Total revenue ${formatCurrency(metrics.latestRevenue)}`}
          tabs={['Monthly', 'Quarterly', 'Annually']}
          activeTab={timeFrame}
          onTabChange={setTimeFrame}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={(value) => `${value}M`}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(2)}M VND`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22c55e" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)"
                  name="Net Income"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Financial Performance Chart */}
        <ChartCard
          title="Financial Performance"
          subtitle="Revenue and profit comparison"
          tabs={['Monthly', 'Quarterly', 'Annually']}
          activeTab={timeFrame}
          onTabChange={setTimeFrame}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={(value) => `${value}M`}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(2)}M VND`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Net Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="grossProfit" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Gross Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Monthly Sales Chart */}
        <ChartCard
          title="Monthly Sales"
          subtitle="Revenue breakdown by period"
          onMenuClick={() => setSelectedMetric('revenue')}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={(value) => `${value}M`}
                />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(2)}M VND`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="#22c55e" radius={[8, 8, 0, 0]} name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Expense Breakdown */}
        <ChartCard
          title="Expense Breakdown"
          subtitle="Latest year financial distribution"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value.toFixed(2)}M VND`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Detail Modal */}
      {selectedMetric && (
        <DetailModal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          title={`${selectedMetric === 'revenue' ? 'Revenue' : 'Financial'} Details`}
          data={modalType === 'annual' ? annualData : quarterlyData}
          type={modalType}
        />
      )}
    </div>
  );
}
