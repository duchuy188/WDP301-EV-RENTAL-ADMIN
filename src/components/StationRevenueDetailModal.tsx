import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Clock, Users, Bike, DollarSign } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Card } from './ui/card';
import { Button } from './ui/button';
import analyticsService from './service/analyticsService';
import { 
  StationRevenueDetailData,
  VEHICLE_TYPE_LABELS 
} from './service/type/analyticsTypes';
import { formatCurrency } from '../utils/dateUtils';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface StationRevenueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
  period?: 'today' | 'week' | 'month' | 'year';
  date?: string;
  paymentMethod?: 'all' | 'cash' | 'vnpay' | 'bank_transfer';
}

const COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];

export function StationRevenueDetailModal({
  isOpen,
  onClose,
  stationId,
  stationName,
  period = 'month',
  date,
  paymentMethod = 'all'
}: StationRevenueDetailModalProps) {
  useDisableBodyScroll(isOpen);
  
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<StationRevenueDetailData | null>(null);

  useEffect(() => {
    if (isOpen && stationId) {
      fetchStationDetail();
    }
  }, [isOpen, stationId, period, date, paymentMethod]);

  const fetchStationDetail = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getStationRevenueDetail({
        stationId,
        period,
        date,
        payment_method: paymentMethod
      });
      
      setDetailData(data);
      console.log('Station detail loaded:', data);
    } catch (error: any) {
      console.error('Error fetching station detail:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải chi tiết trạm');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="text-white">
              <h2 className="text-2xl font-bold">{stationName}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {detailData?.station.code} - {detailData?.station.address}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : !detailData ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue by Vehicle Type */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Bike className="h-5 w-5 mr-2 text-blue-600" />
                    Doanh thu theo loại xe
                  </h3>
                  {detailData.revenueByVehicleType.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={detailData.revenueByVehicleType}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ _id, percent }) => `${VEHICLE_TYPE_LABELS[_id] || _id} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="revenue"
                            >
                              {detailData.revenueByVehicleType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Stats Table */}
                      <div className="space-y-2">
                        {detailData.revenueByVehicleType.map((item, index) => {
                          const colorClass = index === 0 ? 'bg-blue-600' :
                                           index === 1 ? 'bg-green-600' :
                                           index === 2 ? 'bg-orange-600' :
                                           index === 3 ? 'bg-red-600' : 'bg-purple-600';
                          return (
                            <div
                              key={item._id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 rounded mr-3 ${colorClass}`} />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {VEHICLE_TYPE_LABELS[item._id] || item._id}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {formatCurrency(item.revenue)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.count} lượt thuê
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Revenue by Hour */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-600" />
                    Doanh thu theo giờ
                  </h3>
                  {detailData.revenueByHour.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailData.revenueByHour}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="_id" 
                            label={{ value: 'Giờ', position: 'insideBottom', offset: -5 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Giờ ${label}:00`}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Customers */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      Top khách hàng
                    </h3>
                    {detailData.topCustomers.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                    ) : (
                      <div className="space-y-3">
                        {detailData.topCustomers.map((customer, index) => (
                          <div
                            key={customer._id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                                <span className="text-purple-600 dark:text-purple-300 font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {customer.customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {customer.customerEmail}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(customer.totalSpent)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {customer.rentalCount} lượt
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Vehicle Utilization */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                      Xe có doanh thu cao
                    </h3>
                    {detailData.vehicleUtilization.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                    ) : (
                      <div className="space-y-3">
                        {detailData.vehicleUtilization.slice(0, 5).map((vehicle, index) => (
                          <div
                            key={vehicle._id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mr-3">
                                <span className="text-orange-600 dark:text-orange-300 font-bold">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {vehicle.licensePlate}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(vehicle.totalRevenue)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {vehicle.rentalCount} lượt
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default StationRevenueDetailModal;

