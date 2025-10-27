import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { vehicleService } from './service/vehicleService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';
import type { VehicleUI } from './service/type/vehicleTypes';
import * as XLSX from 'xlsx';

interface LicensePlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles?: VehicleUI[]; // Danh sách xe hiện tại
}

export function LicensePlateModal({ isOpen, onClose, onSuccess, vehicles = [] }: LicensePlateModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [draftVehicles, setDraftVehicles] = useState<VehicleUI[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors?: Array<{ licensePlate: string; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importResultRef = useRef<HTMLDivElement>(null);

  // Filter xe chưa có biển số khi modal mở
  useEffect(() => {
    if (isOpen && vehicles.length > 0) {
      const vehiclesWithoutPlates = vehicles.filter(
        (v) => !v.licensePlate || 
              v.licensePlate.trim() === '' || 
              v.licensePlate === 'N/A' ||
              v.licensePlate === 'Chưa gán biển' ||
              v.licensePlate.toLowerCase().includes('chưa')
      );
      setDraftVehicles(vehiclesWithoutPlates);
      console.log('Xe chưa có biển số:', vehiclesWithoutPlates.length, vehiclesWithoutPlates);
    }
  }, [isOpen, vehicles]);

  // Reset state khi modal đóng
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setImportResult(null);
    }
  }, [isOpen]);

  const handleExportDraftVehicles = async () => {
    try {
      setExportLoading(true);
      
      if (draftVehicles.length === 0) {
        showToast.info('Không có xe nào chưa có biển số!');
        return;
      }

      // Gọi API backend để lấy file Excel template
      // API này sẽ export file với format đúng mà backend expect khi import
      const blob = await vehicleService.exportDraftVehicles();
      
      // Download file Excel
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles-no-plates-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast.success(`Đã xuất danh sách ${draftVehicles.length} xe chưa có biển số thành công!`);
    } catch (error: any) {
      console.error('Error exporting draft vehicles:', error);
      
      // Nếu API không có, fallback về client-side export
      console.log('API export không khả dụng, dùng client-side export');
      
      try {
        // Tạo dữ liệu cho Excel worksheet - match format của backend (3 cột như bulk-create)
        console.log('Draft vehicles for export:', draftVehicles);
        
        const worksheetData = [
          ['ID', 'Tên xe', 'Biển số xe'], // Format giống bulk-create
          ...draftVehicles.map((vehicle) => {
            console.log('Exporting vehicle:', vehicle);
            return [
              vehicle.id || '', // ID
              `${vehicle.model || ''} - ${vehicle.color || ''}`, // Tên xe (model - color)
              '' // Biển số xe (trống để user điền)
            ];
          })
        ];
        
        console.log('Worksheet data:', worksheetData);

        // Tạo workbook và worksheet từ dữ liệu
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');

        // Set column widths cho format 3 cột
        const columnWidths = [
          { wch: 30 }, // ID
          { wch: 25 }, // Tên xe
          { wch: 20 }  // Biển số xe
        ];
        worksheet['!cols'] = columnWidths;

        // Export file Excel thật (.xlsx)
        XLSX.writeFile(workbook, `vehicles-no-plates-${new Date().toISOString().split('T')[0]}.xlsx`);
        
        showToast.success(`Đã xuất ${draftVehicles.length} xe chưa có biển số thành công!`);
      } catch (fallbackError) {
        console.error('Fallback export error:', fallbackError);
        showToast.error('Có lỗi xảy ra khi xuất danh sách xe');
      }
    } finally {
      setExportLoading(false);
    }
  };

  // Handle file selection - chỉ validate và lưu file
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    try {
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
        showToast.warning('Vui lòng chọn file Excel (.xlsx, .xls hoặc .csv)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }
      
      console.log('File selected:', file.name, 'size:', file.size, 'type:', file.type);
      
      // Validate file content - check if license plates are sufficient
      const toastId = showToast.loading('Đang kiểm tra file...');
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Excel data:', data);
        
        if (data.length < 2) {
          showToast.dismiss(toastId);
          showToast.error('File Excel không có dữ liệu. Vui lòng điền biển số vào file.');
          return;
        }
        
        // Find column indices (handle different possible formats)
        const headers = data[0] as string[];
        const licensePlateColIndex = headers.findIndex((h: string) => 
          h && (
            h.toLowerCase().includes('biển số') || 
            h.toLowerCase().includes('license') || 
            h.toLowerCase().includes('license_plate') ||
            h.toLowerCase() === 'biển số xe'
          )
        );
        
        console.log('Headers:', headers);
        console.log('License plate column index:', licensePlateColIndex);
        
        if (licensePlateColIndex === -1) {
          showToast.dismiss(toastId);
          showToast.error('Không tìm thấy cột "Biển số xe" trong file Excel. Vui lòng kiểm tra lại định dạng file.');
          return;
        }
        
        // Count rows with license plates filled
        const dataRows = data.slice(1); // Skip header
        const totalRows = dataRows.filter(row => row && row.length > 0).length;
        const rowsWithLicensePlates = dataRows.filter(row => {
          const licensePlate = row[licensePlateColIndex];
          return licensePlate && 
                 typeof licensePlate === 'string' && 
                 licensePlate.trim() !== '' &&
                 licensePlate.trim() !== 'N/A';
        }).length;
        
        console.log(`Total rows: ${totalRows}, Rows with license plates: ${rowsWithLicensePlates}`);
        
        // Validate if license plates are sufficient
        if (rowsWithLicensePlates === 0) {
          showToast.dismiss(toastId);
          showToast.error(`Không có biển số nào được điền trong file Excel. Vui lòng điền biển số vào cột "Biển số xe" (ví dụ: 51A-123.45)`);
          return;
        }
        
        if (rowsWithLicensePlates < totalRows) {
          const missingCount = totalRows - rowsWithLicensePlates;
          showToast.dismiss(toastId);
          showToast.error(
            `File Excel thiếu ${missingCount} biển số! Có ${totalRows} xe nhưng chỉ điền ${rowsWithLicensePlates} biển số. Vui lòng điền đầy đủ biển số cho tất cả các xe.`
          );
          return;
        }
        
        console.log('✅ Validation passed, all rows have license plates');
        showToast.dismiss(toastId);
        
        // Lưu file đã validate thành công
        setSelectedFile(file);
        showToast.success(`Đã chọn file "${file.name}" với ${rowsWithLicensePlates} biển số. Nhấn "Nộp" để import.`);
        
      } catch (validationError) {
        console.error('Validation error:', validationError);
        showToast.dismiss(toastId);
        showToast.error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
        return;
      }
    } catch (error: any) {
      console.error('Error selecting file:', error);
      showToast.error('Có lỗi xảy ra khi kiểm tra file');
    }
  };

  // Handle submit import - thực sự import file đã chọn
  const handleSubmitImport = async () => {
    if (!selectedFile) {
      showToast.warning('Vui lòng chọn file Excel trước');
      return;
    }
    
    let toastId: any = null;
    
    try {
      setLoading(true);
      setImportResult(null);
      
      console.log('Importing file:', selectedFile.name, 'size:', selectedFile.size, 'type:', selectedFile.type);
      
      toastId = showToast.loading('Đang import biển số...');
      
      const response = await vehicleService.importLicensePlates(selectedFile);
      
      showToast.dismiss(toastId);
      toastId = null;
      
      console.log('Import response full:', response);
      console.log('Import response.data:', response.data);
      console.log('Import response.data type:', typeof response.data);
      
      // Check if response has the expected structure
      if (!response || typeof response !== 'object') {
        throw new Error('Response không đúng format. API có thể chưa được implement.');
      }
      
      // Try to extract data from different possible response structures
      const importData: any = response.data || response;
      
      console.log('Import data extracted:', importData);
      
      // Set import result - fix để match response structure
      const totalImported = importData?.updated || importData?.totalImported || importData?.imported?.length || 0;
      const totalFailed = importData?.failed || importData?.totalFailed || importData?.failed?.length || 0;
      const failedItems = importData?.details?.failures || importData?.failed || [];
      
      console.log('Calculated values:', {
        totalImported,
        totalFailed,
        failedItems,
        importDataUpdated: importData?.updated,
        importDataFailed: importData?.failed
      });
      
      setImportResult({
        success: totalImported,
        failed: totalFailed,
        errors: failedItems
      });
      
      // Clear file đã chọn sau khi import
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Scroll xuống phần kết quả sau một chút delay
      setTimeout(() => {
        importResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
      
      if (totalImported > 0) {
        showToast.success(`Import thành công ${totalImported} biển số!`);
        onSuccess(); // Refresh vehicle list
      } else if (totalFailed > 0) {
        showToast.warning(`Có ${totalFailed} lỗi khi import. Vui lòng xem chi tiết bên dưới.`);
      } else {
        showToast.info('Không có dữ liệu nào được import. Vui lòng kiểm tra file Excel.');
      }
    } catch (error: any) {
      // Dismiss loading toast if it exists
      if (toastId) {
        showToast.dismiss(toastId);
        toastId = null;
      }
      
      console.error('Error importing license plates:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = 'Không thể import biển số';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setImportResult({
        success: 0,
        failed: 1,
        errors: [{ 
          licensePlate: 'Lỗi hệ thống', 
          error: `${errorMessage}` 
        }]
      });
      
      // Clear file đã chọn khi có lỗi
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Scroll xuống phần kết quả lỗi
      setTimeout(() => {
        importResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
      
      showToast.error(`Lỗi import: ${errorMessage}`);
    } finally {
      // Make sure to dismiss toast in finally block as well
      if (toastId) {
        showToast.dismiss(toastId);
      }
      
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <FileSpreadsheet className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Export/ Import biển số
                      </h2>
                      <p className="text-green-100 text-sm mt-1">
                        Xuất danh sách xe và import biển số từ Excel
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={loading}
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
                    Quy trình Import biển số
                  </h4>
                  <ol className="text-sm text-gray-700 space-y-1.5">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span><strong>Cách 1:</strong> Sử dụng file từ "Tạo xe hàng loạt" (đã có sẵn vehicle_id)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span><strong>Cách 2:</strong> Nhấn "Export danh sách xe" để tải danh sách xe chưa có biển số</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>Mở file Excel và điền biển số vào cột "license_plate" (VD: 51A-123.45)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">4.</span>
                      <span>Lưu file (Ctrl+S) và import lại</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>Export danh sách xe</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Xuất file Excel chứa danh sách các xe chưa có biển số để thêm biển số.
              </p>
              
              {/* Thống kê xe chưa có biển số */}
              {draftVehicles.length > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Tìm thấy {draftVehicles.length} xe chưa có biển số
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Không có xe nào chưa có biển số
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleExportDraftVehicles}
                disabled={exportLoading || draftVehicles.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Export danh sách xe ({draftVehicles.length})
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
                  <span>Import biển số</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Chọn file Excel đã điền biển số để cập nhật vào hệ thống.
              </p>
              
              
              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>KHÔNG</strong> xóa hoặc thay đổi cột <strong>vehicle_id</strong></li>
                      <li>Biển số đúng định dạng: VD: 51A-123.45</li>
                      <li>File phải là Excel (.xlsx hoặc .xls)</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                aria-label="Chọn file Excel biển số"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 py-3 rounded-lg font-medium transition-all duration-200"
              >
                <Upload className="h-5 w-5 mr-2" />
                Chọn file Excel
              </Button>

              {/* Hiển thị file đã chọn */}
              {selectedFile && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      title="Xóa file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Button Nộp */}
              {selectedFile && (
                <Button
                  onClick={handleSubmitImport}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Nộp và Import Biển Số
                    </>
                  )}
                </Button>
              )}
              </CardContent>
            </Card>

            {/* Import Result */}
            {importResult && (
              <Card 
                ref={importResultRef}
                className={`border-2 ${
                  importResult.success > 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                }`}
              >
                <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                    importResult.success > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {importResult.success > 0 ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Kết quả import
                    </h4>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Thành công:</span>
                    <span className="font-semibold text-green-600">{importResult.success} biển số</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Thất bại:</span>
                    <span className="font-semibold text-red-600">{importResult.failed} biển số</span>
                  </div>
                </div>

                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-red-700 mb-2">Chi tiết lỗi:</h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-100 p-2 rounded">
                          {error.licensePlate}: {error.error}
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ...và {importResult.errors.length - 10} lỗi khác
                        </p>
                      )}
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
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


