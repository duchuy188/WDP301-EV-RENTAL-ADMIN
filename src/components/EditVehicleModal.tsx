import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { vehicleService } from './service/vehicleService';
import { stationService } from './service/stationService';
import type { VehicleUI, UpdateVehicleRequest, VehicleStatus, VehicleType } from './service/type/vehicleTypes';
import type { Station } from './service/type/stationTypes';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleUI | null;
  onVehicleUpdated: () => void;
}

export function EditVehicleModal({ isOpen, onClose, vehicle, onVehicleUpdated }: EditVehicleModalProps) {
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    type: 'scooter' as VehicleType,
    batteryCapacity: 2.5,
    maxRange: 80,
    batteryLevel: 100,
    pricePerDay: 150000,
    depositPercentage: 50,
    status: 'available' as VehicleStatus,
    stationId: '',
    isActive: true
  });

  // Load form data when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        licensePlate: vehicle.licensePlate || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        type: vehicle.type || 'scooter',
        batteryCapacity: vehicle.batteryCapacity || 2.5,
        maxRange: vehicle.maxRange || 80,
        batteryLevel: vehicle.batteryLevel || 100,
        pricePerDay: vehicle.pricePerDay || 150000,
        depositPercentage: vehicle.depositPercentage || 50,
        status: vehicle.status || 'available',
        stationId: vehicle.stationId || '',
        isActive: vehicle.isActive !== false
      });
    }
  }, [vehicle]);

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
      const response = await stationService.getStations({ page: 1, limit: 100 });
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const updateData: UpdateVehicleRequest = {
        name: formData.name,
        license_plate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        color: formData.color,
        type: formData.type,
        battery_capacity: formData.batteryCapacity,
        max_range: formData.maxRange,
        price_per_day: formData.pricePerDay,
        deposit_percentage: formData.depositPercentage,
        station_id: formData.stationId || undefined,
        isActive: formData.isActive
      };

      await vehicleService.updateVehicle(vehicle.id, updateData);
      
      // Update battery level separately if changed
      if (formData.batteryLevel !== vehicle.batteryLevel) {
        await vehicleService.updateVehicleBattery(vehicle.id, { current_battery: formData.batteryLevel });
      }

      // Update status separately if changed
      if (formData.status !== vehicle.status) {
        await vehicleService.updateVehicleStatus(vehicle.id, { status: formData.status });
      }

      setSuccess(true);
      setTimeout(() => {
        onVehicleUpdated();
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      setError(error.message || 'Có lỗi xảy ra khi cập nhật xe');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Chỉnh sửa xe
            </h2>
            <p className="text-sm text-gray-500">
              Cập nhật thông tin xe {vehicle?.licensePlate}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Cập nhật xe thành công!
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên xe *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biển số *
                  </label>
                  <Input
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thương hiệu *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
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
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc *
                  </label>
                  <ColorPicker
                    value={formData.color}
                    onChange={(color) => setFormData({ ...formData, color })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại xe *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="Chọn loại xe"
                >
                  <option value="scooter">Xe máy điện</option>
                  <option value="motorcycle">Mô tô điện</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông số kỹ thuật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dung lượng pin (kWh) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.batteryCapacity}
                    onChange={(e) => setFormData({ ...formData, batteryCapacity: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quãng đường tối đa (km) *
                  </label>
                  <Input
                    type="number"
                    min="50"
                    max="200"
                    value={formData.maxRange}
                    onChange={(e) => setFormData({ ...formData, maxRange: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức pin hiện tại (%) *
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryLevel}
                  onChange={(e) => setFormData({ ...formData, batteryLevel: parseInt(e.target.value) })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Giá thuê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá thuê (VNĐ/ngày) *
                  </label>
                  <Input
                    type="number"
                    min="50000"
                    max="500000"
                    step="1000"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phần trăm cọc (%) *
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.depositPercentage}
                    onChange={(e) => setFormData({ ...formData, depositPercentage: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status and Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái và vị trí</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    aria-label="Chọn trạng thái xe"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="rented">Đang thuê</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="broken">Hỏng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạm phân bổ
                  </label>
                  <select
                    value={formData.stationId}
                    onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onFocus={() => !stations.length && loadStations()}
                    aria-label="Chọn trạm phân bổ"
                  >
                    <option value="">Chưa phân bổ</option>
                    {stations.map((station) => (
                      <option key={station._id} value={station._id}>
                        {station.name} - {station.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Xe đang hoạt động
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Đang cập nhật...' : 'Cập nhật xe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}