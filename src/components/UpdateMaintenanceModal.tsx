import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Battery,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { MaintenanceReport } from './service/type/maintenanceTypes';
import MaintenanceService from './service/maintenanceService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface UpdateMaintenanceModalProps {
  report: MaintenanceReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateMaintenanceModal({ 
  report, 
  isOpen, 
  onClose, 
  onSuccess 
}: UpdateMaintenanceModalProps) {
  useDisableBodyScroll(isOpen);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && report) {
      setBatteryLevel('');
      setNotes(report.notes || '');
      setImages([]);
      setImagePreviews([]);
    }
  }, [isOpen, report]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        showToast.error(`${file.name} không phải là file hình ảnh`);
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    // Create previews
    const newPreviews: string[] = [];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(prev => [...prev, ...validFiles]);
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!report?._id) return;

    // Validation
    const batteryNum = parseFloat(batteryLevel);
    if (!batteryLevel || isNaN(batteryNum) || batteryNum < 0 || batteryNum > 100) {
      showToast.error('Vui lòng nhập mức pin hợp lệ (0-100)');
      return;
    }

    if (!notes.trim()) {
      showToast.error('Vui lòng nhập ghi chú về quá trình bảo trì');
      return;
    }

    try {
      setIsSubmitting(true);

      await MaintenanceService.updateMaintenance(report._id, {
        status: 'fixed',
        battery_level: batteryNum,
        notes: notes.trim(),
        images: images.length > 0 ? images : undefined
      });

      showToast.success('Đã cập nhật bảo trì thành công!');
      onClose();
      onSuccess();
    } catch (error: any) {
      showToast.error(error.message || 'Không thể cập nhật bảo trì');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!report) return null;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 px-6 py-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Cập nhật bảo trì</h2>
                      <p className="text-white/90 text-sm">{report.title}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="h-9 w-9 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Battery Level */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Battery className="inline-block w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                    Mức pin sau bảo trì (%)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(e.target.value)}
                      placeholder="Nhập mức pin (0-100)"
                      className="pr-12"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                      %
                    </div>
                  </div>
                  {batteryLevel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Battery 
                        className={`w-5 h-5 ${
                          parseFloat(batteryLevel) >= 80 
                            ? 'text-green-600' 
                            : parseFloat(batteryLevel) >= 50 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}
                      />
                      <span className="text-gray-600 dark:text-gray-400">
                        {parseFloat(batteryLevel) >= 80 
                          ? 'Pin đầy, xe sẵn sàng hoạt động' 
                          : parseFloat(batteryLevel) >= 50 
                          ? 'Pin trung bình' 
                          : 'Pin yếu, cần sạc thêm'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FileText className="inline-block w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                    Ghi chú về quá trình bảo trì
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mô tả chi tiết về công việc bảo trì đã thực hiện..."
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ghi rõ các vấn đề đã được khắc phục và trạng thái hiện tại của xe
                  </p>
                </div>

                {/* Images Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <ImageIcon className="inline-block w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Hình ảnh sau bảo trì (tùy chọn)
                  </label>
                  
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Upload Button */}
                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Thêm ảnh</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tải lên hình ảnh xe sau khi bảo trì (nếu có)
                  </p>
                </div>

                {/* Info Notice */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Lưu ý quan trọng
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Khi bấm "Hoàn thành bảo trì", trạng thái báo cáo sẽ được chuyển thành "Đã sửa" và xe sẽ sẵn sàng hoạt động trở lại.
                    </p>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hoàn thành bảo trì
                      </>
                    )}
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
