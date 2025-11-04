import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Activity,
  MousePointerClick,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import AIService from './service/aiService';
import { AIDashboardData, AnalysisPeriod } from './service/type/aiTypes';
import { showToast } from '../lib/toast';
import { StationAIDetailModal } from './StationAIDetailModal';

export function AIDashboard() {
  const [data, setData] = useState<AIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<AnalysisPeriod>('30d');
  const [aiHealthy, setAiHealthy] = useState(false);
  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string } | null>(null);

  // Check AI health
  const checkAIHealth = async () => {
    try {
      const response = await AIService.checkHealth();
      setAiHealthy(response.data.status === 'operational');
      console.log('🤖 AI Service:', response.data.status);
    } catch (error) {
      setAiHealthy(false);
      console.error('AI Service offline');
    }
  };

  // Fetch AI dashboard
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await AIService.getAIDashboard(period);
      setData(response.data);
      console.log('📊 AI Dashboard loaded:', response.data);
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tải dashboard AI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAIHealth();
    fetchDashboard();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up' || trend === 'increasing') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'down' || trend === 'decreasing') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Activity className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              AI Analytics Dashboard
              <Badge variant={aiHealthy ? 'success' : 'destructive'} className="text-xs">
                {aiHealthy ? (
                  <><Sparkles className="w-3 h-3 mr-1" /> AI Active</>
                ) : (
                  <><AlertCircle className="w-3 h-3 mr-1" /> AI Offline</>
                )}
              </Badge>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dự báo và phân tích bằng AI (Gemini)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(val) => setPeriod(val as AnalysisPeriod)}>
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
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">Không thể tải dữ liệu AI</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Dự báo Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {data.overview?.predictedBookings || 0}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Confidence: {data.overview?.confidence || 0}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Xe cần thêm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {data.overview?.vehiclesNeeded || 0}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Cho {data.overview?.totalStations || 0} trạm
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Đầu tư dự kiến
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {((data.overview?.estimatedInvestment || 0) / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ROI: {data.vehicleRecommendations?.estimatedROI || 0}%
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Xu hướng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {data.trendAnalysis?.trends?.overall || 'N/A'}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      +{data.trendAnalysis?.trends?.growthRate || 0}%
                    </p>
                  </div>
                  {getTrendIcon(data.trendAnalysis?.trends?.overall || 'stable')}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Priority Stations - Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Top Trạm Ưu Tiên Cao
                  <Badge variant="outline" className="text-xs ml-auto">
                    Top 3 cần hành động
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(data.vehicleRecommendations?.topPriorities || []).slice(0, 3).map((rec, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedStation({ id: rec.stationId, name: rec.stationName })}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg hover:shadow-md transition-all cursor-pointer border border-orange-200 dark:border-orange-800 group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full font-bold text-lg shadow-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {rec.stationName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cần thêm <span className="font-bold text-orange-600">{rec.vehiclesNeeded}</span> xe • ROI: <span className="font-bold text-green-600">{rec.estimatedROI}%</span>
                        </p>
                      </div>
                      <div>
                        <Badge variant={rec.priority === 'high' ? 'destructive' : 'warning'} className="text-xs">
                          {rec.priority === 'high' ? 'Khẩn' : 'Cao'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    💡 <strong>Xem chi tiết tất cả trạm</strong> và phân tích đầy đủ ở phần <strong>"AI Detailed Analytics"</strong> bên dưới
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trends and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Phân tích xu hướng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      Xu hướng tổng thể
                    </p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(data.trendAnalysis?.trends?.overall || 'stable')}
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 capitalize">
                        {data.trendAnalysis?.trends?.overall || 'N/A'}
                      </p>
                      <Badge variant="default" className="ml-2">
                        +{data.trendAnalysis?.trends?.growthRate || 0}%
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Cơ hội
                    </p>
                    <div className="space-y-2">
                      {(data.trendAnalysis?.opportunities || []).map((opp, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">{opp}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Thách thức
                    </p>
                    <div className="space-y-2">
                      {(data.trendAnalysis?.challenges || []).map((chal, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">{chal}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    AI Insights & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Key Insights
                    </p>
                    <div className="space-y-2">
                      {(data.insights || []).map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <p className="text-sm text-yellow-900 dark:text-yellow-100">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Recommendations
                    </p>
                    <div className="space-y-2">
                      {(data.trendAnalysis?.recommendations || []).map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Generated: {new Date(data.generatedAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Demand Forecast Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Dự báo nhu cầu hôm nay
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Peak Hours Summary */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {(() => {
                    const hourlyTrends = data.demandForecast?.hourlyTrend || [];
                    const peakHours = hourlyTrends
                      .filter(t => t.demand === 'high')
                      .sort((a, b) => b.forecast - a.forecast)
                      .slice(0, 3);
                    
                    return peakHours.map((trend, index) => (
                      <div key={index} className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Giờ cao điểm #{index + 1}</span>
                          <Badge variant="destructive" className="text-xs">High</Badge>
                        </div>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-400">{trend.hour}h</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {trend.forecast} bookings
                        </p>
                      </div>
                    ));
                  })()}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Tổng dự báo hôm nay</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {(data.demandForecast?.hourlyTrend || []).reduce((sum, t) => sum + t.forecast, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Độ tin cậy</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {data.overview?.confidence || 0}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    📊 <strong>Xem biểu đồ chi tiết</strong> theo giờ và theo tuần ở phần <strong>"AI Detailed Analytics"</strong> bên dưới
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Station AI Detail Modal */}
      {selectedStation && (
        <StationAIDetailModal
          isOpen={!!selectedStation}
          onClose={() => setSelectedStation(null)}
          stationId={selectedStation.id}
          stationName={selectedStation.name}
        />
      )}
    </div>
  );
}

