import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wrench,
  Bike,
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
import { UpdateMaintenanceModal } from './UpdateMaintenanceModal';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Update local report when prop changes
  useEffect(() => {
    setReport(initialReport);
    setShowDeleteConfirm(false);
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
      
      // Close modal first, then show toast
      onClose();
      
      // Small delay to ensure modal closes before showing toast
      setTimeout(() => {
        showToast.success('Đã xóa báo cáo thành công');
      }, 100);
      
      onUpdate();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể xóa báo cáo');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateSuccess = () => {
    onClose();
    onUpdate();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-8 py-6 overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                
                <div className="relative flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
                      <Wrench className="h-7 w-7 text-white drop-shadow-lg" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                          Chi tiết báo cáo bảo trì
                        </h2>
                        {report.status === 'reported' ? (
                          <Badge 
                            variant="warning"
                            className="shadow-md"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Đã báo cáo
                          </Badge>
                        ) : (
                          <Badge 
                            variant="success"
                            className="shadow-md"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đã sửa
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/90 text-sm font-medium drop-shadow">
                        Báo cáo bảo trì từ khách hàng hoặc nhân viên
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshReport}
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
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900 min-h-0">
                <div className="space-y-6">
                  {/* Title & Description */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-orange-100 dark:border-orange-900/30">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-orange-200 dark:border-orange-700">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Mã:</span>
                          <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                            {report.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>
                  </div>

                  {/* Vehicle & Station Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vehicle Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Bike size={18} className="text-blue-600 dark:text-blue-400" />
                          Thông tin xe
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tên xe</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {vehicle.name}
                              </p>
                            </div>
                          </div>
                          {vehicle.license_plate && (
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Biển số</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {vehicle.license_plate}
                                </p>
                              </div>
                            </div>
                          )}
                          {vehicle.model && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Model</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {vehicle.model}
                                </p>
                              </div>
                            </div>
                          )}
                          {vehicle.type && (
                            <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-100 dark:border-cyan-800">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Loại</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {vehicle.type}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Station Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-900/30">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                          Thông tin trạm
                        </h3>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Tên trạm</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {station.name}
                              </p>
                            </div>
                          </div>
                          {station.address && (
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Địa chỉ</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {station.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reporter Info */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-b border-purple-100 dark:border-purple-900/30">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Người báo cáo
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                            <User className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Họ tên</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {reporter.fullname}
                            </p>
                          </div>
                        </div>
                        {reporter.email && (
                          <div className="flex items-center gap-3 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Email</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {reporter.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {report.notes && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Ghi chú
                        </h3>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base whitespace-pre-wrap">
                          {report.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Images - Split into Before/After based on maintenance status */}
                  {report.images && report.images.length > 0 && (
                    <div className="space-y-4">
                      {/* Images Before Maintenance (shown for all reports) */}
                      {report.status === 'reported' ? (
                        // All images are "before" if status is still "reported"
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                              <ImageIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                              Hình ảnh trước bảo trì
                              <span className="text-sm font-normal text-gray-500">({report.images.length})</span>
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {report.images.map((image, index) => (
                                <a
                                  key={index}
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-square rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all"
                                >
                                  <img
                                    src={image}
                                    alt={`Ảnh trước bảo trì ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                    <span className="text-white text-sm font-medium">Xem ảnh</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // When status is "fixed", split images (assume first image is before, rest are after if multiple)
                        <>
                          {/* Before Images - Show first image as "before" */}
                          {report.images.length >= 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <ImageIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                  Hình ảnh trước bảo trì
                                  <span className="text-sm font-normal text-gray-500">(1)</span>
                                </h3>
                              </div>
                              <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  <a
                                    href={report.images[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative aspect-square rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all"
                                  >
                                    <img
                                      src={report.images[0]}
                                      alt="Ảnh trước bảo trì"
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                      <span className="text-white text-sm font-medium">Xem ảnh</span>
                                    </div>
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* After Images - Show remaining images as "after" */}
                          {report.images.length > 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  <ImageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  Hình ảnh sau bảo trì
                                  <span className="text-sm font-normal text-gray-500">({report.images.length - 1})</span>
                                </h3>
                              </div>
                              <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {report.images.slice(1).map((image, index) => (
                                    <a
                                      key={index + 1}
                                      href={image}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative aspect-square rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all"
                                    >
                                      <img
                                        src={image}
                                        alt={`Ảnh sau bảo trì ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                        <span className="text-white text-sm font-medium">Xem ảnh</span>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}



                  {/* Metadata */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ngày tạo</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {new Date(report.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cập nhật lần cuối</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {new Date(report.updatedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
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
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                          ⚠️ Xác nhận xóa báo cáo
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          Bạn có chắc chắn muốn xóa báo cáo này? Hành động này không thể hoàn tác.
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
                        Xóa báo cáo
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="px-6 py-2.5 h-11 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Đóng
                    </Button>
                    {report.status === 'reported' && (
                      <Button
                        onClick={() => setShowUpdateModal(true)}
                        className="px-8 py-2.5 h-11 min-w-[180px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Cập nhật bảo trì
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Update Maintenance Modal */}
          <UpdateMaintenanceModal
            report={report}
            isOpen={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={handleUpdateSuccess}
          />
        </>
      )}
    </AnimatePresence>
  );
}

