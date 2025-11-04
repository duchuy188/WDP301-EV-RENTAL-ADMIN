import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  Clock, Battery, Zap, RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight, UserCheck 
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import vehicleService from '@/components/service/vehicleService';
import rentalService from '@/components/service/rentalService';
import analyticsService from '@/components/service/analyticsService';
import maintenanceService from '@/components/service/maintenanceService';
import { UserService } from '@/components/service/userService';
import { formatCurrency } from '@/utils/dateUtils';
import { showToast } from '@/lib/toast';
import StationRevenueDetailModal from '@/components/StationRevenueDetailModal';
import StaffPerformanceDetailModal from '@/components/StaffPerformanceDetailModal';

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
  [key: string]: string | number; // Index signature for recharts
}

interface RevenueByDay {
  date: string;
  revenue: number;
  transactions: number;
}

interface StationRevenue {
  id: string;
  name: string;
  code: string;
  revenue: number;
  transactionCount: number;
  percentage: number;
}

interface StaffPerformance {
  staffId: string;
  staffName: string;
  staffEmail: string;
  stationName: string;
  performanceScore: number;
  totalRentals: number;
  avgOverallRating: number;
  totalComplaints: number;
  resolutionRate: number;
}

export function Dashboard() {
  // State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
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
  const [stationRevenueData, setStationRevenueData] = useState<StationRevenue[]>([]);
  const [totalStationRevenue, setTotalStationRevenue] = useState<number>(0); // Total from ALL stations
  const [staffPerformanceData, setStaffPerformanceData] = useState<StaffPerformance[]>([]);
  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);
  const [showStationDetail, setShowStationDetail] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel (except peak data which may not exist)
      const [vehicleStats, revenueData, customersData, rentalsData, maintenanceData] = await Promise.all([
        vehicleService.getVehicleStatistics(),
        analyticsService.getRevenueOverview({ period }),
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
      const newCustomersThisMonth = customersData.users?.filter((user: any) => {
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

      // Fetch revenue trends based on selected period
      try {
        const trendsResponse = await analyticsService.getRevenueTrends({ 
          period,
          payment_method: 'all'
        });
        
        if (trendsResponse.trends && trendsResponse.trends.length > 0) {
          const dailyRevenue = trendsResponse.trends.map((trend: any) => {
            let formattedDate = 'N/A';
            
            try {
              // Handle different date formats from API
              const dateValue = trend.date;
              
              if (!dateValue) {
                formattedDate = 'N/A';
              } else if (typeof dateValue === 'string') {
                // Try to parse ISO string or other formats
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                  // Format based on period
                  if (period === 'today') {
                    formattedDate = parsedDate.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  } else if (period === 'week' || period === 'month') {
                    formattedDate = parsedDate.toLocaleDateString('vi-VN', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    });
                  } else {
                    // year
                    formattedDate = parsedDate.toLocaleDateString('vi-VN', { 
                      month: '2-digit', 
                      year: 'numeric' 
                    });
                  }
                } else {
                  // If can't parse, use the string as is
                  formattedDate = dateValue;
                }
              } else {
                formattedDate = String(dateValue);
              }
            } catch (err) {
              console.error('Error formatting date:', trend.date, err);
              formattedDate = String(trend.date);
            }
            
            return {
              date: formattedDate,
              revenue: trend.revenue || 0,
              transactions: trend.transactionCount || 0
            };
          });
          
          setRevenueByDayData(dailyRevenue);
          console.log('Revenue trends formatted:', dailyRevenue);
        } else {
          setRevenueByDayData([]);
        }
      } catch (error) {
        console.warn('Could not fetch revenue trends:', error);
        setRevenueByDayData([]);
      }

      // Fetch revenue by station
      try {
        const stationRevenueResponse = await analyticsService.getRevenueByStation({
          period,
          payment_method: 'all'
        });
        
        // Save total revenue from ALL stations (from API)
        setTotalStationRevenue(stationRevenueResponse.totalRevenue || 0);
        
        if (stationRevenueResponse.stations && stationRevenueResponse.stations.length > 0) {
          const topStations = stationRevenueResponse.stations
            .slice(0, 10) // Top 10 stations
            .map((station: any) => ({
              id: station.id,
              name: station.name,
              code: station.code,
              revenue: station.revenue,
              transactionCount: station.transactionCount,
              percentage: station.percentage
            }));
          setStationRevenueData(topStations);
        } else {
          setStationRevenueData([]);
        }
      } catch (error) {
        console.warn('Could not fetch station revenue:', error);
        setStationRevenueData([]);
        setTotalStationRevenue(0);
      }

      // Process hourly data from peak analysis or rental data
      if (peakData?.peak_hours?.data && peakData.peak_hours.data.length > 0) {
        const hourlyActivities: HourlyActivity[] = peakData.peak_hours.data.map((item: any) => ({
          hour: `${item.hour}:00`,
          rentals: item.bookings || 0,
          returns: Math.floor((item.bookings || 0) * 0.8), // Estimate returns
          revenue: item.revenue || 0
        }));
        setHourlyData(hourlyActivities);
      } else if (rentalsData.data?.rentals && rentalsData.data.rentals.length > 0) {
        // Generate hourly data from rental timestamps
        const hourCounts: { [key: number]: { rentals: number; revenue: number } } = {};
        
        // Initialize all 24 hours
        for (let i = 0; i < 24; i++) {
          hourCounts[i] = { rentals: 0, revenue: 0 };
        }
        
        // Count rentals by hour
        rentalsData.data.rentals.forEach((rental: any) => {
          try {
            const startTime = rental.actual_start_time || rental.createdAt;
            if (startTime) {
              const date = new Date(startTime);
              if (!isNaN(date.getTime())) {
                const hour = date.getHours();
                hourCounts[hour].rentals += 1;
                hourCounts[hour].revenue += rental.total_amount || 0;
              }
            }
          } catch (err) {
            console.warn('Error parsing rental time:', err);
          }
        });
        
        const hourlyActivities = Object.entries(hourCounts).map(([hourStr, data]) => ({
          hour: `${hourStr.padStart(2, '0')}:00`,
          rentals: data.rentals,
          returns: Math.floor(data.rentals * 0.8),
          revenue: data.revenue
        }));
        
        setHourlyData(hourlyActivities);
      } else {
        // No data available
        setHourlyData([]);
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

      // Fetch staff performance
      try {
        const staffPeriodMap: Record<string, '7d' | '30d' | '90d' | '1y'> = {
          'today': '7d',
          'week': '7d',
          'month': '30d',
          'year': '1y'
        };
        
        const staffResponse = await analyticsService.getStaffPerformance({
          period: staffPeriodMap[period]
        });
        
        if (staffResponse.staff_performance && staffResponse.staff_performance.length > 0) {
          const topStaff = staffResponse.staff_performance
            .slice(0, 10)
            .map((staff: any) => ({
              staffId: staff.staff_id,
              staffName: staff.staff_name,
              staffEmail: staff.staff_email,
              stationName: staff.station?.name || 'N/A',
              performanceScore: staff.performance_score,
              totalRentals: staff.rental_stats?.total_rentals || 0,
              avgOverallRating: staff.feedback_stats?.avg_overall_rating || 0,
              totalComplaints: staff.complaint_stats?.total_complaints || 0,
              resolutionRate: staff.complaint_stats?.resolution_rate || 0
            }));
          setStaffPerformanceData(topStaff);
        } else {
          setStaffPerformanceData([]);
        }
      } catch (error) {
        console.warn('Could not fetch staff performance:', error);
        setStaffPerformanceData([]);
      }

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

  // Load data on mount and when period changes
  useEffect(() => {
    fetchDashboardData();
  }, [period]);

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

  // Get period label
  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'hôm nay';
      case 'week': return 'tuần này';
      case 'month': return 'tháng này';
      case 'year': return 'năm này';
      default: return 'kỳ này';
    }
  };

  const getPreviousPeriodLabel = () => {
    switch (period) {
      case 'today': return 'hôm qua';
      case 'week': return 'tuần trước';
      case 'month': return 'tháng trước';
      case 'year': return 'năm trước';
      default: return 'kỳ trước';
    }
  };

  // Format revenue for display - show exact number with thousand separators
  const formatRevenueDisplay = (num: number): string => {
    if (num === 0) return '0 ₫';
    
    // Use Vietnamese number format with thousand separators
    return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
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
      change: `+${stats.newCustomersThisMonth} khách hàng mới ${getPeriodLabel()}`,
      trend: 'up'
  },
  {
      title: `Doanh thu ${getPeriodLabel()}`,
      value: formatCurrency(stats.monthlyRevenue),
      displayValue: formatRevenueDisplay(stats.monthlyRevenue),
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
      darkBgColor: 'dark:bg-purple-900/20',
      change: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}% so với ${getPreviousPeriodLabel()}`,
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

      {/* Period Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Khoảng thời gian:
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'today' as const, label: 'Hôm nay' },
                  { value: 'week' as const, label: 'Tuần này' },
                  { value: 'month' as const, label: 'Tháng này' },
                  { value: 'year' as const, label: 'Năm này' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPeriod(item.value)}
                    disabled={loading || refreshing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      period === item.value
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${(loading || refreshing) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
                    <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1 truncate" title={card.displayValue || card.value}>
                        {card.displayValue || card.value}
                      </p>
                      <div className="flex items-center gap-1">
                        {card.trend === 'up' && (
                          <ArrowUpRight className="h-3 w-3 text-green-600 flex-shrink-0" />
                        )}
                        {card.trend === 'down' && (
                          <ArrowDownRight className="h-3 w-3 text-red-600 flex-shrink-0" />
                        )}
                        <p className={`text-xs truncate ${
                          card.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                          card.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                      {card.change}
                    </p>
                  </div>
                    </div>
                    <div className={`p-3 rounded-xl ${card.bgColor} ${card.darkBgColor} group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Stations Revenue - Professional Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Top 10 Trạm - Doanh thu cao nhất</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xếp hạng các trạm theo doanh thu {getPeriodLabel()}
                </p>
              </div>
              {!loading && stationRevenueData.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tổng doanh thu (tất cả trạm)</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatRevenueDisplay(totalStationRevenue)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Top 10: {formatRevenueDisplay(stationRevenueData.reduce((sum, s) => sum + s.revenue, 0))}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : stationRevenueData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu doanh thu</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stationRevenueData.map((station, index) => (
                  <motion.div
                    key={station.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group"
                  >
                    <div className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      index === 0 
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-400 dark:border-gray-600 shadow-md'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-400 dark:border-orange-600 shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}>
                      {/* Ranking Badge */}
                      <div className="absolute -top-3 -left-3 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                            : index === 2
                            ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-900'
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>

                      {/* Station Info */}
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 flex-1">
                            {station.name}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className="text-xs shrink-0"
                          >
                            {station.code}
                          </Badge>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Doanh thu</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 leading-tight">
                          {formatRevenueDisplay(station.revenue)}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Giao dịch</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {station.transactionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Tỷ trọng</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {station.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="mt-3">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : index === 1
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                : index === 2
                                ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                : 'bg-gradient-to-r from-purple-500 to-purple-600'
                            }`}
                            style={{ width: `${station.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Trophy for top 3 */}
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className={`text-2xl ${
                            index === 0 ? 'animate-bounce' : ''
                          }`}>
                            {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

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
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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
                  <span>Xu hướng doanh thu ({getPeriodLabel()})</span>
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
                  <span>Hoạt động theo giờ ({getPeriodLabel()})</span>
                </div>
                {!loading && hourlyData.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {hourlyData.reduce((sum, item) => sum + item.rentals, 0)} bookings
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lượt thuê và trả xe theo từng khung giờ trong {getPeriodLabel()}
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
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-2 p-2">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-6">
                    <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có hoạt động</p>
                  </div>
                ) : (
                  recentActivities.slice(0, 5).map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className={`p-1.5 rounded-md ${
                        activity.type === 'rental' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        activity.type === 'maintenance' ? 'bg-orange-100 dark:bg-orange-900/20' :
                        'bg-green-100 dark:bg-green-900/20'
                      }`}>
                        {activity.status === 'completed' ? (
                          <CheckCircle className={`h-3 w-3 ${
                            activity.type === 'rental' ? 'text-blue-600' :
                            activity.type === 'maintenance' ? 'text-orange-600' :
                            'text-green-600'
                          }`} />
                        ) : activity.status === 'in-progress' ? (
                          <Clock className="h-3 w-3 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-gray-900 dark:text-white truncate">
                          {activity.title}
                      </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getTimeAgo(activity.time)}
                      </p>
                    </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>

      {/* Top Staff Performance Section - Below Hourly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <span>Top 10 Nhân viên xuất sắc ({getPeriodLabel()})</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Xếp hạng nhân viên theo điểm hiệu suất tổng hợp (rental + feedback + complaints)
                </p>
              </div>
              {!loading && staffPerformanceData.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Điểm TB</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(staffPerformanceData.reduce((sum, s) => sum + s.performanceScore, 0) / staffPerformanceData.length).toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : staffPerformanceData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Chưa có dữ liệu nhân viên</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {staffPerformanceData.map((staff, index) => (
                  <motion.div
                    key={staff.staffId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group"
                  >
                    <div 
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        index === 0 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-400 dark:border-blue-600 shadow-lg'
                          : index === 1
                          ? 'bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 border-cyan-400 dark:border-cyan-600 shadow-md'
                          : index === 2
                          ? 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-400 dark:border-teal-600 shadow-md'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => {
                        setSelectedStaff({ id: staff.staffId, name: staff.staffName });
                        setShowStaffDetail(true);
                      }}
                    >
                      {/* Ranking Badge */}
                      <div className="absolute -top-3 -left-3 z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${
                          index === 0
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : index === 1
                            ? 'bg-gradient-to-br from-cyan-500 to-sky-600 text-white'
                            : index === 2
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
                            : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                        }`}>
                          #{index + 1}
                  </div>
                      </div>

                      {/* Trophy for top 3 */}
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <div className={`text-2xl ${index === 0 ? 'animate-bounce' : ''}`}>
                            {index === 0 ? '👑' : index === 1 ? '⭐' : '🌟'}
                          </div>
                        </div>
                      )}

                      {/* Staff Info */}
                      <div className="mb-3">
                        <h5 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1 min-h-[2.5rem]">
                          {staff.staffName}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {staff.stationName}
                        </p>
                      </div>

                      {/* Performance Score */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Điểm hiệu suất</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                staff.performanceScore >= 90 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : staff.performanceScore >= 75
                                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              }`}
                              style={{ width: `${staff.performanceScore}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold ${
                            staff.performanceScore >= 90 ? 'text-green-600 dark:text-green-400' :
                            staff.performanceScore >= 75 ? 'text-blue-600 dark:text-blue-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {staff.performanceScore.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">
                            {staff.totalRentals}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Thuê</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-bold">
                            {staff.avgOverallRating.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">⭐</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-green-600 dark:text-green-400 font-bold">
                            {staff.resolutionRate}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">GQ</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
          </motion.div>

      {/* Station Revenue Detail Modal */}
      {selectedStation && (
        <StationRevenueDetailModal
          isOpen={showStationDetail}
          onClose={() => {
            setShowStationDetail(false);
            setSelectedStation(null);
          }}
          stationId={selectedStation.id}
          stationName={selectedStation.name}
          period={period}
          paymentMethod="all"
        />
      )}

      {/* Staff Performance Detail Modal */}
      {selectedStaff && (
        <StaffPerformanceDetailModal
          isOpen={showStaffDetail}
          onClose={() => {
            setShowStaffDetail(false);
            setSelectedStaff(null);
          }}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
        />
      )}
    </motion.div>
  );
}