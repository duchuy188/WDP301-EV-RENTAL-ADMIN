import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle, 
  Shield, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  XCircle,
  RotateCcw,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserService } from './service/userService';
import { 
  RiskyCustomerDetailResponse
} from './service/type/userTypes';
import { formatDate } from '../utils/dateUtils';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface RiskyCustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onUpdate?: () => void;
}

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'critical': return 'Nghiêm trọng';
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return level;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSeverityText = (severity: string) => {
  switch (severity) {
    case 'critical': return 'Nghiêm trọng';
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return severity;
  }
};

const getViolationTypeText = (type: string) => {
  switch (type) {
    case 'late_return': return 'Trả xe muộn';
    case 'damage': return 'Hư hỏng xe';
    case 'no_show': return 'Không đến lấy xe';
    case 'payment_issue': return 'Vấn đề thanh toán';
    case 'rule_violation': return 'Vi phạm quy định';
    case 'other': return 'Khác';
    default: return type;
  }
};

export function RiskyCustomerDetailModal({
  isOpen,
  onClose,
  customerId,
  onUpdate
}: RiskyCustomerDetailModalProps) {
  useDisableBodyScroll(isOpen);
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RiskyCustomerDetailResponse | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchDetail();
    }
  }, [isOpen, customerId]);

  const fetchDetail = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      const response = await UserService.getRiskyCustomerDetail(customerId);
      setData(response);
    } catch (error: any) {
      console.error('Error fetching risky customer detail:', error);
      showToast.error(error.response?.data?.message || 'Không thể tải thông tin khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRiskScore = async () => {
    if (!customerId) return;
    
    if (!confirm('Bạn có chắc muốn reset điểm rủi ro về 0? Tất cả vi phạm sẽ được đánh dấu là đã giải quyết.')) {
      return;
    }

    try {
      await UserService.resetRiskScore(customerId);
      showToast.success('Đã reset điểm rủi ro thành công');
      fetchDetail();
      onUpdate?.();
    } catch (error: any) {
      console.error('Error resetting risk score:', error);
      showToast.error(error.response?.data?.message || 'Không thể reset điểm rủi ro');
    }
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-500 to-orange-600 dark:from-red-700 dark:to-orange-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Chi tiết Khách hàng Rủi ro
                      </h2>
                      <p className="text-red-100 text-sm mt-1">
                        {data?.user.fullname || 'Đang tải...'}
                      </p>
                    </div>
                  </div>
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : !data ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info & Risk Score */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Info */}
                  <Card className="lg:col-span-2 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Thông tin Khách hàng
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 mr-2">Tên:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.user.fullname}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 mr-2">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 mr-2">SĐT:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{data.user.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400 mr-2">KYC:</span>
                        <Badge variant={data.user.kycStatus === 'approved' ? 'success' : data.user.kycStatus === 'pending' ? 'warning' : 'destructive'}>
                          {data.user.kycStatus === 'approved' ? 'Đã duyệt' : 
                           data.user.kycStatus === 'pending' ? 'Chờ duyệt' : 
                           data.user.kycStatus === 'rejected' ? 'Từ chối' : 'Chưa nộp'}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  {/* Risk Score Card */}
                  <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-red-600" />
                      Điểm Rủi ro
                    </h3>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-red-600 mb-2">
                        {data.riskInfo.risk_score}
                      </div>
                      <Badge className={`${getRiskLevelColor(data.riskInfo.risk_level)} text-sm`}>
                        {getRiskLevelText(data.riskInfo.risk_level)}
                      </Badge>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tổng vi phạm:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {data.riskInfo.total_violations}
                          </span>
                        </div>
                        {data.riskInfo.last_violation_date && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Vi phạm gần nhất:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(data.riskInfo.last_violation_date)}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleResetRiskScore}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Điểm
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Violations */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                      Danh sách Vi phạm ({data.riskInfo.violations?.length || 0})
                    </h3>
                  </div>

                  {/* Violations List */}
                  {(!data.riskInfo.violations || data.riskInfo.violations.length === 0) ? (
                    <div className="text-center py-16">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-50"></div>
                        <AlertTriangle className="relative h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Không có vi phạm</h3>
                      <p className="text-gray-500 dark:text-gray-400">Khách hàng này chưa có vi phạm nào được ghi nhận</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.riskInfo.violations.map((violation, index) => (
                        <div
                          key={index}
                          className="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-3">
                              <div className="flex items-start gap-3">
                                {/* Violation Number Badge */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                  {index + 1}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  {/* Header with Severity and Type */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${getSeverityColor(violation.severity)} text-xs font-semibold px-3 py-1.5 border`}>
                                      {getSeverityText(violation.severity)}
                                    </Badge>
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                      {getViolationTypeText(violation.type)}
                                    </h4>
                                  </div>
                                  
                                  {/* Description */}
                                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                      {violation.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Meta Info */}
                            <div className="lg:col-span-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Điểm phạt</span>
                                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                    +{violation.points}
                                  </span>
                                </div>
                                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {formatDate(violation.date)}
                                  </span>
                                </div>
                              </div>
                              <div>
                                {violation.resolved ? (
                                  <div className="flex items-center justify-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-400">Đã giải quyết</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <XCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                                    <span className="text-xs font-semibold text-red-700 dark:text-red-400">Chưa giải quyết</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Đóng
              </Button>
            </div>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default RiskyCustomerDetailModal;

