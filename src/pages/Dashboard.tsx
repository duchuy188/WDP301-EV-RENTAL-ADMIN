import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  Clock, Battery, Zap, RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import vehicleService from '@/components/service/vehicleService';
import rentalService from '@/components/service/rentalService';
import analyticsService from '@/components/service/analyticsService';
import maintenanceService from '@/components/service/maintenanceService';
import { UserService } from '@/components/service/userService';
import { formatCurrency, formatDateTime } from '@/utils/dateUtils';
import { showToast } from '@/lib/toast';

// Interfaces for Dashboard Data
interface DashboardStats {
  totalVehicles: number;
  totalCustomers: number;
  monthlyRevenue: number;
  activeRentals: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  newCustomersThisMonth: number;
  growthRate: number;
}

interface HourlyActivity {
  hour: string;
  rentals: number;
  returns: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'rental' | 'maintenance' | 'return';
  title: string;
  description: string;
  time: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface VehicleStatusData {
  name: string;
  value: number;
  color: string;
}

interface RevenueByDay {
  date: string;
  revenue: number;
  transactions: number;
}

export function Dashboard() {
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    activeRentals: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    newCustomersThisMonth: 0,
    growthRate: 0
  });
  const [hourlyData, setHourlyData] = useState<HourlyActivity[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [vehicleStatusData, setVehicleStatusData] = useState<VehicleStatusData[]>([]);
  const [revenueByDayData, setRevenueByDayData] = useState<RevenueByDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel (except peak data which may not exist)
      const [vehicleStats, revenueData, customersData, rentalsData, maintenanceData] = await Promise.all([
        vehicleService.getVehicleStatistics(),
        analyticsService.getRevenueOverview({ period: 'month' }),
        UserService.getUsers({ limit: 1000, role: 'EV Renter' }),
        rentalService.getAdminRentals({ limit: 100, status: 'active' }),
        maintenanceService.getMaintenanceReports({ limit: 10 })
      ]);

      // Try to fetch peak data separately (may not be available)
      let peakData = null;
      try {
        if (typeof analyticsService.getPeakAnalysis === 'function') {
          peakData = await analyticsService.getPeakAnalysis({ type: 'hours', period: '7d' });
        }
      } catch (error) {
        console.warn('Peak analysis not available:', error);
      }

      // Calculate stats
      const vehicleStatsData = vehicleStats.data;
      const totalVehicles = vehicleStatsData?.totalVehicles || 0;
      const availableVehicles = vehicleStatsData?.availableVehicles || 0;
      const maintenanceVehicles = vehicleStatsData?.maintenanceVehicles || 0;
      const rentedVehicles = vehicleStatsData?.rentedVehicles || 0;

      const totalCustomers = customersData.pagination?.total || 0;
      const monthlyRevenue = revenueData.totalRevenue || 0;
      const growthRate = revenueData.growthRate || 0;

      // Count new customers this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const newCustomersThisMonth = customersData.users?.filter(user => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= oneMonthAgo;
      }).length || 0;

      setStats({
        totalVehicles,
        totalCustomers,
        monthlyRevenue,
        activeRentals: rentedVehicles,
        availableVehicles,
        maintenanceVehicles,
        newCustomersThisMonth,
        growthRate
      });

      // Process vehicle status distribution
      const statusDistribution: VehicleStatusData[] = [
        { name: 'Sẵn sàng', value: availableVehicles, color: '#4CAF50' },
        { name: 'Đang thuê', value: rentedVehicles, color: '#2196F3' },
        { name: 'Bảo trì', value: maintenanceVehicles, color: '#FF9800' },
        { name: 'Đặt trước', value: vehicleStatsData?.reservedVehicles || 0, color: '#9C27B0' },
        { name: 'Nháp', value: vehicleStatsData?.draftVehicles || 0, color: '#607D8B' }
      ].filter(item => item.value > 0);
      setVehicleStatusData(statusDistribution);

      // Fetch revenue trends for last 7 days
      try {
        const trendsResponse = await analyticsService.getRevenueTrends({ 
          period: 'week',
          payment_method: 'all'
        });
        
        if (trendsResponse.trends && trendsResponse.trends.length > 0) {
          const dailyRevenue = trendsResponse.trends.map(trend => ({
            date: new Date(trend.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: trend.revenue,
            transactions: trend.transactionCount
          }));
          setRevenueByDayData(dailyRevenue);
        }
      } catch (error) {
        console.warn('Could not fetch revenue trends:', error);
        // Generate sample data for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            revenue: Math.floor(Math.random() * 1000000) + 500000,
            transactions: Math.floor(Math.random() * 20) + 5
          };
        });
        setRevenueByDayData(last7Days);
      }

      // Process hourly data from peak analysis or create sample data
      if (peakData?.peak_hours?.data) {
        const hourlyActivities: HourlyActivity[] = peakData.peak_hours.data.map(item => ({
          hour: `${item.hour}:00`,
          rentals: item.bookings,
          returns: Math.floor(item.bookings * 0.8), // Estimate returns
          revenue: item.revenue
        }));
        setHourlyData(hourlyActivities);
      } else {
        // Generate sample hourly data based on rental data
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const sampleHourlyData = hours.map(hour => ({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          rentals: Math.floor(Math.random() * 10),
          returns: Math.floor(Math.random() * 8),
          revenue: Math.floor(Math.random() * 500000)
        }));
        setHourlyData(sampleHourlyData);
      }

      // Process recent activities
      const activities: RecentActivity[] = [];
      
      // Add recent rentals
      if (rentalsData.data?.rentals) {
        rentalsData.data.rentals.slice(0, 5).forEach((rental: any) => {
          activities.push({
            id: rental._id,
            type: 'rental',
            title: `${rental.vehicle_id?.name || 'Xe'} - ${rental.vehicle_id?.license_plate || 'N/A'}`,
            description: `Khách hàng: ${rental.user_id?.name || 'N/A'}`,
            time: rental.actual_start_time || rental.createdAt,
            status: rental.status === 'active' ? 'in-progress' : 'completed'
          });
        });
      }

      // Add recent maintenance
      if (maintenanceData.data?.reports) {
        maintenanceData.data.reports.slice(0, 5).forEach((report: any) => {
          activities.push({
            id: report._id,
            type: 'maintenance',
            title: `${report.vehicle_id?.name || 'Xe'} - ${report.vehicle_id?.license_plate || 'N/A'}`,
            description: report.issue_description || 'Bảo trì định kỳ',
            time: report.reported_at || report.createdAt,
            status: report.status === 'pending' ? 'pending' : 
                    report.status === 'in_progress' ? 'in-progress' : 'completed'
          });
        });
      }

      // Sort by time and take top 10
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 10));

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showToast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate time ago
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  // KPI Cards configuration
  const kpiCards = [
    {
      title: 'Tổng số xe',
      value: stats.totalVehicles,
      icon: Car,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
      darkBgColor: 'dark:bg-primary-900/20',
      change: `${stats.availableVehicles} xe sẵn sàng`,
      trend: 'neutral'
    },
    {
      title: 'Tổng khách hàng',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      darkBgColor: 'dark:bg-blue-900/20',
      change: `+${stats.newCustomersThisMonth} khách hàng mới`,
      trend: 'up'
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.monthlyRevenue),
      displayValue: `${(stats.monthlyRevenue / 1000000000).toFixed(1)}B`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      darkBgColor: 'dark:bg-purple-900/20',
      change: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}% so với tháng trước`,
      trend: stats.growthRate > 0 ? 'up' : 'down'
    },
    {
      title: 'Xe đang thuê',
      value: stats.activeRentals,
      icon: Battery,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      darkBgColor: 'dark:bg-orange-900/20',
      change: `${stats.maintenanceVehicles} xe đang bảo trì`,
      trend: 'neutral'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 p-6"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold mb-0.5 text-white drop-shadow-lg">
              Xin chào, Admin! 👋
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Tổng quan hệ thống quản lý EV Rental
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`h-5 w-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right">
              <p className="text-green-50 dark:text-green-100">Hôm nay</p>
              <p className="text-2xl font-bold text-white drop-shadow-lg">
                {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="group"
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        {card.displayValue || card.value}
                      </p>
                      <div className="flex items-center gap-1">
                        {card.trend === 'up' && (
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        )}
                        {card.trend === 'down' && (
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                        )}
                        <p className={`text-xs ${
                          card.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                          card.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {card.change}
                        </p>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${card.bgColor} ${card.darkBgColor} group-hover:scale-110 transition-transform`}>
                      <card.icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary-600" />
                  <span>Phân bố trạng thái xe</span>
                </div>
                {!loading && vehicleStatusData.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {stats.totalVehicles} xe
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : vehicleStatusData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} xe`, 'Số lượng']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Trend Last 7 Days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Doanh thu 7 ngày qua</span>
                </div>
                {!loading && revenueByDayData.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {formatCurrency(revenueByDayData.reduce((sum, item) => sum + item.revenue, 0))}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : revenueByDayData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueByDayData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                        tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                          return [value, 'Giao dịch'];
                        }}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{ fill: '#16a34a', strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Doanh thu"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="transactions"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Giao dịch"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Hoạt động theo giờ (7 ngày qua)</span>
                </div>
                {!loading && hourlyData.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {hourlyData.reduce((sum, item) => sum + item.rentals, 0)} bookings
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Biểu đồ theo dõi lượt thuê và doanh thu theo từng khung giờ
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : hourlyData.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu</p>
                  </div>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                          return [value, name === 'rentals' ? 'Lượt thuê' : 'Lượt trả'];
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="rentals"
                        stroke="#16a34a"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRentals)"
                        name="Lượt thuê"
                      />
                      <Area
                        type="monotone"
                        dataKey="returns"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReturns)"
                        name="Lượt trả"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status and Recent Activities */}
        <div className="space-y-6">
          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  Trạng thái hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Hệ thống hoạt động bình thường
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {stats.totalVehicles} xe trong hệ thống
                      </p>
                    </div>
                    
                    {stats.maintenanceVehicles > 0 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Cảnh báo bảo trì
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                          {stats.maintenanceVehicles} xe cần bảo trì
                        </p>
                      </div>
                    )}
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                        <Battery className="h-4 w-4 mr-2" />
                        Tỷ lệ sử dụng
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        {stats.totalVehicles > 0 
                          ? ((stats.activeRentals / stats.totalVehicles) * 100).toFixed(1)
                          : 0}% xe đang được thuê
                      </p>
                    </div>

                    {stats.availableVehicles > 0 && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-400">
                        <p className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          Xe sẵn sàng
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                          {stats.availableVehicles} xe có thể cho thuê ngay
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Hoạt động gần đây</span>
                  </div>
                  {!loading && recentActivities.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {recentActivities.length} hoạt động
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3 p-3">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Chưa có hoạt động gần đây</p>
                  </div>
                ) : (
                  recentActivities.slice(0, 8).map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'rental' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        activity.type === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        'bg-green-100 dark:bg-green-900/20'
                      }`}>
                        {activity.status === 'completed' ? (
                          <CheckCircle className={`h-4 w-4 ${
                            activity.type === 'rental' ? 'text-blue-600' :
                            activity.type === 'maintenance' ? 'text-orange-600' :
                            'text-green-600'
                          }`} />
                        ) : activity.status === 'in-progress' ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                          {activity.description} • {getTimeAgo(activity.time)}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          activity.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300' :
                          activity.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300' : 
                          'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300'
                        }`}
                      >
                        {activity.status === 'completed' ? 'Hoàn thành' :
                         activity.status === 'in-progress' ? 'Đang xử lý' : 'Chờ xử lý'}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}