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
  Phone,
  MapPin
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserService } from './service/userService';
import { 
  RiskyCustomerDetailResponse,
  Violation
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

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-500 to-orange-600">
            <div className="flex items-center text-white">
              <AlertTriangle className="h-6 w-6 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Chi tiết Khách hàng Rủi ro</h2>
                <p className="text-red-100 text-sm mt-1">
                  {data?.user.fullname || 'Đang tải...'}
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
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
                        <Badge variant={data.user.kyc_status === 'approved' ? 'success' : 'destructive'}>
                          {data.user.kyc_status}
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
                        {data.riskInfo.risk_level.toUpperCase()}
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
                    <p className="text-gray-500 text-center py-8">Không có vi phạm nào</p>
                  ) : (
                    <div className="space-y-3">
                      {data.riskInfo.violations.map((violation, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getSeverityColor(violation.severity)}>
                                  {violation.severity}
                                </Badge>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {violation.type}
                                </span>
                                <span className="text-sm text-gray-500">
                                  +{violation.points} điểm
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {violation.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(violation.date)}
                                </div>
                                {violation.resolved ? (
                                  <div className="flex items-center text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Đã giải quyết
                                  </div>
                                ) : (
                                  <div className="flex items-center text-red-600">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Chưa giải quyết
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default RiskyCustomerDetailModal;

