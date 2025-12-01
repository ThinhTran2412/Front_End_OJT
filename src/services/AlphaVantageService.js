import axios from 'axios';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'demo'; // Sử dụng demo key, có thể thay bằng key thật sau

// Lấy Income Statement (Báo cáo thu nhập)
export const getIncomeStatement = async (symbol = 'IBM') => {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'INCOME_STATEMENT',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    if (response.data.Note) {
      console.warn('API rate limit reached, using cached data');
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching income statement:', error);
    throw error;
  }
};

// Lấy Company Overview (Tổng quan công ty)
export const getCompanyOverview = async (symbol = 'IBM') => {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol: symbol,
        apikey: API_KEY
      }
    });
    
    if (response.data.Note) {
      console.warn('API rate limit reached, using cached data');
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company overview:', error);
    throw error;
  }
};

// Chuyển đổi dữ liệu Income Statement thành format phù hợp cho phòng lab
export const transformIncomeStatementForLab = (incomeData) => {
  if (!incomeData || !incomeData.annualReports) return null;
  
  const reports = incomeData.annualReports.slice(0, 5); // Lấy 5 năm gần nhất
  
  return reports.map(report => ({
    year: report.fiscalDateEnding?.substring(0, 4) || 'N/A',
    date: report.fiscalDateEnding,
    revenue: parseFloat(report.totalRevenue || 0),
    costOfRevenue: parseFloat(report.costOfRevenue || 0),
    grossProfit: parseFloat(report.grossProfit || 0),
    operatingExpenses: parseFloat(report.operatingExpenses || 0),
    operatingIncome: parseFloat(report.operatingIncome || 0),
    netIncome: parseFloat(report.netIncome || 0),
    ebitda: parseFloat(report.ebitda || 0),
    // Chuyển đổi sang VND (giả sử 1 USD = 25,000 VND)
    revenueVND: parseFloat(report.totalRevenue || 0) * 25000,
    costOfRevenueVND: parseFloat(report.costOfRevenue || 0) * 25000,
    grossProfitVND: parseFloat(report.grossProfit || 0) * 25000,
    operatingExpensesVND: parseFloat(report.operatingExpenses || 0) * 25000,
    operatingIncomeVND: parseFloat(report.operatingIncome || 0) * 25000,
    netIncomeVND: parseFloat(report.netIncome || 0) * 25000
  }));
};

// Chuyển đổi dữ liệu Quarterly Reports
export const transformQuarterlyReportsForLab = (incomeData) => {
  if (!incomeData || !incomeData.quarterlyReports) return null;
  
  const reports = incomeData.quarterlyReports.slice(0, 8); // Lấy 8 quý gần nhất
  
  return reports.map(report => ({
    quarter: report.fiscalDateEnding,
    date: report.fiscalDateEnding,
    revenue: parseFloat(report.totalRevenue || 0),
    costOfRevenue: parseFloat(report.costOfRevenue || 0),
    grossProfit: parseFloat(report.grossProfit || 0),
    operatingExpenses: parseFloat(report.operatingExpenses || 0),
    operatingIncome: parseFloat(report.operatingIncome || 0),
    netIncome: parseFloat(report.netIncome || 0),
    // Chuyển đổi sang VND
    revenueVND: parseFloat(report.totalRevenue || 0) * 25000,
    costOfRevenueVND: parseFloat(report.costOfRevenue || 0) * 25000,
    grossProfitVND: parseFloat(report.grossProfit || 0) * 25000,
    operatingExpensesVND: parseFloat(report.operatingExpenses || 0) * 25000,
    operatingIncomeVND: parseFloat(report.operatingIncome || 0) * 25000,
    netIncomeVND: parseFloat(report.netIncome || 0) * 25000
  }));
};

// Lấy dữ liệu tài chính đầy đủ cho dashboard
export const getFinancialDashboardData = async (symbol = 'IBM') => {
  try {
    const [incomeStatement, overview] = await Promise.all([
      getIncomeStatement(symbol),
      getCompanyOverview(symbol)
    ]);
    
    if (!incomeStatement || !overview) {
      return null;
    }
    
    const annualData = transformIncomeStatementForLab(incomeStatement);
    const quarterlyData = transformQuarterlyReportsForLab(incomeStatement);
    
    // Tính toán các metrics
    const latestReport = annualData?.[0];
    const previousReport = annualData?.[1];
    
    const revenueGrowth = latestReport && previousReport
      ? ((latestReport.revenue - previousReport.revenue) / previousReport.revenue * 100).toFixed(2)
      : 0;
    
    const profitMargin = latestReport && latestReport.revenue > 0
      ? ((latestReport.netIncome / latestReport.revenue) * 100).toFixed(2)
      : 0;
    
    return {
      overview: {
        name: overview.Name || 'Laboratory',
        sector: overview.Sector || 'Healthcare',
        marketCap: parseFloat(overview.MarketCapitalization || 0) * 25000,
        revenueTTM: parseFloat(overview.RevenueTTM || 0) * 25000,
        grossProfitTTM: parseFloat(overview.GrossProfitTTM || 0) * 25000,
        profitMargin: parseFloat(overview.ProfitMargin || 0) * 100,
        operatingMargin: parseFloat(overview.OperatingMarginTTM || 0) * 100,
        returnOnEquity: parseFloat(overview.ReturnOnEquityTTM || 0) * 100,
        eps: parseFloat(overview.EPS || 0),
        peRatio: parseFloat(overview.PERatio || 0)
      },
      annualData,
      quarterlyData,
      metrics: {
        revenueGrowth: parseFloat(revenueGrowth),
        profitMargin: parseFloat(profitMargin),
        latestRevenue: latestReport?.revenueVND || 0,
        latestNetIncome: latestReport?.netIncomeVND || 0,
        latestGrossProfit: latestReport?.grossProfitVND || 0
      }
    };
  } catch (error) {
    console.error('Error fetching financial dashboard data:', error);
    throw error;
  }
};

const AlphaVantageService = {
  getIncomeStatement,
  getCompanyOverview,
  transformIncomeStatementForLab,
  transformQuarterlyReportsForLab,
  getFinancialDashboardData
};

export default AlphaVantageService;

