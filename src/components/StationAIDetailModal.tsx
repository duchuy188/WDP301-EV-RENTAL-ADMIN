import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  Users,
  Car,
  Battery,
  AlertCircle,
  Info
} from 'lucide-react';
import { FaMotorcycle } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import AIService from './service/aiService';
import { stationService } from './service/stationService';
import { StationForecastData, ForecastPeriod } from './service/type/aiTypes';
import { showToast } from '../lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface StationAIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
}

export function StationAIDetailModal({ isOpen, onClose, stationId, stationName }: StationAIDetailModalProps) {
  const [data, setData] = useState<StationForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<ForecastPeriod>('7d');

  const fetchStationForecast = async () => {
    try {
      setLoading(true);
      
      // Fetch station info and AI forecast in parallel
      const [stationResponse, aiResponse] = await Promise.all([
        stationService.getStationById(stationId).catch(() => null),
        AIService.getStationForecast(stationId, period)
      ]);
      
      const station = stationResponse?.station;
      const apiData = aiResponse.data as any;
      
      // Extract station info
      const currentVehicles = station?.current_vehicles || 0;
      const maxCapacity = station?.max_capacity || 1;
      const availableVehicles = station?.available_vehicles || 0;
      
      // Calculate peak demand from hourly trend
      const hourlyTrends = apiData.hourlyTrend || [];
      const peakDemand = Math.max(...hourlyTrends.map((h: any) => h.forecast || 0), 0);
      
      // Calculate metrics
      const currentUtilization = maxCapacity > 0 ? Math.round((currentVehicles / maxCapacity) * 100) : 0;
      
      // Calculate shortage: if peak demand > available vehicles, we have shortage
      // Assume each booking needs 1 vehicle (could be adjusted)
      const vehiclesNeededForPeak = Math.ceil(peakDemand);
      const shortage = Math.max(0, vehiclesNeededForPeak - availableVehicles);
      
      // Optimal capacity: peak demand + 20% buffer
      const optimalCapacity = Math.ceil(peakDemand * 1.2);
      const vehiclesNeeded = Math.max(0, optimalCapacity - currentVehicles);
      
      // Determine timing based on shortage
      let timing: 'immediate' | 'short_term' | 'long_term' = 'short_term';
      if (shortage > currentVehicles * 0.5) {
        timing = 'immediate';
      } else if (shortage > currentVehicles * 0.2) {
        timing = 'short_term';
      } else {
        timing = 'long_term';
      }
      
      // Check if it's already StationForecastData format
      if (apiData.stationInfo && apiData.forecast && apiData.capacityAnalysis) {
        setData(apiData);
      } else {
        // Transform from DemandForecastData to StationForecastData
        const transformedData: StationForecastData = {
          stationInfo: {
            name: station?.name || stationName,
            currentVehicles: currentVehicles
          },
          forecast: {
            period: apiData.totalForecast?.period || period,
            predictedBookings: apiData.totalForecast?.predictedBookings || 0,
            confidence: apiData.totalForecast?.confidence || 0
          },
          capacityAnalysis: {
            currentUtilization: currentUtilization,
            peakDemand: Math.round(peakDemand * 10) / 10, // Round to 1 decimal
            shortage: shortage
          },
          recommendations: {
            vehiclesNeeded: vehiclesNeeded,
            optimalCapacity: optimalCapacity,
            timing: timing
          },
          peakHours: hourlyTrends
            .filter((h: any) => h.forecast > 0)
            .map((h: any) => ({
              hour: h.hour,
              demand: Math.round((h.forecast || 0) * 10) / 10
            }))
            .sort((a: any, b: any) => b.demand - a.demand)
            .slice(0, 8),
          strategies: Array.isArray(apiData.recommendations) ? apiData.recommendations : []
        };
        
        setData(transformedData);
      }
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tải dữ liệu dự báo trạm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stationId) {
      fetchStationForecast();
    }
  }, [isOpen, stationId, period]);

  const getTimingBadge = (timing: string) => {
    switch (timing) {
      case 'immediate':
        return <Badge variant="destructive" className="text-xs">Ngay lập tức</Badge>;
      case 'short_term':
        return <Badge variant="warning" className="text-xs">Ngắn hạn</Badge>;
      case 'long_term':
        return <Badge variant="default" className="text-xs">Dài hạn</Badge>;
      default:
        return null;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600 dark:text-red-400';
    if (utilization >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getUtilizationBg = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-500';
    if (utilization >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {stationName}
                  <Badge variant="default" className="text-xs">AI Analysis</Badge>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Phân tích & dự báo chi tiết bằng AI (Gemini)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(val) => setPeriod(val as ForecastPeriod)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 ngày</SelectItem>
                  <SelectItem value="30d">30 ngày</SelectItem>
                  <SelectItem value="90d">90 ngày</SelectItem>
                  <SelectItem value="1y">1 năm</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-white/50 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !data ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Không thể tải dữ liệu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Station Info & Forecast Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FaMotorcycle className="w-4 h-4" />
                        Xe hiện tại
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {data?.stationInfo?.currentVehicles ?? 0}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Dự báo Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {data?.forecast?.predictedBookings ?? 0}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        Confidence: {data?.forecast?.confidence ?? 0}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Chu kỳ
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data?.forecast?.period ?? 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Capacity Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      Phân tích công suất
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Utilization */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Tỷ lệ sử dụng hiện tại
                        </span>
                        <span className={`text-lg font-bold ${getUtilizationColor(data?.capacityAnalysis?.currentUtilization ?? 0)}`}>
                          {data?.capacityAnalysis?.currentUtilization ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUtilizationBg(data?.capacityAnalysis?.currentUtilization ?? 0)} transition-all duration-500`}
                          style={{ width: `${data?.capacityAnalysis?.currentUtilization ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-700 dark:text-red-300">Nhu cầu cao điểm</span>
                        </div>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {data?.capacityAnalysis?.peakDemand ?? 0}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">bookings dự kiến</p>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-sm text-orange-700 dark:text-orange-300">Thiếu hụt</span>
                        </div>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                          {data?.capacityAnalysis?.shortage ?? 0}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">xe cần bổ sung</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      Gợi ý từ AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                        <FaMotorcycle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Xe cần thêm</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {data?.recommendations?.vehiclesNeeded ?? 0}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl">
                        <Target className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Công suất tối ưu</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {data?.recommendations?.optimalCapacity ?? 0}
                        </p>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
                        <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Thời điểm</p>
                        <div className="flex items-center justify-center mt-2">
                          {getTimingBadge(data?.recommendations?.timing ?? 'short_term')}
                        </div>
                      </div>
                    </div>

                    {/* Strategies */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        Chiến lược thực hiện
                      </p>
                      <div className="space-y-2">
                        {(data?.strategies || []).map((strategy, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{strategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Peak Hours Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Giờ cao điểm (Peak Hours)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data?.peakHours && data.peakHours.length > 0 ? (
                      <div className="space-y-3">
                        {data.peakHours.map((peak, index) => {
                          const maxDemand = Math.max(...data.peakHours.map(p => p.demand), 1);
                          const widthPercent = maxDemand > 0 ? (peak.demand / maxDemand) * 100 : 0;
                          
                          return (
                            <div key={index} className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-16">
                                {peak.hour}:00
                              </span>
                              <div className="flex-1">
                                <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-end pr-2 transition-all duration-500"
                                    style={{ width: `${Math.max(widthPercent, 0)}%` }}
                                  >
                                    <span className="text-xs font-bold text-white">{peak.demand}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                                {peak.demand} bookings
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Info className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Không có dữ liệu giờ cao điểm</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary Info */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                          Tóm tắt phân tích AI
                        </p>
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                          Trạm <strong>{data?.stationInfo?.name ?? stationName}</strong> hiện có <strong>{data?.stationInfo?.currentVehicles ?? 0} xe</strong> với 
                          tỷ lệ sử dụng <strong>{data?.capacityAnalysis?.currentUtilization ?? 0}%</strong>. 
                          AI dự báo <strong>{data?.forecast?.predictedBookings ?? 0} bookings</strong> trong {data?.forecast?.period ?? period} tới 
                          (độ tin cậy {data?.forecast?.confidence ?? 0}%). 
                          Để đáp ứng nhu cầu cao điểm ({data?.capacityAnalysis?.peakDemand ?? 0} bookings), 
                          cần bổ sung <strong>{data?.recommendations?.vehiclesNeeded ?? 0} xe</strong> để 
                          đạt công suất tối ưu <strong>{data?.recommendations?.optimalCapacity ?? 0} xe</strong>.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

