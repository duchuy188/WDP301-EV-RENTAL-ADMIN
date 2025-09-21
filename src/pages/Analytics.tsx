import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, Clock, Users } from 'lucide-react';
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
import { storage } from '@/lib/storage';

export function Analytics() {
  const stations = storage.getStations();
  const vehicles = storage.getVehicles();
  const rentals = storage.getRentals();

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
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Báo cáo & Phân tích
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Thống kê chi tiết và phân tích thông minh
        </p>
      </motion.div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiInsights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="p-2 rounded-full bg-white dark:bg-gray-700 mr-3">
                  <insight.icon className={`h-5 w-5 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Brain className="h-4 w-4 mr-1 text-purple-500" />
                    AI Insights
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Độ tin cậy: {insight.confidence}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {insight.insight}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
              <CardTitle>Doanh thu theo điểm thuê</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByStation}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      className="text-gray-600 dark:text-gray-400"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-gray-600 dark:text-gray-400"
                      tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${(value/1000000).toFixed(1)}M VNĐ`, 'Doanh thu']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1976D2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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

        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
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
    </div>
  );
}