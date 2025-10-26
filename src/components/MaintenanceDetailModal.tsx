import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wrench,
  Car,
  MapPin,
  User,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MaintenanceReport, MaintenanceStatus } from './service/type/maintenanceTypes';
import MaintenanceService from './service/maintenanceService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface MaintenanceDetailModalProps {
  report: MaintenanceReport | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function MaintenanceDetailModal({ 
  report: initialReport, 
  isOpen, 
  onClose, 
  onUpdate 
}: MaintenanceDetailModalProps) {
  useDisableBodyScroll(isOpen);
  const [report, setReport] = useState<MaintenanceReport | null>(initialReport);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateStatus, setUpdateStatus] = useState<MaintenanceStatus>('fixed');

  // Update local report when prop changes
  useEffect(() => {
    setReport(initialReport);
    setShowDeleteConfirm(false);
    setShowUpdateForm(false);
    setUpdateNotes(initialReport?.notes || '');
  }, [initialReport, isOpen]);

  // Fetch fresh report data
  const handleRefreshReport = async () => {
    if (!report?._id) return;

    try {
      setIsRefreshing(true);
      const response = await MaintenanceService.getMaintenanceById(report._id);
      setReport(response.data);
      showToast.success('Đã làm mới dữ liệu');
    } catch (error: any) {
      showToast.error(error.message || 'Không thể làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!report?._id) return;

    try {
      setIsDeleting(true);
      await MaintenanceService.deleteMaintenance(report._id);
      
      showToast.success('Đã xóa báo cáo thành công');
      onUpdate();
      onClose();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể xóa báo cáo');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdate = async () => {
    if (!report?._id) return;

    try {
      setIsUpdating(true);
      const response = await MaintenanceService.updateMaintenance(report._id, {
        status: updateStatus,
        notes: updateNotes.trim() || undefined
      });
      
      setReport(response.data);
      setShowUpdateForm(false);
      showToast.success('Đã cập nhật báo cáo thành công');
      onUpdate();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể cập nhật báo cáo');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!report) return null;

  // Helper to extract vehicle info
  const getVehicleInfo = () => {
    if (typeof report.vehicle_id === 'string') {
      return { name: report.vehicle_id, license_plate: '', model: '', type: '' };
    }
    return report.vehicle_id;
  };

  // Helper to extract station info
  const getStationInfo = () => {
    if (typeof report.station_id === 'string') {
      return { name: report.station_id, address: '' };
    }
    return report.station_id;
  };

  // Helper to extract reporter info
  const getReporterInfo = () => {
    if (typeof report.reported_by === 'string') {
      return { fullname: report.reported_by, email: '' };
    }
    return report.reported_by;
  };

  const vehicle = getVehicleInfo();
  const station = getStationInfo();
  const reporter = getReporterInfo();

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
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Wrench className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Chi tiết báo cáo bảo trì</h2>
                      <p className="text-sm text-white/80 mt-0.5">Mã: {report.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshReport}
                      disabled={isRefreshing}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Làm mới"
                    >
                      <RefreshCw className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Đóng"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex gap-3">
                    {report.status === 'reported' ? (
                      <Badge variant="warning" className="font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        Đã báo cáo
                      </Badge>
                    ) : (
                      <Badge variant="success" className="font-medium">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Đã sửa
                      </Badge>
                    )}
                    {report.is_active && (
                      <Badge variant="default">Đang hoạt động</Badge>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tiêu đề
                    </h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {report.title}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Mô tả chi tiết
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  {/* Vehicle & Station Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <Car className="w-4 h-4" />
                        Thông tin xe
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">Tên xe: </span>
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            {vehicle.name}
                          </span>
                        </div>
                        {vehicle.license_plate && (
                          <div>
                            <span className="text-blue-700 dark:text-blue-300">Biển số: </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {vehicle.license_plate}
                            </span>
                          </div>
                        )}
                        {vehicle.model && (
                          <div>
                            <span className="text-blue-700 dark:text-blue-300">Model: </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {vehicle.model}
                            </span>
                          </div>
                        )}
                        {vehicle.type && (
                          <div>
                            <span className="text-blue-700 dark:text-blue-300">Loại: </span>
                            <span className="font-medium text-blue-900 dark:text-blue-100">
                              {vehicle.type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Thông tin trạm
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-green-700 dark:text-green-300">Tên trạm: </span>
                          <span className="font-medium text-green-900 dark:text-green-100">
                            {station.name}
                          </span>
                        </div>
                        {station.address && (
                          <div>
                            <span className="text-green-700 dark:text-green-300">Địa chỉ: </span>
                            <span className="font-medium text-green-900 dark:text-green-100">
                              {station.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Người báo cáo
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">Họ tên: </span>
                        <span className="font-medium text-purple-900 dark:text-purple-100">
                          {reporter.fullname}
                        </span>
                      </div>
                      {reporter.email && (
                        <div>
                          <span className="text-purple-700 dark:text-purple-300">Email: </span>
                          <span className="font-medium text-purple-900 dark:text-purple-100">
                            {reporter.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {report.notes && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Ghi chú
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {report.notes}
                      </p>
                    </div>
                  )}

                  {/* Images */}
                  {report.images && report.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Hình ảnh ({report.images.length})
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {report.images.map((image, index) => (
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

                  {/* Update Form */}
                  {showUpdateForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                    >
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                        Cập nhật trạng thái
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Trạng thái
                          </label>
                          <select
                            value={updateStatus}
                            onChange={(e) => setUpdateStatus(e.target.value as MaintenanceStatus)}
                            className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            aria-label="Chọn trạng thái báo cáo"
                          >
                            <option value="reported">Đã báo cáo</option>
                            <option value="fixed">Đã sửa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Ghi chú
                          </label>
                          <textarea
                            value={updateNotes}
                            onChange={(e) => setUpdateNotes(e.target.value)}
                            placeholder="Nhập ghi chú (tùy chọn)..."
                            className="w-full px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ngày tạo</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cập nhật lần cuối</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(report.updatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                          Xác nhận xóa báo cáo
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.
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
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || showDeleteConfirm}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa báo cáo
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Đóng
                    </Button>
                    {!showUpdateForm && (
                      <Button
                        onClick={() => setShowUpdateForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Cập nhật
                      </Button>
                    )}
                    {showUpdateForm && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowUpdateForm(false)}
                          disabled={isUpdating}
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleUpdate}
                          disabled={isUpdating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Lưu thay đổi
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

