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
  Trash2,
  Tag,
  UserCheck,
  Phone,
  Mail,
  Car
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Feedback } from './service/type/feedbackTypes';
import FeedbackService from './service/feedbackService';
import { UserService } from './service/userService';
import RentalService from './service/rentalService';
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
  
  // Image modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Additional details
  const [userDetails, setUserDetails] = useState<any>(null);
  const [rentalDetails, setRentalDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
    
    // Reset details when closing
    if (!isOpen) {
      setUserDetails(null);
      setRentalDetails(null);
    }
  }, [initialFeedback, isOpen]);

  // Fetch additional details when feedback changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!feedback || !isOpen) return;
      
      try {
        setLoadingDetails(true);
        
        // Fetch user details
        const userId = extractId(feedback.user_id);
        if (userId) {
          try {
            const userData = await UserService.getUserById(userId);
            setUserDetails(userData);
          } catch (error) {
            console.error('Error fetching user details:', error);
          }
        }
        
        // Fetch rental details
        const rentalId = extractId(feedback.rental_id);
        if (rentalId) {
          try {
            const rentalData = await RentalService.getRentalById(rentalId);
            setRentalDetails(rentalData);
          } catch (error) {
            console.error('Error fetching rental details:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };
    
    fetchDetails();
  }, [feedback, isOpen]);

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

  const categoryLabels: Record<string, { label: string; color: string; icon: string }> = {
    vehicle: { label: 'Xe', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🚗' },
    staff: { label: 'Nhân viên', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '👤' },
    payment: { label: 'Thanh toán', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '💳' },
    service: { label: 'Dịch vụ', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🛠️' },
    other: { label: 'Khác', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: '📋' }
  };

  const renderRatingStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className={`relative ${
                isComplaint 
                  ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500' 
                  : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
              } px-8 py-6`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                
                <div className="relative flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
                      {isComplaint ? (
                        <AlertCircle className="h-7 w-7 text-white drop-shadow-lg" />
                      ) : (
                        <ThumbsUp className="h-7 w-7 text-white drop-shadow-lg" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                          {isComplaint ? '⚠️ Chi tiết khiếu nại' : '⭐ Chi tiết đánh giá'}
                      </h2>
                        {isComplaint && (
                          <Badge 
                            variant={feedback.status === 'resolved' ? 'success' : 'warning'}
                            className="shadow-md"
                          >
                            {feedback.status === 'resolved' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Đã giải quyết</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" /> Chờ xử lý</>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/90 text-sm font-medium drop-shadow">
                        {isComplaint ? 'Phản hồi khiếu nại từ khách hàng' : 'Cảm nhận và đánh giá chất lượng dịch vụ'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshFeedback}
                      disabled={isRefreshing}
                      className="h-10 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 shadow-lg"
                      title="Làm mới"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full border border-white/30 shadow-lg"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-6">
                  {/* Type & Category Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={isComplaint ? 'warning' : 'default'} 
                      className="text-sm px-3 py-1.5 shadow-sm"
                    >
                      {isComplaint ? (
                        <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Khiếu nại</>
                      ) : (
                        <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Đánh giá</>
                      )}
                    </Badge>
                    {isComplaint && feedback.category && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${
                        categoryLabels[feedback.category]?.color || categoryLabels.other.color
                      }`}>
                        <span>{categoryLabels[feedback.category]?.icon || '📋'}</span>
                        {categoryLabels[feedback.category]?.label || feedback.category}
                      </span>
                    )}
                    {!isComplaint && feedback.overall_rating && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {feedback.overall_rating}/5
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Main Content Card */}
                  {isComplaint ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-red-100 dark:border-red-900/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
                          {feedback.title}
                          </h3>
                        </div>
                      <div className="p-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                            {feedback.description}
                          </p>
                        </div>
                      </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                          Đánh giá chi tiết
                        </h3>
                      </div>
                      <div className="p-6">
                         <div className="space-y-4">
                           {/* Row 1: 3 cards */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {feedback.overall_rating && (
                               <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-800/30 dark:to-orange-800/30 p-6 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 shadow-lg">
                                 <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 whitespace-nowrap">Đánh giá tổng thể</p>
                                 <div className="flex items-center gap-3 mb-2">
                                   {renderRatingStars(feedback.overall_rating, 'lg')}
                                 </div>
                                 <p className="text-4xl font-bold text-gray-900 dark:text-white">
                                   {feedback.overall_rating % 1 === 0 ? feedback.overall_rating : feedback.overall_rating.toFixed(1)}<span className="text-2xl text-gray-500">/5</span>
                                 </p>
                               </div>
                             )}
                             {feedback.staff_service && (
                               <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Dịch vụ nhân viên</p>
                                 <div className="flex items-center gap-3 mb-2">
                                   {renderRatingStars(feedback.staff_service)}
                                   <span className="text-lg font-bold text-gray-900 dark:text-white">
                                     {feedback.staff_service % 1 === 0 ? feedback.staff_service : feedback.staff_service.toFixed(1)}/5
                                   </span>
                                 </div>
                               </div>
                             )}
                             {feedback.vehicle_condition && (
                               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Tình trạng xe</p>
                                 <div className="flex items-center gap-3 mb-2">
                                   {renderRatingStars(feedback.vehicle_condition)}
                                   <span className="text-lg font-bold text-gray-900 dark:text-white">
                                     {feedback.vehicle_condition % 1 === 0 ? feedback.vehicle_condition : feedback.vehicle_condition.toFixed(1)}/5
                                   </span>
                                 </div>
                               </div>
                             )}
                           </div>
                           
                           {/* Row 2: 2 cards centered */}
                           <div className="flex justify-center">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                               {feedback.station_cleanliness && (
                                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 whitespace-nowrap">Vệ sinh trạm</p>
                                   <div className="flex items-center gap-3 mb-2">
                                     {renderRatingStars(feedback.station_cleanliness)}
                                     <span className="text-lg font-bold text-gray-900 dark:text-white">
                                       {feedback.station_cleanliness % 1 === 0 ? feedback.station_cleanliness : feedback.station_cleanliness.toFixed(1)}/5
                                     </span>
                                   </div>
                                 </div>
                               )}
                               {feedback.checkout_process && (
                                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 whitespace-nowrap">Quy trình thuê xe</p>
                                   <div className="flex items-center gap-3 mb-2">
                                     {renderRatingStars(feedback.checkout_process)}
                                     <span className="text-lg font-bold text-gray-900 dark:text-white">
                                       {feedback.checkout_process % 1 === 0 ? feedback.checkout_process : feedback.checkout_process.toFixed(1)}/5
                                     </span>
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>

                      {/* Comment */}
                      {feedback.comment && (
                          <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start gap-3">
                              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Nhận xét từ khách hàng
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {feedback.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {feedback.images && feedback.images.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Hình ảnh đính kèm
                          <span className="text-sm font-normal text-gray-500">({feedback.images.length})</span>
                      </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {feedback.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedImage(image);
                              setShowImageModal(true);
                            }}
                            type="button"
                              className="relative aspect-square rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all cursor-pointer"
                          >
                            <img
                              src={image}
                              alt={`Ảnh ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                              <span className="text-white text-sm font-medium">Xem ảnh</span>
                            </div>
                          </button>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Response (if resolved) */}
                  {isComplaint && feedback.status === 'resolved' && feedback.response && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-sm border-2 border-green-200 dark:border-green-800 overflow-hidden">
                      <div className="px-6 py-4 bg-green-100 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
                        <h3 className="text-base font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Phản hồi từ quản trị viên
                    </h3>
                      </div>
                      <div className="p-6">
                        <p className="text-green-800 dark:text-green-200 leading-relaxed whitespace-pre-wrap">
                          {feedback.response}
                        </p>
                      </div>
                        </div>
                      )}

                  {/* Resolve Form */}
                  {canResolve && showResolveForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
                    >
                      <div className="px-6 py-4 bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
                        <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Giải quyết khiếu nại
                        </h3>
                      </div>
                      <div className="p-6">
                        <textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Nhập phản hồi của bạn để giải quyết khiếu nại này..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                          rows={5}
                        />
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          * Phản hồi này sẽ được gửi đến khách hàng và lưu vào hệ thống
                          </p>
                        </div>
                    </motion.div>
                  )}

                  {/* Customer Information */}
                  {userDetails && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Thông tin khách hàng
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Tên khách hàng</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {userDetails?.user?.fullname || 
                                 userDetails?.data?.user?.fullname ||
                                 userDetails?.fullname || 
                                 userDetails?.data?.fullname ||
                                 userDetails?.user?.name || 
                                 userDetails?.name ||
                                 (typeof feedback.user_id === 'object' ? feedback.user_id?.fullname : null) ||
                                 (typeof feedback.user_id === 'object' ? feedback.user_id?.name : null) ||
                                 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                              <Mail className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {userDetails?.user?.email || 
                                 userDetails?.data?.user?.email || 
                                 userDetails?.email || 
                                 userDetails?.data?.email ||
                                 (typeof feedback.user_id === 'object' ? feedback.user_id?.email : null) ||
                                 'N/A'}
                          </p>
                        </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                              <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Số điện thoại</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {userDetails?.user?.phone || 
                                 userDetails?.data?.user?.phone || 
                                 userDetails?.phone || 
                                 userDetails?.data?.phone ||
                                 (typeof feedback.user_id === 'object' ? feedback.user_id?.phone : null) ||
                                 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                          </div>
                        </div>
                      )}

                  {/* Rental Information */}
                  {rentalDetails && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-900/30">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
                          Thông tin đơn thuê
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {/* Thông tin xe */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Car className="w-4 h-4 text-green-600" />
                              Thông tin xe
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tên xe</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {rentalDetails?.data?.vehicle_id?.name ||
                                     rentalDetails?.vehicle_id?.name ||
                                     'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Model</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {rentalDetails?.data?.vehicle_id?.model ||
                                     rentalDetails?.vehicle_id?.model ||
                                     'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Biển số</p>
                                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                                    {rentalDetails?.data?.vehicle_id?.license_plate ||
                                     rentalDetails?.vehicle_id?.license_plate ||
                                     'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                          {/* Thông tin thuê */}
                    <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              Chi tiết đơn thuê
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Trạm</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {rentalDetails?.data?.station_id?.name ||
                                     rentalDetails?.station_id?.name ||
                                     'N/A'}
                      </p>
                    </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Ngày thuê</p>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {(() => {
                                      const startTime = rentalDetails?.data?.actual_start_time ||
                                                       rentalDetails?.actual_start_time;
                                      return startTime ? new Date(startTime).toLocaleString('vi-VN') : 'N/A';
                                    })()}
                      </p>
                    </div>
                  </div>
                              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tổng tiền</p>
                                  <p className="text-base font-bold text-gray-900 dark:text-white">
                                    {(() => {
                                      const totalPrice = rentalDetails?.data?.booking_id?.total_price ||
                                                        rentalDetails?.booking_id?.total_price;
                                      const lateFee = rentalDetails?.data?.late_fee || 0;
                                      const damageFee = rentalDetails?.data?.damage_fee || 0;
                                      const otherFees = rentalDetails?.data?.other_fees || 0;
                                      
                                      const grandTotal = totalPrice ? (totalPrice + lateFee + damageFee + otherFees) : 
                                                        (rentalDetails?.data?.total_fees || 
                                                         rentalDetails?.data?.total_cost ||
                                                         rentalDetails?.total_cost);
                                      
                                      return grandTotal ? `${grandTotal.toLocaleString('vi-VN')} ₫` : 'N/A';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Thông tin nhân viên phục vụ */}
                          {(rentalDetails?.data?.pickup_staff_id || rentalDetails?.data?.return_staff_id) && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-600" />
                                Nhân viên phục vụ
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {rentalDetails?.data?.pickup_staff_id && (
                                  <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">NV Giao xe</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {rentalDetails?.data?.pickup_staff_id?.fullname || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {rentalDetails?.data?.return_staff_id && (
                                  <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">NV Nhận xe</p>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {rentalDetails?.data?.return_staff_id?.fullname || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Loading State */}
                  {loadingDetails && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải thông tin chi tiết...</p>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ngày tạo feedback</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {new Date(feedback.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-8 py-5">
                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                          ⚠️ Xác nhận xóa feedback
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          Bạn có chắc chắn muốn xóa feedback này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="border-2"
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 shadow-md"
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

                <div className="flex justify-between items-center gap-4">
                  <div>
                    {!showDeleteConfirm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="px-5 py-2.5 h-11 border-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
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
                        className="px-6 py-2.5 h-11 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Đóng
                      </Button>
                    )}
                    {canResolve && !showResolveForm && (
                      <Button
                        onClick={() => setShowResolveForm(true)}
                        className="px-8 py-2.5 h-11 min-w-[180px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
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
                          className="px-6 py-2.5 h-11 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleResolve}
                          disabled={isResolving || !response.trim()}
                          className="px-8 py-2.5 h-11 min-w-[180px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                        >
                          {isResolving ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            onClick={() => {
              setShowImageModal(false);
              setSelectedImage(null);
            }}
          >
            <button
              onClick={() => {
                setShowImageModal(false);
                setSelectedImage(null);
              }}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
