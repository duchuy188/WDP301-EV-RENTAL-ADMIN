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
  Loader2,
  Trash2
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [response, setResponse] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Helper function to extract ID from string or object
  const extractId = (value: string | { _id: string; [key: string]: any } | undefined): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return String(value);
  };

  // Update local feedback when prop changes
  useEffect(() => {
    setFeedback(initialFeedback);
    setResponse('');
    setShowResolveForm(false);
    setShowDeleteConfirm(false);
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
      const result = await FeedbackService.updateFeedback(feedback._id, {
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

  const handleDelete = async () => {
    if (!feedback?._id) {
      showToast.error('Không tìm thấy thông tin feedback');
      return;
    }

    try {
      setIsDeleting(true);
      await FeedbackService.deleteFeedback(feedback._id);
      
      showToast.success('Đã xóa feedback thành công');
      onUpdate(); // Refresh parent list
      onClose(); // Close modal
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      showToast.error(error.message || 'Không thể xóa feedback');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      {isComplaint ? (
                        <AlertCircle className="h-6 w-6 text-white" />
                      ) : (
                        <ThumbsUp className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {isComplaint ? 'Chi tiết khiếu nại' : 'Chi tiết đánh giá'}
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        {feedback.type === 'complaint' ? 'Khiếu nại' : 'Đánh giá'} từ khách hàng
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshFeedback}
                      disabled={isRefreshing}
                      className="h-9 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      title="Làm mới"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </Button>
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
                      {feedback.user_id && extractId(feedback.user_id) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Khách hàng</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {extractId(feedback.user_id)!.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.rental_id && extractId(feedback.rental_id) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Đơn thuê</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {extractId(feedback.rental_id)!.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.staff_id && extractId(feedback.staff_id) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Nhân viên</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {extractId(feedback.staff_id)!.substring(0, 12)}...
                          </p>
                        </div>
                      )}
                      {feedback.staff_ids && feedback.staff_ids.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Nhân viên liên quan ({feedback.staff_ids.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {feedback.staff_ids.map((staffId, index) => {
                              const id = extractId(staffId);
                              return id ? (
                                <span 
                                  key={index}
                                  className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white"
                                >
                                  {id.substring(0, 8)}...
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      {feedback.resolved_by && extractId(feedback.resolved_by) && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Giải quyết bởi</p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                            {extractId(feedback.resolved_by)!.substring(0, 12)}...
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
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                          Xác nhận xóa feedback
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Bạn có chắc chắn muốn xóa feedback này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Đang xóa...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Xác nhận xóa
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between gap-3">
                  <div>
                    {!showDeleteConfirm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="px-6 py-3 h-12 border-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa feedback
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {!showResolveForm && (
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Đóng
                      </Button>
                    )}
                    {canResolve && !showResolveForm && (
                      <Button
                        onClick={() => setShowResolveForm(true)}
                        className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
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
                          className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleResolve}
                          disabled={isResolving || !response.trim()}
                          className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isResolving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5 mr-2" />
                              Xác nhận giải quyết
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

