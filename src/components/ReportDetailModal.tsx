import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertTriangle,
  User, 
  Calendar, 
  MapPin,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Car,
  FileText,
  Building,
  ClipboardList
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Report, getIssueTypeLabel, getReportStatusLabel, getReportStatusColor } from './service/type/reportTypes';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface ReportDetailModalProps {
  report: Report | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDetailModal({ report: initialReport, isOpen, onClose }: ReportDetailModalProps) {
  useDisableBodyScroll(isOpen);
  const [report, setReport] = useState<Report | null>(initialReport);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Update local report when prop changes
  useEffect(() => {
    setReport(initialReport);
    setSelectedImage(null);
  }, [initialReport, isOpen]);

  if (!isOpen || !report) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
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
                          Chi tiết báo cáo
                        </h2>
                        <p className="text-red-100 text-sm mt-1">
                          Mã: {report.code}
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Status & Issue Type */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                      <Badge className={`${getReportStatusColor(report.status)} font-semibold text-base px-4 py-2`}>
                        {report.status === 'pending' ? (
                          <Clock size={16} className="mr-1.5" />
                        ) : (
                          <CheckCircle size={16} className="mr-1.5" />
                        )}
                        {getReportStatusLabel(report.status)}
                      </Badge>
                      <Badge className={`${
                        report.issue_type === 'accident' 
                          ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                          : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                      } font-semibold text-base px-4 py-2`}>
                        {getIssueTypeLabel(report.issue_type)}
                      </Badge>
                      <div className="flex-1" />
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        {report.createdAt}
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.user_id && (
                        <div className="p-4 bg-blue-50 rounded-xl">
                          <div className="flex items-center gap-2 text-blue-600 font-semibold mb-3">
                            <User size={18} />
                            Người báo cáo
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-blue-500" />
                              <span className="text-gray-700">{report.user_id.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-blue-500" />
                              <span className="text-gray-700">{report.user_id.phone}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vehicle Information */}
                      {report.vehicle_id && (
                        <div className="p-4 bg-green-50 rounded-xl">
                          <div className="flex items-center gap-2 text-green-600 font-semibold mb-3">
                            <Car size={18} />
                            Thông tin xe
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-green-500" />
                              <span className="text-gray-700">{report.vehicle_id.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClipboardList size={14} className="text-green-500" />
                              <span className="text-gray-700 font-mono">{report.vehicle_id.license_plate}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Station & Rental Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.station_id && (
                        <div className="p-4 bg-purple-50 rounded-xl">
                          <div className="flex items-center gap-2 text-purple-600 font-semibold mb-3">
                            <Building size={18} />
                            Trạm xe
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="font-medium text-gray-900">{report.station_id.name}</div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin size={14} />
                              {report.station_id.address}
                            </div>
                          </div>
                        </div>
                      )}

                      {report.rental_id && (
                        <div className="p-4 bg-orange-50 rounded-xl">
                          <div className="flex items-center gap-2 text-orange-600 font-semibold mb-3">
                            <FileText size={18} />
                            Thông tin thuê xe
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Mã thuê: </span>
                              <span className="font-mono font-medium text-gray-900">{report.rental_id.code}</span>
                            </div>
                            {report.booking_id && (
                              <div>
                                <span className="text-gray-600">Mã đặt: </span>
                                <span className="font-mono font-medium text-gray-900">{report.booking_id}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                        <FileText size={18} />
                        Mô tả sự cố
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {report.description}
                      </p>
                    </div>

                    {/* Images */}
                    {report.images && report.images.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                          <ImageIcon size={18} />
                          Hình ảnh ({report.images.length})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {report.images.map((image, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.05 }}
                              className="relative group cursor-pointer aspect-square rounded-lg overflow-hidden bg-gray-100"
                              onClick={() => setSelectedImage(image)}
                            >
                              <img
                                src={image}
                                alt={`Hình ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="text-white" size={24} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution Information */}
                    {report.status === 'resolved' && report.resolution_notes && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                          <CheckCircle size={18} />
                          Giải quyết
                        </div>
                        <p className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">
                          {report.resolution_notes}
                        </p>
                        {report.resolved_at && (
                          <div className="text-sm text-gray-600">
                            Đã giải quyết lúc: {report.resolved_at}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
                  <Button variant="outline" onClick={onClose}>
                    Đóng
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[60]"
              onClick={() => setSelectedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} className="text-white" />
                </button>
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
