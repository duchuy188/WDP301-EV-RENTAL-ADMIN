import { useState, useEffect } from 'react';
import { analyticsService } from './service/analyticsService';
import { 
  StaffPerformanceData, 
  StaffPerformanceItem,
  STAFF_PERIOD_LABELS 
} from './service/type/analyticsTypes';
import { StationSimple } from './service/type/stationTypes';
import { 
  Users, 
  TrendingUp, 
  Award, 
  MapPin, 
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  ThumbsUp,
  Filter,
  Eye
} from 'lucide-react';
import stationService from './service/stationService';
import StaffPerformanceDetailModal from './StaffPerformanceDetailModal';

interface StaffPerformanceSectionProps {
  className?: string;
}

const StaffPerformanceSection: React.FC<StaffPerformanceSectionProps> = ({ className = '' }) => {
  const [performanceData, setPerformanceData] = useState<StaffPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [stations, setStations] = useState<StationSimple[]>([]);
  
  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    loadStaffPerformance();
  }, [selectedPeriod, selectedStation]);

  const loadStations = async () => {
    try {
      // Use getStations with large limit to get all stations
      const response = await stationService.getStations({ 
        page: 1, 
        limit: 100 
      });
      
      if (response.success && response.data?.stations) {
        // Map to StationSimple format
        const simpleStations: StationSimple[] = response.data.stations.map(station => ({
          _id: station._id,
          code: station.stationCode,
          name: station.stationName
        }));
        setStations(simpleStations);
      }
    } catch (error) {
      console.error('Error loading stations:', error);
      setStations([]);
    }
  };

  const loadStaffPerformance = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getStaffPerformance({
        period: selectedPeriod,
        station_id: selectedStation || undefined
      });
      setPerformanceData(data);
    } catch (error) {
      console.error('Error loading staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getPerformanceBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 85) return 'Xuất sắc';
    if (score >= 70) return 'Tốt';
    if (score >= 50) return 'Trung bình';
    return 'Cần cải thiện';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Không có dữ liệu hiệu suất nhân viên</p>
      </div>
    );
  }

  const { staff_performance, summary } = performanceData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-purple-600" />
          Hiệu Suất Nhân Viên
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Station Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="px-4 py-2 rounded-lg font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              aria-label="Chọn trạm"
            >
              <option value="">Tất cả trạm</option>
              {stations
                .filter((station) => station && station._id && station.name)
                .map((station) => (
                  <option key={station._id} value={station._id}>
                    {station.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', '1y'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {STAFF_PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{summary?.total_staff || 0}</p>
          <p className="text-purple-100 text-sm">Tổng nhân viên</p>
        </div>

        {/* Average Score */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{(summary?.avg_performance_score || 0).toFixed(1)}</p>
          <p className="text-blue-100 text-sm">Điểm TB</p>
        </div>

        {/* Top Performer */}
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <Award className="w-10 h-10" />
            <div className="flex-1">
              <p className="text-sm text-yellow-100 mb-1">Nhân viên xuất sắc nhất</p>
              {summary?.top_performer && summary.top_performer.staff_name ? (
                <>
                  <p className="font-bold text-lg">{summary.top_performer.staff_name}</p>
                  <p className="text-sm text-yellow-100">
                    Điểm: {summary.top_performer.performance_score?.toFixed(1) || 'N/A'}
                  </p>
                </>
              ) : (
                <p className="text-sm">Chưa có dữ liệu</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      {!staff_performance || staff_performance.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">Không có dữ liệu nhân viên</p>
          <p className="text-gray-400 text-sm">
            Thử thay đổi bộ lọc hoặc khoảng thời gian để xem dữ liệu
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {staff_performance
            .filter((staff) => staff && staff.staff_id)
            .map((staff: StaffPerformanceItem) => (
            <div
              key={staff.staff_id}
              className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all hover:shadow-lg ${getPerformanceColor(staff.performance_score)}`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Staff Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {staff.staff_name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{staff.staff_email}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{staff.station?.name || 'Chưa có trạm'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getPerformanceBadgeColor(staff.performance_score)} text-white font-bold`}>
                        <Star className="w-4 h-4" />
                        {staff.performance_score.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {getPerformanceLabel(staff.performance_score)}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Rental Stats */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Thuê xe</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 mb-1">
                        {staff.rental_stats?.total_rentals || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        Giao: {staff.rental_stats?.pickup_count || 0} | Trả: {staff.rental_stats?.return_count || 0}
                      </p>
                    </div>

                    {/* Feedback Stats */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">Đánh giá</p>
                      </div>
                      <p className="text-2xl font-bold text-green-700 mb-1">
                        {(staff.feedback_stats?.avg_overall_rating || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {staff.feedback_stats?.total_ratings || 0} lượt
                      </p>
                    </div>

                    {/* Complaint Stats - Resolved */}
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-xs text-yellow-600 font-medium">Khiếu nại</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700 mb-1">
                        {staff.complaint_stats?.total_complaints || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        Giải quyết: {formatPercentage(staff.complaint_stats?.resolution_rate || 0)}
                      </p>
                    </div>

                    {/* Service Rating */}
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-purple-600" />
                        <p className="text-xs text-purple-600 font-medium">Dịch vụ</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 mb-1">
                        {(staff.feedback_stats?.avg_staff_service || 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Điểm phục vụ
                      </p>
                    </div>
                  </div>

                  {/* Detailed Ratings */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Chi tiết đánh giá:</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Xe</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <p className="text-sm font-semibold">{(staff.feedback_stats?.avg_vehicle_condition || 0).toFixed(1)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trạm</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <p className="text-sm font-semibold">{(staff.feedback_stats?.avg_station_cleanliness || 0).toFixed(1)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quy trình</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <p className="text-sm font-semibold">{(staff.feedback_stats?.avg_checkout_process || 0).toFixed(1)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tổng thể</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <p className="text-sm font-semibold">{(staff.feedback_stats?.avg_overall_rating || 0).toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View Detail Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedStaff({
                          id: staff.staff_id,
                          name: staff.staff_name
                        });
                        setShowDetailModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <Eye className="w-5 h-5" />
                      Xem chi tiết hiệu suất
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Date Range Info */}
      {summary?.date_range?.start && summary?.date_range?.end && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Kỳ báo cáo: {new Date(summary.date_range.start).toLocaleDateString('vi-VN')} - {new Date(summary.date_range.end).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      )}

      {/* Staff Performance Detail Modal */}
      {selectedStaff && (
        <StaffPerformanceDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStaff(null);
          }}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          period={selectedPeriod}
        />
      )}
    </div>
  );
};

export default StaffPerformanceSection;

