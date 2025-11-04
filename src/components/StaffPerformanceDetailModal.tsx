import { useState, useEffect } from 'react';
import { X, User, Star, TrendingUp, Activity, Clock, Package, MessageSquare } from 'lucide-react';
import { analyticsService } from './service/analyticsService';
import { StaffPerformanceDetailData, STAFF_PERIOD_LABELS } from './service/type/analyticsTypes';
import { formatCurrency, formatDate } from '@/utils/dateUtils';

interface StaffPerformanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  period?: '7d' | '30d' | '90d' | '1y';
}

const StaffPerformanceDetailModal: React.FC<StaffPerformanceDetailModalProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName,
  period = '30d'
}) => {
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<StaffPerformanceDetailData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>(period);

  useEffect(() => {
    if (isOpen && staffId) {
      loadStaffDetail();
    }
  }, [isOpen, staffId, selectedPeriod]);

  const loadStaffDetail = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getStaffPerformanceDetail({
        staffId,
        period: selectedPeriod
      });
      setDetailData(data);
    } catch (error) {
      console.error('Error loading staff detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-full">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Chi Tiết Hiệu Suất</h2>
                <p className="text-purple-100">{staffName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Đóng modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex gap-2 mt-4">
            {(['7d', '30d', '90d', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === p
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {STAFF_PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : !detailData ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Staff Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">Thông tin nhân viên</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tên</p>
                    <p className="font-semibold">{detailData.staff.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{detailData.staff.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Trạm</p>
                    <p className="font-semibold">{detailData.staff.station?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Điểm hiệu suất</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {detailData.performance_score.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rental Stats */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Thống kê thuê xe</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng</span>
                      <span className="font-bold text-blue-700">
                        {detailData.rental_stats.total_rentals}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Giao xe</span>
                      <span className="font-semibold">
                        {detailData.rental_stats.pickup_count}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Trả xe</span>
                      <span className="font-semibold">
                        {detailData.rental_stats.return_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback Stats */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-900">Đánh giá</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng</span>
                      <span className="font-bold text-green-700">
                        {detailData.feedback_stats.total_ratings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Điểm TB</span>
                      <span className="font-semibold">
                        {detailData.feedback_stats.avg_overall_rating.toFixed(1)} ⭐
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dịch vụ</span>
                      <span className="font-semibold">
                        {detailData.feedback_stats.avg_staff_service.toFixed(1)} ⭐
                      </span>
                    </div>
                  </div>
                </div>

                {/* Complaint Stats */}
                <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-bold text-yellow-900">Khiếu nại</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tổng</span>
                      <span className="font-bold text-yellow-700">
                        {detailData.complaint_stats.total_complaints}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Đã giải quyết</span>
                      <span className="font-semibold">
                        {detailData.complaint_stats.resolved_complaints}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tỷ lệ</span>
                      <span className="font-semibold">
                        {detailData.complaint_stats.resolution_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Details */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-lg">Chi tiết thuê xe</h3>
                    <span className="text-sm text-gray-500">
                      ({detailData.rental_details.length} thuê xe)
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {detailData.rental_details.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Không có dữ liệu thuê xe
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Xe
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Khách hàng
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Thời gian
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Vai trò
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Số tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {detailData.rental_details.map((rental) => (
                          <tr key={rental.rental_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-sm">{rental.license_plate}</p>
                                <p className="text-xs text-gray-500">{rental.vehicle_name}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-sm">{rental.customer_name}</p>
                                <p className="text-xs text-gray-500">{rental.customer_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p>{formatDate(rental.actual_start_time)}</p>
                                {rental.actual_end_time && (
                                  <p className="text-xs text-gray-500">
                                    → {formatDate(rental.actual_end_time)}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {rental.is_pickup && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                    Giao
                                  </span>
                                )}
                                {rental.is_return && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                    Trả
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-sm">
                              {formatCurrency(rental.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Feedback Details */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-bold text-lg">Chi tiết đánh giá</h3>
                    <span className="text-sm text-gray-500">
                      ({detailData.feedback_details.length} đánh giá)
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {detailData.feedback_details.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      Không có đánh giá
                    </div>
                  ) : (
                    detailData.feedback_details.map((feedback) => (
                      <div
                        key={feedback._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{feedback.title}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(feedback.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              feedback.type === 'compliment'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {feedback.type === 'compliment' ? 'Khen ngợi' : 'Khiếu nại'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{feedback.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Tổng thể</p>
                            <p className="font-bold text-yellow-600">
                              ⭐ {feedback.overall_rating}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Dịch vụ</p>
                            <p className="font-semibold">⭐ {feedback.staff_service}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Xe</p>
                            <p className="font-semibold">⭐ {feedback.vehicle_condition}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Trạm</p>
                            <p className="font-semibold">⭐ {feedback.station_cleanliness}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Quy trình</p>
                            <p className="font-semibold">⭐ {feedback.checkout_process}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Kỳ báo cáo: {formatDate(detailData.date_range.start)} -{' '}
                  {formatDate(detailData.date_range.end)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPerformanceDetailModal;

