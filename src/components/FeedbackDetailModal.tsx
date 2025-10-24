import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ThumbsUp, 
  AlertCircle, 
  User, 
  Calendar, 
  Star,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Feedback, FeedbackStatus } from './service/type/feedbackTypes';
import FeedbackService from './service/feedbackService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface FeedbackDetailModalProps {
  feedback: Feedback | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function FeedbackDetailModal({ feedback: initialFeedback, isOpen, onClose, onUpdate }: FeedbackDetailModalProps) {
  useDisableBodyScroll(isOpen);
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback);
  const [isResolving, setIsResolving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [response, setResponse] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Update local feedback when prop changes
  useEffect(() => {
    setFeedback(initialFeedback);
    setResponse('');
    setShowResolveForm(false);
  }, [initialFeedback, isOpen]);

  // Fetch fresh feedback data
  const handleRefreshFeedback = async () => {
    if (!feedback?._id) return;
    
    try {
      setIsRefreshing(true);
      const response = await FeedbackService.getFeedbackById(feedback._id);
      setFeedback(response.data);
      showToast.success('Đã làm mới dữ liệu');
    } catch (error: any) {
      showToast.error(error.message || 'Không thể làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!feedback) return null;

  const isComplaint = feedback.type === 'complaint';
  const canResolve = isComplaint && feedback.status === 'pending';

  const handleResolve = async () => {
    if (!response.trim()) {
      showToast.error('Vui lòng nhập phản hồi');
      return;
    }

    if (!feedback?._id) {
      showToast.error('Không tìm thấy thông tin feedback');
      return;
    }

    try {
      setIsResolving(true);
      const result = await FeedbackService.updateFeedbackStatus(feedback._id, {
        status: 'resolved',
        response: response.trim()
      });
      
      // Update local feedback with resolved data
      setFeedback(result.data);
      setShowResolveForm(false);
      setResponse('');
      
      showToast.success('Đã giải quyết khiếu nại thành công');
      onUpdate(); // Refresh parent list
    } catch (error: any) {
      console.error('Error resolving feedback:', error);
      showToast.error(error.message || 'Không thể giải quyết khiếu nại');
    } finally {
      setIsResolving(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    vehicle: 'Xe',
    staff: 'Nhân viên',
    payment: 'Thanh toán',
    service: 'Dịch vụ',
    other: 'Khác'
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isComplaint ? (
                      <div className="p-2 bg-white/20 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="p-2 bg-white/20 rounded-lg">
                        <ThumbsUp className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isComplaint ? 'Chi tiết khiếu nại' : 'Chi tiết đánh giá'}
                      </h2>
                      <p className="text-sm text-white/80 mt-0.5">
                        ID: {feedback._id.substring(0, 12)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshFeedback}
                      disabled={isRefreshing}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Làm mới"
                      aria-label="Làm mới"
                    >
                      <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Đóng"
                      aria-label="Đóng"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Status & Type */}
                  <div className="flex gap-3">
                    <Badge variant={isComplaint ? 'warning' : 'default'} className="text-sm">
                      {isComplaint ? (
                        <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Khiếu nại</>
                      ) : (
                        <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Đánh giá</>
                      )}
                    </Badge>
                    {isComplaint && (
                      <Badge variant={feedback.status === 'resolved' ? 'success' : 'warning'}>
                        {feedback.status === 'resolved' ? (
                          <><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Đã giải quyết</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5 mr-1.5" /> Chờ xử lý</>
                        )}
                      </Badge>
                    )}
                    {isComplaint && feedback.category && (
                      <Badge variant="outline">
                        {categoryLabels[feedback.category] || feedback.category}
                      </Badge>
                    )}
                  </div>

                  {/* Main Content */}
                  {isComplaint ? (
                    <>
                      {/* Complaint Title & Description */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Tiêu đề
                          </h3>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {feedback.title}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Mô tả chi tiết
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {feedback.description}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Rating Details */}
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                          Chi tiết đánh giá
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {feedback.overall_rating && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tổng thể</p>
                              <div className="flex items-center gap-2">
                                {renderRatingStars(feedback.overall_rating)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.overall_rating}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {feedback.staff_service && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dịch vụ nhân viên</p>
                              <div className="flex items-center gap-2">
                                {renderRatingStars(feedback.staff_service)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.staff_service}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {feedback.vehicle_condition && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tình trạng xe</p>
                              <div className="flex items-center gap-2">
                                {renderRatingStars(feedback.vehicle_condition)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.vehicle_condition}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {feedback.station_cleanliness && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Vệ sinh trạm</p>
                              <div className="flex items-center gap-2">
                                {renderRatingStars(feedback.station_cleanliness)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.station_cleanliness}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {feedback.checkout_process && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quy trình thuê xe</p>
                              <div className="flex items-center gap-2">
                                {renderRatingStars(feedback.checkout_process)}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {feedback.checkout_process}/5
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comment */}
                      {feedback.comment && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nhận xét
                              </h3>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {feedback.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Images */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Hình ảnh đính kèm ({feedback.images.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {feedback.images.map((image, index) => (
                          <a
                            key={index}
                            href={image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden group"
                          >
                            <img
                              src={image}
                              alt={`Ảnh ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-sm font-medium">Xem ảnh</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Thông tin bổ sung
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {feedback.user_id && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Khách hàng</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {feedback.user_id.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.rental_id && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Đơn thuê</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {feedback.rental_id.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.staff_id && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Nhân viên</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {feedback.staff_id.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.staff_ids && feedback.staff_ids.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Nhân viên liên quan ({feedback.staff_ids.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {feedback.staff_ids.map((staffId, index) => (
                              <span 
                                key={index}
                                className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white"
                              >
                                {staffId.substring(0, 8)}...
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {feedback.resolved_by && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giải quyết bởi</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {feedback.resolved_by.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Trạng thái hoạt động</p>
                        <Badge variant={feedback.is_active ? 'success' : 'outline'}>
                          {feedback.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày tạo</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(feedback.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cập nhật lần cuối</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(feedback.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {/* Response (if resolved) */}
                  {isComplaint && feedback.status === 'resolved' && feedback.response && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                            Phản hồi từ quản trị viên
                          </h3>
                          <p className="text-green-800 dark:text-green-200 leading-relaxed">
                            {feedback.response}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resolve Form */}
                  {canResolve && showResolveForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                    >
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                        Giải quyết khiếu nại
                      </h3>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Nhập phản hồi của bạn..."
                        className="w-full px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Đóng
                  </Button>
                  {canResolve && !showResolveForm && (
                    <Button
                      onClick={() => setShowResolveForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Giải quyết khiếu nại
                    </Button>
                  )}
                  {canResolve && showResolveForm && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowResolveForm(false);
                          setResponse('');
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleResolve}
                        disabled={isResolving || !response.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isResolving ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Xác nhận giải quyết
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

