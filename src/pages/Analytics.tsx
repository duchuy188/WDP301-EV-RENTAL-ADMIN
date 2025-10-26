import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Clock, Users, Filter, RefreshCw } from 'lucide-react';
import { 
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
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import analyticsService from '@/components/service/analyticsService';
import StationRevenueDetailModal from '@/components/StationRevenueDetailModal';
import { AIDashboard } from '@/components/AIDashboard';
import { 
  RevenueTrendUI, 
  RevenueOverviewData,
  StationRevenueUI,
  PERIOD_LABELS, 
  ANALYTICS_PAYMENT_METHOD_LABELS 
} from '@/components/service/type/analyticsTypes';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { showToast } from '@/lib/toast';
import stationService from '@/components/service/stationService';

export function Analytics() {
  const stations = storage.getStations();
  const vehicles = storage.getVehicles();
  const rentals = storage.getRentals();

  // Revenue Overview State
  const [revenueOverview, setRevenueOverview] = useState<RevenueOverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Revenue Trends State
  const [revenueTrends, setRevenueTrends] = useState<RevenueTrendUI[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Revenue by Station State
  const [stationRevenues, setStationRevenues] = useState<StationRevenueUI[]>([]);
  const [loadingStationRevenues, setLoadingStationRevenues] = useState(false);

  // Filters State
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [selectedStations, setSelectedStations] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'cash' | 'vnpay' | 'bank_transfer'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [availableStations, setAvailableStations] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Station Detail Modal State
  const [showStationDetail, setShowStationDetail] = useState(false);
  const [selectedStationForDetail, setSelectedStationForDetail] = useState<{ id: string; name: string } | null>(null);

  // Fetch available stations
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await stationService.getStations({ limit: 1000 });
        setAvailableStations(response.stations || []);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };
    fetchStations();
  }, []);

  // Fetch revenue overview
  const fetchRevenueOverview = async () => {
    try {
      setLoadingOverview(true);
      const data = await analyticsService.getRevenueOverview({
        period,
        payment_method: paymentMethod
      });
      
      setRevenueOverview(data);
      console.log('Revenue overview loaded:', data);
    } catch (error: any) {
      console.error('Error fetching revenue overview:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải tổng quan doanh thu');
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch revenue trends
  const fetchRevenueTrends = async () => {
    try {
      setLoadingTrends(true);
      const response = await analyticsService.getRevenueTrends({
        period,
        stations: selectedStations,
        payment_method: paymentMethod
      });
      
      setRevenueTrends(response.trends || []);
      console.log('Revenue trends loaded:', response.trends);
    } catch (error: any) {
      console.error('Error fetching revenue trends:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải xu hướng doanh thu');
    } finally {
      setLoadingTrends(false);
    }
  };

  // Fetch revenue by station
  const fetchRevenueByStation = async () => {
    try {
      setLoadingStationRevenues(true);
      const response = await analyticsService.getRevenueByStation({
        period,
        date: selectedDate,
        payment_method: paymentMethod
      });
      
      setStationRevenues(response.stations || []);
      console.log('Revenue by station loaded:', response.stations);
    } catch (error: any) {
      console.error('Error fetching revenue by station:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải doanh thu theo trạm');
    } finally {
      setLoadingStationRevenues(false);
    }
  };

  // Fetch all analytics data
  const fetchAllAnalytics = async () => {
    await Promise.all([
      fetchRevenueOverview(),
      fetchRevenueTrends(),
      fetchRevenueByStation()
    ]);
  };

  // Load analytics data on mount and when filters change
  useEffect(() => {
    fetchAllAnalytics();
  }, [period, selectedStations, paymentMethod, selectedDate]);

  // Revenue by station
  const revenueByStation = stations.map(station => ({
    name: station.name.split(' - ')[1],
    revenue: station.rentedVehicles * 150000 + Math.random() * 500000
  }));

  // Vehicle usage
  const vehicleUsage = [
    { name: 'Đang thuê', value: vehicles.filter(v => v.status === 'rented').length, color: '#1976D2' },
    { name: 'Sẵn sàng', value: vehicles.filter(v => v.status === 'available').length, color: '#4CAF50' },
    { name: 'Bảo trì', value: vehicles.filter(v => v.status === 'maintenance').length, color: '#FF5722' },
  ];

  // Peak hours data
  const peakHours = [
    { hour: '06:00', rentals: 12 },
    { hour: '08:00', rentals: 45 },
    { hour: '10:00', rentals: 28 },
    { hour: '12:00', rentals: 35 },
    { hour: '14:00', rentals: 22 },
    { hour: '16:00', rentals: 18 },
    { hour: '18:00', rentals: 52 },
    { hour: '20:00', rentals: 38 },
    { hour: '22:00', rentals: 15 },
  ];

  const aiInsights = [
    {
      icon: TrendingUp,
      title: 'Dự báo nhu cầu',
      insight: 'Nhu cầu thuê xe dự kiến tăng 15% vào cuối tuần',
      confidence: '94%',
      color: 'text-green-600'
    },
    {
      icon: Clock,
      title: 'Khung giờ cao điểm',
      insight: 'Khung 18:00-20:00 có nhu cầu cao nhất trong ngày',
      confidence: '89%',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Phân khúc khách hàng',
      insight: 'Khách hàng 25-35 tuổi chiếm 68% tổng lượt thuê',
      confidence: '91%',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 dark:from-green-700 dark:via-emerald-700 dark:to-teal-800 rounded-2xl py-5 px-8 shadow-xl border-0 overflow-hidden"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-0.5 drop-shadow-lg">
              Báo cáo & Phân tích
            </h1>
            <p className="text-green-50 dark:text-green-100">
              Thống kê chi tiết và phân tích thông minh
            </p>
          </div>
        </div>
      </motion.div>

      {/* AI Dashboard - Featured Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <AIDashboard />
      </motion.div>

      {/* Revenue Trends Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Xu hướng Doanh thu
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
              </Button>
              <Button
                onClick={fetchAllAnalytics}
                variant="outline"
                size="sm"
                disabled={loadingTrends || loadingOverview || loadingStationRevenues}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loadingTrends || loadingOverview || loadingStationRevenues) ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div>
                <label htmlFor="period-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kỳ thống kê
                </label>
                <select
                  id="period-filter"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="today">Hôm nay</option>
                  <option value="week">Tuần này</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm này</option>
                </select>
              </div>

              <div>
                <label htmlFor="station-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạm
                </label>
                <select
                  id="station-filter"
                  value={selectedStations}
                  onChange={(e) => setSelectedStations(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">Tất cả trạm</option>
                  {availableStations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="payment-method-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phương thức thanh toán
                </label>
                <select
                  id="payment-method-filter"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">Tất cả</option>
                  <option value="cash">Tiền mặt</option>
                  <option value="vnpay">VNPay</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày thống kê (cho báo cáo theo trạm)
                </label>
                <input
                  type="date"
                  id="date-filter"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              {loadingOverview ? (
                <div className="flex items-center justify-center h-20">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-100 text-sm font-medium">Tổng doanh thu</p>
                    <TrendingUp className="h-8 w-8 text-blue-200" />
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    {formatCurrency(revenueOverview?.totalRevenue || 0)}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {PERIOD_LABELS[period]}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              {loadingOverview ? (
                <div className="flex items-center justify-center h-20">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-100 text-sm font-medium">Số giao dịch</p>
                    <Users className="h-8 w-8 text-green-200" />
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    {revenueOverview?.transactionCount || 0}
                  </h3>
                  <p className="text-green-100 text-sm">
                    {PERIOD_LABELS[period]}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Growth Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              {loadingOverview ? (
                <div className="flex items-center justify-center h-20">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-100 text-sm font-medium">Tăng trưởng</p>
                    <TrendingUp className="h-8 w-8 text-purple-200" />
                  </div>
                  <h3 className="text-3xl font-bold mb-1">
                    {revenueOverview?.growthRate?.toFixed(1) || 0}%
                  </h3>
                  <p className="text-purple-100 text-sm">
                    So với kỳ trước
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Station */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              {loadingOverview ? (
                <div className="flex items-center justify-center h-20">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-100 text-sm font-medium">Trạm hàng đầu</p>
                    <Brain className="h-8 w-8 text-orange-200" />
                  </div>
                  {revenueOverview?.topStation ? (
                    <>
                      <h3 className="text-xl font-bold mb-1 truncate">
                        {revenueOverview.topStation.stationName}
                      </h3>
                      <p className="text-orange-100 text-sm">
                        {formatCurrency(revenueOverview.topStation.revenue)}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold mb-1">
                        --
                      </h3>
                      <p className="text-orange-100 text-sm">
                        Chưa có dữ liệu
                      </p>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Station */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Doanh thu theo trạm - {PERIOD_LABELS[period]}
                {paymentMethod !== 'all' && ` - ${ANALYTICS_PAYMENT_METHOD_LABELS[paymentMethod]}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStationRevenues ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : stationRevenues.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stationRevenues}
                      onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          const station = data.activePayload[0].payload as StationRevenueUI;
                          setSelectedStationForDetail({ id: station.id, name: station.name });
                          setShowStationDetail(true);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                        tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                          if (name === 'transactionCount') return [value, 'Số giao dịch'];
                          return [value, name];
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                        labelFormatter={(label) => `Trạm: ${label}`}
                        cursor={{ fill: 'rgba(25, 118, 210, 0.1)' }}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#1976D2" 
                        radius={[4, 4, 0, 0]} 
                        name="Doanh thu"
                        cursor="pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Usage Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ sử dụng xe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleUsage}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {vehicleUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Xu hướng Doanh thu - {PERIOD_LABELS[period]} 
                {paymentMethod !== 'all' && ` - ${ANALYTICS_PAYMENT_METHOD_LABELS[paymentMethod]}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : revenueTrends.length === 0 ? (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        className="text-gray-600 dark:text-gray-400"
                        tickFormatter={(value) => {
                          // Format date based on period
                          if (period === 'today') {
                            return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                          } else if (period === 'week' || period === 'month') {
                            return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                          } else {
                            return new Date(value).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
                          }
                        }}
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
                          if (name === 'revenue') {
                            return [formatCurrency(value), 'Doanh thu'];
                          }
                          return [value, 'Số giao dịch'];
                        }}
                        labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        name="Doanh thu"
                        stroke="#1976D2" 
                        strokeWidth={3}
                        dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="transactionCount" 
                        name="Số giao dịch"
                        stroke="#4CAF50" 
                        strokeWidth={2}
                        dot={{ fill: '#4CAF50', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Giờ cao điểm thuê xe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={peakHours}>
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
                      formatter={(value: number) => [`${value} lượt`, 'Số lần thuê']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="rentals" 
                      stroke="#1976D2" 
                      strokeWidth={3}
                      dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Station Revenue Detail Modal */}
      {selectedStationForDetail && (
        <StationRevenueDetailModal
          isOpen={showStationDetail}
          onClose={() => {
            setShowStationDetail(false);
            setSelectedStationForDetail(null);
          }}
          stationId={selectedStationForDetail.id}
          stationName={selectedStationForDetail.name}
          period={period}
          date={selectedDate}
          paymentMethod={paymentMethod}
        />
      )}
    </div>
  );
}