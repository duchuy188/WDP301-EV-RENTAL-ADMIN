import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { vehicleService } from './service/vehicleService';
import { showToast } from '../lib/toast';

interface BulkPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExportFilter {
  model: string;
  color: string;
  year: number;
}

interface ImportResult {
  success: boolean;
  updated: number;
  failed: number;
  message: string;
  statusStats?: {
    available: number;
    maintenance: number;
  };
  details?: {
    successes: any[];
    failures: any[];
  };
}

export function BulkPricingModal({ isOpen, onClose, onSuccess }: BulkPricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Models list
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Export filter state
  const [exportFilter, setExportFilter] = useState<ExportFilter>({
    model: '',
    color: '',
    year: new Date().getFullYear()
  });

  // Vehicle count matching filter
  const [matchingVehicleCount, setMatchingVehicleCount] = useState<number | null>(null);
  const [checkingCount, setCheckingCount] = useState(false);

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const response = await vehicleService.getVehicleModels();
      setModels(response.data || []);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
      showToast.error('Không thể tải danh sách model xe');
    } finally {
      setLoadingModels(false);
    }
  };

  const checkVehicleCount = useCallback(async () => {
    try {
      setCheckingCount(true);
      // Get vehicles with filter
      const response = await vehicleService.getVehiclesForAdmin({
        page: 1,
        limit: 1000,
        model: exportFilter.model,
        color: exportFilter.color
      });
      
      // Filter by year (client-side since API might not support it)
      const matchingVehicles = (response.data || []).filter(v => v.year === exportFilter.year);
      setMatchingVehicleCount(matchingVehicles.length);
    } catch (error) {
      console.error('Error checking vehicle count:', error);
      setMatchingVehicleCount(null);
    } finally {
      setCheckingCount(false);
    }
  }, [exportFilter.model, exportFilter.color, exportFilter.year]);

  // Load models when modal opens
  useEffect(() => {
    if (isOpen) {
      loadModels();
    }
  }, [isOpen]);

  // Check vehicle count when filter changes
  useEffect(() => {
    if (exportFilter.model && exportFilter.color && exportFilter.year) {
      checkVehicleCount();
    } else {
      setMatchingVehicleCount(null);
    }
  }, [exportFilter.model, exportFilter.color, exportFilter.year, checkVehicleCount]);

  const handleExportTemplate = async () => {
    try {
      setExportLoading(true);
      
      // Validate: phải chọn CẢ 3 filter (model, color, year)
      if (!exportFilter.model.trim()) {
        showToast.warning('Vui lòng chọn Model xe');
        return;
      }
      if (!exportFilter.color.trim()) {
        showToast.warning('Vui lòng chọn Màu sắc xe');
        return;
      }
      if (!exportFilter.year) {
        showToast.warning('Vui lòng chọn Năm sản xuất');
        return;
      }

      // Validate: phải có xe khớp với filter
      if (matchingVehicleCount === 0) {
        showToast.error('Không tìm thấy xe để export với bộ lọc này');
        return;
      }
      
      // Prepare request body - only include non-empty fields
      const requestBody: any = {};
      if (exportFilter.model.trim()) requestBody.model = exportFilter.model.trim();
      if (exportFilter.color.trim()) requestBody.color = exportFilter.color.trim();
      if (exportFilter.year) requestBody.year = exportFilter.year;

      const blob = await vehicleService.exportPricingTemplate(requestBody);
      
      // Download the Excel file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast.success('Đã xuất template cập nhật giá thành công!');
    } catch (error: any) {
      console.error('Error exporting pricing template:', error);
      showToast.error(`Lỗi: ${error.response?.data?.message || error.message || 'Không thể xuất template'}`);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportPricing = async (file: File) => {
    if (!file) return;
    
    try {
      setLoading(true);
      setImportResult(null);
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showToast.warning('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }
      
      console.log('Importing pricing file:', file.name, 'size:', file.size);
      
      const toastId = showToast.loading('Đang import cập nhật giá...');
      
      const response = await vehicleService.importPricingUpdates(file);
      
      showToast.dismiss(toastId);
      
      console.log('Import pricing response:', response);
      
      // Extract data from response
      const importData: any = response.data || response;
      setImportResult(importData as ImportResult);
      
      const updated = importData?.updated || 0;
      const failed = importData?.failed || 0;
      
      if (updated > 0) {
        showToast.success(`Cập nhật giá thành công cho ${updated} xe!`);
        onSuccess(); // Refresh vehicle list
        // Đóng modal sau khi import thành công
        setTimeout(() => {
          handleClose();
        }, 1500); // Đợi 1.5 giây để user thấy toast
      } else if (failed > 0) {
        showToast.warning(`Có ${failed} lỗi khi cập nhật. Vui lòng xem chi tiết bên dưới.`);
      } else {
        showToast.info('Không có dữ liệu nào được cập nhật. Vui lòng kiểm tra file Excel.');
      }
    } catch (error: any) {
      console.error('Error importing pricing updates:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Không thể import cập nhật giá';
      
      setImportResult({
        success: false,
        updated: 0,
        failed: 1,
        message: errorMessage,
        details: {
          successes: [],
          failures: [{ error: `${errorMessage} (Status: ${error.response?.status || 'Unknown'})` }]
        }
      });
      
      showToast.error(`Lỗi import: ${errorMessage}`);
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setMatchingVehicleCount(null);
    setExportFilter({
      model: '',
      color: '',
      year: new Date().getFullYear()
    });
    onClose();
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
            className="modal-backdrop"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient - Fixed */}
              <div className="relative bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-700 dark:to-orange-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Cập nhật giá hàng loạt
                      </h2>
                      <p className="text-amber-100 text-sm mt-1">
                        Export template và import cập nhật giá xe từ Excel
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={loading || exportLoading}
                    className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                    title="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          Quy trình cập nhật giá
                        </h4>
                        <ol className="text-sm text-gray-700 space-y-1.5">
                          <li className="flex items-start">
                            <span className="font-medium mr-2">1.</span>
                            <span><strong>Chọn đầy đủ</strong> Model, Màu sắc VÀ Năm sản xuất (bắt buộc cả 3)</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">2.</span>
                            <span>Nhấn "Export template" để tải file Excel</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">3.</span>
                            <span>Mở file và cập nhật giá thuê (price_per_day) và % cọc (deposit_percentage)</span>
                          </li>
                          <li className="flex items-start">
                            <span className="font-medium mr-2">4.</span>
                            <span>Lưu file và import lại để cập nhật giá</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Export Section */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Download className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span>Export template cập nhật giá</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                     

                      {/* Filter Section */}
                      <div className="bg-gray-50 dark:bg-gray-900/50 border-2 border-red-200 dark:border-red-700 rounded-lg p-4 space-y-4">
                        

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Model */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Model <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={exportFilter.model}
                              onChange={(e) => setExportFilter({ ...exportFilter, model: e.target.value })}
                              className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                              disabled={loadingModels}
                              required
                              aria-label="Chọn model xe"
                            >
                              <option value="">
                                {loadingModels ? 'Đang tải...' : '-- Chọn model xe --'}
                              </option>
                              {models.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                            {models.length === 0 && !loadingModels && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                                Không có model nào trong hệ thống
                              </p>
                            )}
                          </div>

                          {/* Year */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Năm sản xuất <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="2000"
                              max="2030"
                              value={exportFilter.year}
                              onChange={(e) => setExportFilter({ ...exportFilter, year: parseInt(e.target.value) || new Date().getFullYear() })}
                              className="h-11"
                              required
                            />
                          </div>
                        </div>

                        {/* Color - Full width */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Màu sắc <span className="text-red-500">*</span>
                          </label>
                          <ColorPicker
                            value={exportFilter.color}
                            onChange={(color) => setExportFilter({ ...exportFilter, color })}
                          />
                        </div>
                      </div>

                      {/* Vehicle Count Display */}
                      {checkingCount && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm text-blue-800 dark:text-blue-300">
                              Đang kiểm tra số lượng xe...
                            </span>
                          </div>
                        </div>
                      )}

                      {!checkingCount && matchingVehicleCount !== null && (
                        <div className={`border rounded-lg p-4 ${
                          matchingVehicleCount > 0 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                        }`}>
                          <div className="flex items-center space-x-2">
                            {matchingVehicleCount > 0 ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                  Tìm thấy {matchingVehicleCount} xe có thể export
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                  Không tìm thấy xe để export với bộ lọc này
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleExportTemplate}
                        disabled={exportLoading || checkingCount || matchingVehicleCount === 0}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {exportLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Đang xuất...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 mr-2" />
                            Export template
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Import Section */}
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Import cập nhật giá</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Chọn file Excel đã cập nhật giá để áp dụng vào hệ thống.
                      </p>

                      {/* Warning */}
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-amber-800 dark:text-amber-300">
                            <p className="font-medium mb-1">Lưu ý:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li><strong>KHÔNG</strong> xóa hoặc thay đổi cột <strong>vehicle_id</strong></li>
                              <li>Giá thuê (price_per_day) phải từ 50,000 - 500,000 VNĐ</li>
                              <li>Phần trăm cọc (deposit_percentage) phải từ 10 - 100%</li>
                              <li>File phải là Excel (.xlsx hoặc .xls)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImportPricing(file);
                        }}
                        className="hidden"
                        aria-label="Chọn file Excel cập nhật giá"
                      />

                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 py-3 rounded-lg font-medium transition-all duration-200"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-2"></div>
                            Đang import...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 mr-2" />
                            Chọn file Excel
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Import Result */}
                  {importResult && (
                    <Card className={`border-2 ${
                      importResult.success && importResult.updated > 0
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                            importResult.success && importResult.updated > 0
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            {importResult.success && importResult.updated > 0 ? (
                              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            ) : (
                              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Kết quả cập nhật giá
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {importResult.message}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Statistics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Thành công</div>
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {importResult.updated}
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-3">
                              <div className="text-sm text-gray-600 dark:text-gray-400">Thất bại</div>
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {importResult.failed}
                              </div>
                            </div>
                          </div>

                          {/* Status Stats */}
                          {importResult.statusStats && (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Trạng thái xe đã cập nhật:
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Sẵn sàng: <span className="font-semibold text-green-600 dark:text-green-400">{importResult.statusStats.available}</span>
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Bảo trì: <span className="font-semibold text-orange-600 dark:text-orange-400">{importResult.statusStats.maintenance}</span>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Errors */}
                          {importResult.details?.failures && importResult.details.failures.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                                Chi tiết lỗi:
                              </h5>
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {importResult.details.failures.slice(0, 10).map((failure: any, index: number) => (
                                  <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-2 rounded">
                                    {failure.vehicle_id || 'Unknown'}: {failure.error || 'Unknown error'}
                                  </div>
                                ))}
                                {importResult.details.failures.length > 10 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    ...và {importResult.details.failures.length - 10} lỗi khác
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading || exportLoading}
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

