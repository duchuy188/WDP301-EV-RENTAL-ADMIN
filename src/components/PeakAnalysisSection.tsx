import { useState, useEffect } from 'react';
import { analyticsService } from './service/analyticsService';
import { PeakAnalysisData, PEAK_ANALYSIS_PERIOD_LABELS, PEAK_ANALYSIS_TYPE_LABELS } from './service/type/analyticsTypes';
import { Clock, TrendingUp, TrendingDown, Calendar, Activity, Filter } from 'lucide-react';

interface PeakAnalysisSectionProps {
  stationId?: string;
  className?: string;
}

const PeakAnalysisSection: React.FC<PeakAnalysisSectionProps> = ({ stationId, className = '' }) => {
  const [peakData, setPeakData] = useState<PeakAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'hours' | 'days' | 'both'>('both');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadPeakAnalysis();
  }, [selectedType, selectedPeriod, stationId]);

  const loadPeakAnalysis = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getPeakAnalysis({
        type: selectedType,
        period: selectedPeriod,
        station_id: stationId
      });
      setPeakData(data);
    } catch (error) {
      console.error('Error loading peak analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-xl"></div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!peakData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Không có dữ liệu phân tích</p>
      </div>
    );
  }

  const { peak_hours, peak_days } = peakData;

  // Determine which sections to show based on selected type
  const showHours = selectedType === 'both' || selectedType === 'hours';
  const showDays = selectedType === 'both' || selectedType === 'days';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-7 h-7 text-blue-600" />
          Thống Kê Cao Điểm
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Filter */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {PEAK_ANALYSIS_PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`grid grid-cols-1 gap-6 ${showHours && showDays ? 'lg:grid-cols-2' : ''}`}>
        {/* Peak Hours Analysis */}
        {showHours && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Giờ Cao Điểm</h3>
              <p className="text-sm text-gray-500">Phân tích theo 24 giờ trong ngày</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium mb-1">Tổng đặt xe</p>
              <p className="text-2xl font-bold text-green-700">
                {formatNumber(peak_hours.summary.total_bookings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                TB: {peak_hours.summary.avg_bookings_per_hour.toFixed(1)}/giờ
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium mb-1">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(peak_hours.summary.total_revenue)}
              </p>
            </div>
          </div>

          {/* Top 3 Peak Hours */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Top 3 Giờ Cao Điểm
            </h4>
            {peak_hours.top_3.map((hour, index) => (
              <div
                key={hour.hour}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{hour.time_range}</p>
                    <p className="text-sm text-gray-500">{formatNumber(hour.bookings)} đặt xe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">{formatCurrency(hour.revenue)}</p>
                  <p className="text-xs text-gray-500">
                    TB: {formatCurrency(hour.avg_booking_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 3 Low Hours */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              Top 3 Giờ Thấp Điểm
            </h4>
            {peak_hours.bottom_3.map((hour, index) => (
              <div
                key={hour.hour}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{hour.time_range}</p>
                    <p className="text-sm text-gray-500">{formatNumber(hour.bookings)} đặt xe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-700">{formatCurrency(hour.revenue)}</p>
                  <p className="text-xs text-gray-500">
                    {hour.avg_booking_value > 0 ? `TB: ${formatCurrency(hour.avg_booking_value)}` : 'Không có'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Peak Days Analysis */}
        {showDays && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Ngày Cao Điểm</h3>
              <p className="text-sm text-gray-500">Phân tích theo 7 ngày trong tuần</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium mb-1">Tổng đặt xe</p>
              <p className="text-2xl font-bold text-green-700">
                {formatNumber(peak_days.summary.total_bookings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                TB: {peak_days.summary.avg_bookings_per_day.toFixed(1)}/ngày
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-medium mb-1">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(peak_days.summary.total_revenue)}
              </p>
            </div>
          </div>

          {/* Top 3 Peak Days */}
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Top 3 Ngày Cao Điểm
            </h4>
            {peak_days.top_3.map((day, index) => (
              <div
                key={day.day}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{day.day_name}</p>
                    <p className="text-sm text-gray-500">{formatNumber(day.bookings)} đặt xe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">{formatCurrency(day.revenue)}</p>
                  <p className="text-xs text-gray-500">
                    TB: {formatCurrency(day.avg_booking_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom 3 Low Days */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              Top 3 Ngày Thấp Điểm
            </h4>
            {peak_days.bottom_3.map((day, index) => (
              <div
                key={day.day}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{day.day_name}</p>
                    <p className="text-sm text-gray-500">{formatNumber(day.bookings)} đặt xe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-700">{formatCurrency(day.revenue)}</p>
                  <p className="text-xs text-gray-500">
                    {day.avg_booking_value > 0 ? `TB: ${formatCurrency(day.avg_booking_value)}` : 'Không có'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Insights Section */}
      {(showHours || showDays) && (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Thông Tin Chi Tiết
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showHours && (
            <>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Giờ đông nhất</p>
                <p className="text-xl font-bold text-blue-600">
                  {peak_hours.summary.busiest_hour}:00 - {peak_hours.summary.busiest_hour + 1}:00
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(peak_hours.summary.peak_bookings)} đặt xe
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Giờ vắng nhất</p>
                <p className="text-xl font-bold text-orange-600">
                  {peak_hours.summary.quietest_hour}:00 - {peak_hours.summary.quietest_hour + 1}:00
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(peak_hours.summary.low_bookings)} đặt xe
                </p>
              </div>
            </>
          )}
          {showDays && (
            <>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Ngày đông nhất</p>
                <p className="text-xl font-bold text-purple-600">
                  {peak_days.summary.busiest_day}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(peak_days.summary.peak_bookings)} đặt xe
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Ngày vắng nhất</p>
                <p className="text-xl font-bold text-orange-600">
                  {peak_days.summary.quietest_day}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNumber(peak_days.summary.low_bookings)} đặt xe
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default PeakAnalysisSection;

