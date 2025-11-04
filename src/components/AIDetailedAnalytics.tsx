import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  RefreshCw,
  Target,
  Zap,
  Car,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Brain,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import AIService from './service/aiService';
import {
  DemandForecastData,
  VehicleRecommendationsData,
  TrendAnalysisData,
  ForecastPeriod,
  AnalysisPeriod
} from './service/type/aiTypes';
import { showToast } from '../lib/toast';

type TabType = 'demand' | 'vehicles' | 'trends';

export function AIDetailedAnalytics() {
  const [activeTab, setActiveTab] = useState<TabType>('demand');
  const [loading, setLoading] = useState(true);
  
  // Demand Forecast State
  const [demandData, setDemandData] = useState<DemandForecastData | null>(null);
  const [demandPeriod, setDemandPeriod] = useState<ForecastPeriod>('7d');
  
  // Vehicle Recommendations State
  const [vehicleData, setVehicleData] = useState<VehicleRecommendationsData | null>(null);
  
  // Trend Analysis State
  const [trendData, setTrendData] = useState<TrendAnalysisData | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<AnalysisPeriod>('90d');

  // Fetch Demand Forecast
  const fetchDemandForecast = async () => {
    try {
      setLoading(true);
      const response = await AIService.getDemandForecast(demandPeriod);
      setDemandData(response.data);
      console.log('📊 Demand Forecast:', response.data);
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tải dự báo nhu cầu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vehicle Recommendations
  const fetchVehicleRecommendations = async () => {
    try {
      setLoading(true);
      const response = await AIService.getVehicleRecommendations();
      setVehicleData(response.data);
      console.log('🚗 Vehicle Recommendations:', response.data);
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tải gợi ý xe');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Trend Analysis
  const fetchTrendAnalysis = async () => {
    try {
      setLoading(true);
      const response = await AIService.getTrendAnalysis(trendPeriod);
      setTrendData(response.data);
      console.log('📈 Trend Analysis:', response.data);
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tải phân tích xu hướng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'demand') {
      fetchDemandForecast();
    } else if (activeTab === 'vehicles') {
      fetchVehicleRecommendations();
    } else if (activeTab === 'trends') {
      fetchTrendAnalysis();
    }
  }, [activeTab, demandPeriod, trendPeriod]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'increasing') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'down' || trend === 'decreasing') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Ưu tiên cao</Badge>;
      case 'medium':
        return <Badge variant="warning">Ưu tiên TB</Badge>;
      case 'low':
        return <Badge variant="default">Ưu tiên thấp</Badge>;
      default:
        return null;
    }
  };

  const getTimingText = (timing: string) => {
    switch (timing) {
      case 'immediate':
        return 'Ngay lập tức';
      case 'short_term':
        return 'Ngắn hạn (1-3 tháng)';
      case 'long_term':
        return 'Dài hạn (>3 tháng)';
      default:
        return timing;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Detailed Analytics
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📊 Phân tích chi tiết và đầy đủ từ các API AI • Dữ liệu có thể lọc và tùy chỉnh
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'demand'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Dự báo nhu cầu chi tiết
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'vehicles'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
          }`}
        >
          <Car className="w-4 h-4 inline mr-2" />
          Tất cả trạm cần xe
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'trends'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Xu hướng & Dự báo
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Demand Forecast Tab */}
        {activeTab === 'demand' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Dự báo nhu cầu chi tiết
              </h3>
              <div className="flex items-center gap-2">
                <Select value={demandPeriod} onValueChange={(val) => setDemandPeriod(val as ForecastPeriod)}>
                  <SelectTrigger className="w-32">
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
                  variant="outline"
                  size="sm"
                  onClick={fetchDemandForecast}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !demandData ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Không có dữ liệu</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Total Forecast */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Tổng dự báo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Chu kỳ</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {demandData.totalForecast.period}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Dự báo Bookings</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {demandData.totalForecast.predictedBookings}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Độ tin cậy</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {demandData.totalForecast.confidence}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Hourly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Xu hướng theo giờ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                      {demandData.hourlyTrend.map((trend, index) => {
                        const maxForecast = Math.max(...demandData.hourlyTrend.map(t => t.forecast));
                        const heightPercent = Math.round((trend.forecast / maxForecast) * 100);
                        const color = trend.demand === 'high' ? 'bg-red-500' : trend.demand === 'medium' ? 'bg-yellow-500' : 'bg-green-500';
                        
                        return (
                          <div key={index} className="flex flex-col items-center gap-1">
                            <div className="relative w-full h-32 flex items-end justify-center">
                              <div
                                className={`w-full ${color} rounded-t transition-all hover:opacity-80 relative`}
                                style={{ height: `${Math.max(heightPercent, 15)}%` }}
                                title={`${trend.hour}h: ${trend.forecast} bookings - ${trend.demand}`}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">{trend.forecast}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              {trend.hour}h
                            </span>
                            <Badge
                              variant={trend.demand === 'high' ? 'destructive' : trend.demand === 'medium' ? 'warning' : 'default'}
                              className="text-xs px-1"
                            >
                              {trend.demand}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      Xu hướng theo tuần
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {demandData.weeklyTrend.map((trend, index) => {
                        const maxForecast = Math.max(...demandData.weeklyTrend.map(t => t.forecast));
                        const widthPercent = (trend.forecast / maxForecast) * 100;
                        const color = trend.demand === 'high' ? 'from-red-500 to-red-600' : trend.demand === 'medium' ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600';
                        
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">
                              {trend.day}
                            </span>
                            <div className="flex-1">
                              <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${color} flex items-center justify-between px-3 transition-all duration-500`}
                                  style={{ width: `${Math.max(widthPercent, 10)}%` }}
                                >
                                  <span className="text-sm font-bold text-white">{trend.forecast} bookings</span>
                                  <Badge variant="default" className="text-xs">
                                    {trend.demand}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Factors and Recommendations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Các yếu tố ảnh hưởng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {demandData.factors.map((factor, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{factor}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                        Gợi ý từ AI
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {demandData.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Vehicle Recommendations Tab */}
        {activeTab === 'vehicles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Danh sách đầy đủ tất cả trạm cần bổ sung xe
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVehicleRecommendations}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-6">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !vehicleData ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Không có dữ liệu</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng số trạm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {vehicleData.totalStations}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng xe cần thêm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {vehicleData.totalVehiclesNeeded}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                        Đầu tư ước tính
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {((vehicleData.estimatedInvestment || 0) / 1000000).toFixed(1)}M VNĐ
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Ngày tạo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(vehicleData.generatedAt).toLocaleString('vi-VN')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Danh sách gợi ý theo trạm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {vehicleData.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {rec.stationName}
                                </h4>
                                {getPriorityBadge(rec.priority)}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Station ID: {rec.stationId}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 dark:text-gray-400">ROI dự kiến</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {rec.estimatedROI}%
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Xe hiện tại</p>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{rec.currentVehicles}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nhu cầu dự báo</p>
                              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{rec.predictedDemand}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cần bổ sung</p>
                              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{rec.vehiclesNeeded}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Công suất tối ưu</p>
                              <p className="text-xl font-bold text-green-600 dark:text-green-400">{rec.optimalCapacity}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Thời điểm thực hiện: <strong>{getTimingText(rec.timing)}</strong>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        )}

        {/* Trend Analysis Tab */}
        {activeTab === 'trends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Phân tích xu hướng chi tiết
              </h3>
              <div className="flex items-center gap-2">
                <Select value={trendPeriod} onValueChange={(val) => setTrendPeriod(val as AnalysisPeriod)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30d">30 ngày</SelectItem>
                    <SelectItem value="90d">90 ngày</SelectItem>
                    <SelectItem value="1y">1 năm</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTrendAnalysis}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="py-6">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !trendData ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Không có dữ liệu</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Overall Trend */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Xu hướng tổng thể
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
                        <div className="flex items-center justify-center mb-2">
                          {getTrendIcon(trendData.trends.overall)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hướng xu hướng</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 capitalize">
                          {trendData.trends.overall}
                        </p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl">
                        <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tốc độ tăng trưởng</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          +{trendData.trends.growthRate}%
                        </p>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chu kỳ</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {trendData.trends.cyclical}
                        </p>
                      </div>
                    </div>

                    {/* Seasonality */}
                    {trendData.trends.seasonality && trendData.trends.seasonality.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Tính mùa vụ
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {trendData.trends.seasonality.map((season, index) => (
                            <Badge key={index} variant="default">
                              {season}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-600" />
                      Các yếu tố ảnh hưởng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                          🌤️ Thời tiết
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {trendData.factors.weather}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                          🎉 Sự kiện
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {trendData.factors.events}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                          💰 Kinh tế
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {trendData.factors.economic}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Forecasts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Dự báo ngắn hạn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Chu kỳ</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {trendData.forecasts.shortTerm.period}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Xu hướng</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(trendData.forecasts.shortTerm.trend)}
                            <span className="font-semibold text-blue-900 dark:text-blue-100 capitalize">
                              {trendData.forecasts.shortTerm.trend}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Độ tin cậy</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            {trendData.forecasts.shortTerm.confidence}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        Dự báo dài hạn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Chu kỳ</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-100">
                            {trendData.forecasts.longTerm.period}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Xu hướng</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(trendData.forecasts.longTerm.trend)}
                            <span className="font-semibold text-purple-900 dark:text-purple-100 capitalize">
                              {trendData.forecasts.longTerm.trend}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">Độ tin cậy</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-100">
                            {trendData.forecasts.longTerm.confidence}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Opportunities and Challenges */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Cơ hội
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trendData.opportunities.map((opp, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{opp}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Thách thức
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trendData.challenges.map((chal, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{chal}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      Gợi ý chiến lược từ AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {trendData.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

