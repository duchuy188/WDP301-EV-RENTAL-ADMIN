import React from 'react';
import { motion } from 'framer-motion';
import { Car, Users, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Battery, Zap, Settings, UserCheck, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Mock data for admin dashboard
const mockAdminData = {
  totalVehicles: 125,
  totalCustomers: 842,
  monthlyRevenue: 2450000000, // 2.45 tỷ VNĐ
  activeRentals: 68,
  todayHandovers: 23,
  weeklyGrowth: 15.2
};

const mockChartData = [
  { hour: '06:00', rentals: 2, returns: 1 },
  { hour: '07:00', rentals: 8, returns: 3 },
  { hour: '08:00', rentals: 15, returns: 5 },
  { hour: '09:00', rentals: 12, returns: 8 },
  { hour: '10:00', rentals: 18, returns: 12 },
  { hour: '11:00', rentals: 22, returns: 15 },
  { hour: '12:00', rentals: 25, returns: 18 },
  { hour: '13:00', rentals: 20, returns: 22 },
  { hour: '14:00', rentals: 16, returns: 19 },
  { hour: '15:00', rentals: 19, returns: 16 },
  { hour: '16:00', rentals: 23, returns: 20 },
  { hour: '17:00', rentals: 28, returns: 24 },
  { hour: '18:00', rentals: 32, returns: 28 },
  { hour: '19:00', rentals: 25, returns: 31 },
  { hour: '20:00', rentals: 18, returns: 25 },
  { hour: '21:00', rentals: 12, returns: 18 },
  { hour: '22:00', rentals: 8, returns: 12 }
];

const kpiCards = [
  {
    title: 'Tổng số xe',
    value: mockAdminData.totalVehicles,
    icon: Car,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    darkBgColor: 'dark:bg-primary-900/20',
    change: '+8 xe mới tuần này'
  },
  {
    title: 'Tổng khách hàng',
    value: mockAdminData.totalCustomers,
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/20',
    change: '+47 khách hàng mới'
  },
  {
    title: 'Doanh thu tháng',
    value: `${(mockAdminData.monthlyRevenue / 1000000000).toFixed(1)}B`,
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    darkBsgColor: 'dark:bg-purple-900/20',
    change: `+${mockAdminData.weeklyGrowth}% so với tháng trước`
  },
  {
    title: 'Xe đang thuê',
    value: mockAdminData.activeRentals,
    icon: Battery,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/20',
    change: `${mockAdminData.todayHandovers} lượt giao/nhận hôm nay`
  }
];

export function Dashboard() {
  // Recent incidents data
  const recentIncidents = [
    { id: 1, type: 'maintenance', vehicle: 'BMW i3 - 30A12345', issue: 'Cần bảo trì định kỳ', time: '1h trước', status: 'pending' },
    { id: 2, type: 'complaint', customer: 'Nguyễn Văn An', issue: 'Khiếu nại về chất lượng dịch vụ', time: '3h trước', status: 'resolved' },
    { id: 3, type: 'maintenance', vehicle: 'Tesla Model 3 - 29B98765', issue: 'Lỗi hệ thống sạc', time: '5h trước', status: 'in-progress' },
    { id: 4, type: 'system', message: 'Cập nhật hệ thống thành công', time: '1 ngày trước', status: 'resolved' },
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
        className="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Xin chào, Admin! 👋
            </h1>
            <p className="text-green-100 text-lg">
              Tổng quan hệ thống quản lý EV Rental
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-100">Hôm nay</p>
            <p className="text-2xl font-bold">
              {new Date().toLocaleDateString('vi-VN')}
            </p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {card.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bgColor} ${card.darkBgColor} group-hover:scale-110 transition-transform`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Hoạt động giao/nhận theo giờ</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Biểu đồ theo dõi lượt giao và nhận xe trong ngày hôm nay
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 12 }}
                      className="text-neutral-600 dark:text-gray-400"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-neutral-600 dark:text-gray-400"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rentals"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                      name="Lượt thuê"
                    />
                    <Line
                      type="monotone"
                      dataKey="returns"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                      name="Lượt trả"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications and System Status */}
        <div className="space-y-6">
          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Trạng thái hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Hệ thống hoạt động bình thường
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Tất cả dịch vụ đang online
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Cảnh báo bảo trì
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    3 xe cần bảo trì định kỳ
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Hiệu suất cao
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    95% xe đang hoạt động
                  </p>
                </div>
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
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <span>Hoạt động gần đây</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentIncidents.slice(0, 4).map((incident) => (
                  <div key={incident.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-gray-700">
                      {incident.status === 'resolved' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : incident.status === 'in-progress' ? (
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {incident.vehicle || incident.customer || incident.message}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-gray-400 mt-1">
                        {incident.issue} • {incident.time}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        incident.status === 'resolved' ? 'default' : 
                        incident.status === 'in-progress' ? 'secondary' : 'outline'
                      }
                      className={`text-xs ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                        incident.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200' : 
                        'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                      }`}
                    >
                      {incident.status === 'resolved' ? 'Hoàn thành' :
                       incident.status === 'in-progress' ? 'Đang xử lý' : 'Chờ xử lý'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}