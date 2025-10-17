import { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, Plus, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { Badge } from './ui/badge';
import { vehicleService } from './service/vehicleService';
import { stationService } from './service/stationService';
import type { 
  BulkCreateVehicleRequest, 
  CreateVehicleRequest, 
  BulkCreateResponse,
  ImportLicensePlatesResponse,
  ImportPricingUpdatesResponse
} from './service/type/vehicleTypes';
import type { Station } from './service/type/stationTypes';

interface BulkVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: TabType;
}

type TabType = 'bulk-create' | 'import-plates' | 'pricing';

export function BulkVehicleModal({ isOpen, onClose, onSuccess, defaultTab = 'bulk-create' }: BulkVehicleModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  
  // Bulk Create State
  const [bulkFormData, setBulkFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    type: 'scooter' as 'scooter' | 'motorcycle',
    batteryCapacity: 2.5,
    maxRange: 80,
    pricePerDay: 150000,
    depositPercentage: 50,
    quantity: 1,
    stationId: ''
  });
  
  // Dropdown data
  const [models, setModels] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkCreateResponse | null>(null);

  // Import License Plates State
  const [importPlatesResult, setImportPlatesResult] = useState<ImportLicensePlatesResponse | null>(null);
  const licensePlatesFileRef = useRef<HTMLInputElement>(null);

  // Pricing State
  const [pricingResult, setPricingResult] = useState<ImportPricingUpdatesResponse | null>(null);
  const pricingFileRef = useRef<HTMLInputElement>(null);

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStations();
      loadModels();
      loadBrands();
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await stationService.getStations({ page: 1, limit: 100 });
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
    } finally {
      setLoadingStations(false);
    }
  };

  const loadModels = async () => {
    try {
      setLoadingModels(true);
      const response = await vehicleService.getVehicleModels();
      setModels(response.data || []);
    } catch (error) {
      console.error('Error loading vehicle models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const response = await vehicleService.getVehicleBrands();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Error loading vehicle brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bulkFormData.quantity || bulkFormData.quantity <= 0) {
      alert('Vui lòng nhập số lượng xe cần tạo');
      return;
    }

    // Create the request body matching the API specification
    const requestBody = {
      model: bulkFormData.model,
      year: bulkFormData.year,
      color: bulkFormData.color,
      type: bulkFormData.type,
      battery_capacity: bulkFormData.batteryCapacity,
      max_range: bulkFormData.maxRange,
      current_battery: 100, // Start with full battery
      price_per_day: bulkFormData.pricePerDay,
      deposit_percentage: bulkFormData.depositPercentage,
      quantity: bulkFormData.quantity,
      export_excel: true, // Export Excel file after creating vehicles
      images: [] // Empty images array
    };

    try {
      setLoading(true);
      
      // First create vehicles and get Excel file
      const excelBlob = await vehicleService.bulkCreateVehicles(requestBody);
      
      // Download the Excel file with created vehicles
      const url = window.URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicles-created-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setBulkResult({
        created: [], // We don't get vehicle data when export_excel=true
        failed: [],
        totalCreated: bulkFormData.quantity,
        totalFailed: 0
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error bulk creating vehicles:', error);
      setBulkResult({
        created: [],
        failed: [{ data: { licensePlate: 'Error' }, error: error.message || 'Unknown error' }],
        totalCreated: 0,
        totalFailed: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      setLoading(true);
      
      // Request Excel template
      const requestBody = {
        model: 'Template',
        year: 2023,
        color: 'Template',
        type: 'scooter',
        battery_capacity: 2.5,
        max_range: 80,
        current_battery: 100,
        price_per_day: 150000,
        deposit_percentage: 50,
        quantity: 1,
        export_excel: true, // Request Excel template
        images: []
      };

      const blob = await vehicleService.bulkCreateVehicles(requestBody);
      
      // Create download link for Excel file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-create-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting template:', error);
      alert('Có lỗi xảy ra khi xuất template');
    } finally {
      setLoading(false);
    }
  };

  const handleImportLicensePlates = async (file: File) => {
    try {
      setLoading(true);
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }
      
      const response = await vehicleService.importLicensePlates(file);
      setImportPlatesResult(response.data);
      
      if (response.data.totalImported > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error importing license plates:', error);
      
      // Display detailed error message
      let errorMessage = 'Có lỗi xảy ra khi import biển số';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file Excel';
        } else if (status === 403) {
          errorMessage = 'Không có quyền thực hiện thao tác này';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin';
        } else {
          errorMessage = data.message || `Lỗi ${status}: ${error.message}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
      }
      
      // Set error result to display in UI
      setImportPlatesResult({
        imported: [],
        failed: [{ licensePlate: 'System Error', error: errorMessage }],
        totalImported: 0,
        totalFailed: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicensePlateTemplate = async () => {
    try {
      setLoading(true);
      
      // Create a simple Excel template for license plates
      const templateData = [
        ['vehicle_id', 'license_plate', 'notes'],
        ['VH001', '51A-123.45', 'Ví dụ biển số xe máy điện'],
        ['VH002', '30B-678.90', 'Ví dụ biển số xe máy điện'],
        ['VH003', '29C-111.22', 'Ví dụ biển số mô tô điện']
      ];
      
      // Convert to CSV format and create blob
      const csvContent = templateData.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-plate-template-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error creating license plate template:', error);
      alert('Có lỗi xảy ra khi tạo template');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPricingTemplate = async () => {
    try {
      setLoading(true);
      const blob = await vehicleService.exportPricingTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pricing-template-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting pricing template:', error);
      
      // Display detailed error message
      let errorMessage = 'Có lỗi xảy ra khi xuất template giá';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 404) {
          errorMessage = 'Không tìm thấy xe nào trong hệ thống. Vui lòng tạo xe trước khi xuất template giá.';
        } else if (status === 403) {
          errorMessage = 'Không có quyền thực hiện thao tác này';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau';
        } else {
          errorMessage = data.message || `Lỗi ${status}: ${error.message}`;
        }
      } else if (error.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportPricingUpdates = async (file: File) => {
    try {
      setLoading(true);
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
        return;
      }
      
      const response = await vehicleService.importPricingUpdates(file);
      setPricingResult(response.data);
      
      if (response.data.totalUpdated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error importing pricing updates:', error);
      
      // Display detailed error message
      let errorMessage = 'Có lỗi xảy ra khi import cập nhật giá';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file Excel';
        } else if (status === 403) {
          errorMessage = 'Không có quyền thực hiện thao tác này';
        } else if (status === 404) {
          errorMessage = 'Không tìm thấy xe phù hợp trong file Excel';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau hoặc liên hệ admin';
        } else {
          errorMessage = data.message || `Lỗi ${status}: ${error.message}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng';
      }
      
      // Set error result to display in UI
      setPricingResult({
        updated: [],
        failed: [{ row: 1, data: { licensePlate: 'System Error' }, error: errorMessage }],
        totalUpdated: 0,
        totalFailed: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBulkFormData({
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      type: 'scooter',
      batteryCapacity: 2.5,
      maxRange: 80,
      pricePerDay: 150000,
      depositPercentage: 50,
      quantity: 1,
      stationId: ''
    });
    setBulkResult(null);
    setImportPlatesResult(null);
    setPricingResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Quản lý xe hàng loạt
            </h2>
            <p className="text-sm text-gray-500">
              Tạo xe, import biển số và cập nhật giá hàng loạt
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('bulk-create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bulk-create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Tạo hàng loạt
            </button>
            <button
              onClick={() => setActiveTab('import-plates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import-plates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Import biển số
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 inline mr-2" />
              Cập nhật giá
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'bulk-create' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Quy trình tạo xe hàng loạt
                </h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Điền thông tin xe (model, màu sắc, giá thuê...)</li>
                  <li>2. Nhập số lượng xe cần tạo</li>
                  <li>3. Hệ thống tạo xe và xuất file Excel</li>
                  <li>4. Mở file Excel và thêm biển số xe</li>
                  <li>5. Sử dụng tab "Import biển số" để cập nhật</li>
                </ol>
              </div>
              
              <form onSubmit={handleBulkCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thương hiệu *
                    </label>
                    <select
                      value={bulkFormData.brand}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, brand: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingBrands}
                      aria-label="Chọn thương hiệu xe"
                    >
                      <option value="">
                        {loadingBrands ? 'Đang tải...' : 'Chọn thương hiệu'}
                      </option>
                      {brands.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                    {brands.length === 0 && !loadingBrands && (
                      <p className="text-xs text-gray-500 mt-1">
                        Không có thương hiệu nào trong hệ thống
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model *
                    </label>
                    <select
                      value={bulkFormData.model}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loadingModels}
                      aria-label="Chọn model xe"
                    >
                      <option value="">
                        {loadingModels ? 'Đang tải...' : 'Chọn model'}
                      </option>
                      {models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    {models.length === 0 && !loadingModels && (
                      <p className="text-xs text-gray-500 mt-1">
                        Không có model nào trong hệ thống
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Năm sản xuất *
                    </label>
                    <Input
                      type="number"
                      min="2000"
                      max="2030"
                      value={bulkFormData.year}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Màu sắc *
                    </label>
                    <ColorPicker
                      value={bulkFormData.color}
                      onChange={(color) => setBulkFormData({ ...bulkFormData, color })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại xe *
                    </label>
                    <select
                      value={bulkFormData.type}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value as 'scooter' | 'motorcycle' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      aria-label="Chọn loại xe"
                    >
                      <option value="scooter">Xe máy điện</option>
                      <option value="motorcycle">Mô tô điện</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dung lượng pin (kWh) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={bulkFormData.batteryCapacity}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, batteryCapacity: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quãng đường tối đa (km) *
                    </label>
                    <Input
                      type="number"
                      min="50"
                      max="200"
                      value={bulkFormData.maxRange}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, maxRange: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá thuê (VNĐ/ngày) *
                    </label>
                    <Input
                      type="number"
                      min="50000"
                      max="500000"
                      step="1000"
                      value={bulkFormData.pricePerDay}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, pricePerDay: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phần trăm cọc (%) *
                    </label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={bulkFormData.depositPercentage}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, depositPercentage: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạm phân bổ (tùy chọn)
                  </label>
                  <select
                    value={bulkFormData.stationId}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, stationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={() => !stations.length && loadStations()}
                    aria-label="Chọn trạm phân bổ"
                  >
                    <option value="">Chưa phân bổ</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name} - {station.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng xe cần tạo *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={bulkFormData.quantity}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, quantity: parseInt(e.target.value) || 1 })}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Hệ thống sẽ tạo xe và xuất file Excel để bạn thêm biển số
                  </p>
                </div>

                <div className="space-y-3">
                  <Button type="submit" disabled={loading} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    {loading ? 'Đang tạo xe và xuất Excel...' : 'Tạo xe hàng loạt + Xuất Excel'}
                  </Button>
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleExportTemplate}
                      disabled={loading}
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Đang xuất...' : 'Chỉ xuất Template trống'}
                    </Button>
                  </div>
                </div>
              </form>

              {bulkResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kết quả tạo xe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bulkResult.totalCreated > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">
                            Đã tạo thành công {bulkResult.totalCreated} xe
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-800">
                                File Excel đã được tải xuống
                              </h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Vui lòng mở file Excel, thêm biển số xe vào cột tương ứng, 
                                sau đó sử dụng tính năng "Import biển số" để cập nhật.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                          <span className="text-sm">Có lỗi xảy ra khi tạo xe</span>
                        </div>
                        {bulkResult.failed.length > 0 && (
                          <div className="space-y-1">
                            {bulkResult.failed.map((item, index) => (
                              <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                {item.error}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'import-plates' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import biển số từ Excel</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload file Excel chứa danh sách biển số xe cần import vào hệ thống.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Hướng dẫn sử dụng
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Tạo xe hàng loạt để có file Excel với danh sách xe</li>
                    <li>2. Hoặc tải template mẫu bên dưới</li>
                    <li>3. Điền biển số xe vào cột "license_plate"</li>
                    <li>4. Upload file Excel đã điền biển số</li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Button
                    onClick={handleCreateLicensePlateTemplate}
                    disabled={loading}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải template mẫu
                  </Button>
                  
                  <div>
                    <input
                      ref={licensePlatesFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportLicensePlates(file);
                        }
                      }}
                      className="hidden"
                      aria-label="Chọn file Excel biển số"
                    />
                    
                    <Button
                      onClick={() => licensePlatesFileRef.current?.click()}
                      disabled={loading}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? 'Đang import...' : 'Chọn file Excel'}
                    </Button>
                  </div>
                </div>
              </div>

              {importPlatesResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kết quả import biển số</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Thành công: {importPlatesResult.totalImported}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Thất bại: {importPlatesResult.totalFailed}</span>
                      </div>
                    </div>
                    
                    {importPlatesResult.failed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Lỗi:</h4>
                        <div className="space-y-1">
                          {importPlatesResult.failed.map((item, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              {item.licensePlate}: {item.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cập nhật giá hàng loạt</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tải template Excel, cập nhật giá và import lại để cập nhật giá hàng loạt.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Quy trình cập nhật giá
                  </h4>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Tải template Excel chứa danh sách xe hiện tại</li>
                    <li>2. Cập nhật giá trong cột "price_per_day"</li>
                    <li>3. Có thể cập nhật "deposit_percentage" nếu cần</li>
                    <li>4. Upload file Excel đã cập nhật giá</li>
                  </ol>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={handleExportPricingTemplate}
                    disabled={loading}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Đang tải...' : 'Tải template Excel'}
                  </Button>
                  
                  <div>
                    <input
                      ref={pricingFileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportPricingUpdates(file);
                        }
                      }}
                      className="hidden"
                      aria-label="Chọn file Excel cập nhật giá"
                    />
                    
                    <Button
                      onClick={() => pricingFileRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {loading ? 'Đang import...' : 'Import cập nhật giá'}
                    </Button>
                  </div>
                </div>
              </div>

              {pricingResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kết quả cập nhật giá</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Cập nhật: {pricingResult.totalUpdated}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm">Thất bại: {pricingResult.totalFailed}</span>
                      </div>
                    </div>
                    
                    {pricingResult.updated.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-green-600 mb-2">Đã cập nhật:</h4>
                        <div className="space-y-1">
                          {pricingResult.updated.slice(0, 5).map((item, index) => (
                            <div key={index} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                              {item.licensePlate}: {item.newPrice.toLocaleString('vi-VN')} VNĐ
                            </div>
                          ))}
                          {pricingResult.updated.length > 5 && (
                            <div className="text-sm text-gray-500">
                              ... và {pricingResult.updated.length - 5} xe khác
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {pricingResult.failed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Lỗi:</h4>
                        <div className="space-y-1">
                          {pricingResult.failed.map((item, index) => (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              Dòng {item.row}: {item.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={handleClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
