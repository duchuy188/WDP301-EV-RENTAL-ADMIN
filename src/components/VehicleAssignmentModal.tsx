import { useState, useEffect } from 'react';
import { X, MapPin, Car, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { Badge } from './ui/badge';
import { vehicleService } from './service/vehicleService';
import { stationService } from './service/stationService';
import type { Station } from './service/type/stationTypes';
import type { AssignVehicleResponse, VehicleStatus } from './service/type/vehicleTypes';

interface VehicleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VehicleAssignmentModal({ isOpen, onClose, onSuccess }: VehicleAssignmentModalProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState<'draft'>('draft'); // Chỉ phân bổ xe draft
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [assignResult, setAssignResult] = useState<AssignVehicleResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStations();
      loadModels();
      setAssignResult(null);
      setSelectedStationId('');
      setQuantity(1);
      setColor('');
      setModel('');
      setStatus('draft');
    }
  }, [isOpen]);

  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await stationService.getStations({ page: 1, limit: 100 });
      console.log('VehicleAssignmentModal - Stations response:', response);
      console.log('VehicleAssignmentModal - Stations array:', response.stations);
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStationId) {
      alert('Vui lòng chọn trạm');
      return;
    }

    if (!color.trim()) {
      alert('Vui lòng nhập màu xe');
      return;
    }

    if (!model.trim()) {
      alert('Vui lòng nhập model xe');
      return;
    }

    if (quantity <= 0) {
      alert('Số lượng xe phải lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      const response = await vehicleService.assignVehiclesByQuantity({
        color: color.trim(),
        model: model.trim(),
        status: status,
        quantity: quantity,
        station_id: selectedStationId
      });
      
      console.log('VehicleAssignmentModal - Assign response:', response);
      console.log('VehicleAssignmentModal - Response data:', response.data);
      
      // Handle different response structures
      const assignData = response.data || response;
      
      // Ensure we have the required properties with fallbacks
      const normalizedResult: AssignVehicleResponse = {
        message: assignData.message || 'Phân bổ xe thành công',
        assignedVehicles: assignData.assignedVehicles || [],
        totalAssigned: assignData.totalAssigned || assignData.assignedVehicles?.length || 0
      };
      
      console.log('VehicleAssignmentModal - Normalized result:', normalizedResult);
      setAssignResult(normalizedResult);
      
      if (normalizedResult.totalAssigned > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error assigning vehicles:', error);
      alert('Có lỗi xảy ra khi phân bổ xe. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStation = stations.find(s => s._id === selectedStationId);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop flex items-center justify-center"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Phân bổ xe theo số lượng
              </h2>
              <p className="text-sm text-gray-500">
                Phân bổ xe có trạng thái "Draft" và đã có biển số xe cho trạm
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!assignResult ? (
            <form onSubmit={handleAssign} className="space-y-6">
              {/* Vehicle Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Màu xe *
                  </label>
                  <ColorPicker
                    value={color}
                    onChange={setColor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model xe *
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loadingModels}
                    aria-label="Chọn model xe"
                  >
                    <option value="">
                      {loadingModels ? 'Đang tải...' : 'Chọn model xe'}
                    </option>
                    {models.map((modelOption) => (
                      <option key={modelOption} value={modelOption}>
                        {modelOption}
                      </option>
                    ))}
                  </select>
                  {models.length === 0 && !loadingModels && (
                    <p className="text-xs text-gray-500 mt-1">
                      Không có model xe nào trong hệ thống
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng xe cần phân bổ *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chỉ phân bổ xe có trạng thái "Draft" và đã có biển số xe
                </p>
              </div>

              {/* Station Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn trạm *
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingStations}
                  aria-label="Chọn trạm"
                >
                  <option value="">
                    {loadingStations ? 'Đang tải...' : 'Chọn trạm...'}
                  </option>
                  {stations.map((station) => (
                    <option key={station._id} value={station._id}>
                      {station.name} - {station.address}
                    </option>
                  ))}
                </select>
                {loadingStations && (
                  <p className="text-xs text-gray-500 mt-1">Đang tải danh sách trạm...</p>
                )}
                {!loadingStations && stations.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Không có trạm nào trong hệ thống hoặc lỗi kết nối
                  </p>
                )}
                {!loadingStations && stations.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tìm thấy {stations.length} trạm
                  </p>
                )}
              </div>

              {/* Station Info */}
              {selectedStation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <span>Thông tin trạm</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Tên trạm</p>
                        <p className="text-sm text-gray-900">{selectedStation.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Trạng thái</p>
                        <Badge className={selectedStation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {selectedStation.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-700">Địa chỉ</p>
                        <p className="text-sm text-gray-900">{selectedStation.address}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Sức chứa</p>
                        <p className="text-sm text-gray-900">{selectedStation.max_capacity} xe</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Xe hiện tại</p>
                        <p className="text-sm text-gray-900">{selectedStation.current_vehicles || 0} xe</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info about draft vehicles */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Thông tin quan trọng</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Hệ thống chỉ phân bổ những xe có:
                      <br />• Trạng thái: <strong>Draft</strong>
                      <br />• Đã có biển số xe
                      <br />• Khớp với màu và model được chọn
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              {selectedStation && selectedStation.current_vehicles && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Lưu ý về sức chứa</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Trạm hiện có {selectedStation.current_vehicles} xe. 
                        Sức chứa tối đa: {selectedStation.max_capacity} xe.
                        {selectedStation.current_vehicles + quantity > selectedStation.max_capacity && (
                          <span className="block text-red-600 font-medium mt-1">
                            ⚠️ Vượt quá sức chứa! Chỉ có thể thêm tối đa {selectedStation.max_capacity - selectedStation.current_vehicles} xe.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !selectedStationId || !color.trim() || !model.trim() || quantity <= 0}
                >
                  {loading ? 'Đang phân bổ...' : 'Phân bổ xe'}
                </Button>
              </div>
            </form>
          ) : (
            /* Assignment Result */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Kết quả phân bổ</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Car className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Đã phân bổ thành công {assignResult?.totalAssigned || 0} xe
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        {assignResult?.message || 'Phân bổ xe thành công'}
                      </p>
                    </div>

                    {assignResult?.assignedVehicles && assignResult.assignedVehicles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Danh sách xe đã phân bổ:</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {assignResult.assignedVehicles.map((vehicle, index) => (
                            <div key={vehicle._id || vehicle.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="p-1 bg-blue-100 rounded">
                                  <Car className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {vehicle.license_plate || vehicle.licensePlate || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {vehicle.brand || 'N/A'} {vehicle.model || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-800">
                                  {vehicle.current_battery || vehicle.batteryLevel || 0}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button onClick={onClose}>
                  Đóng
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setAssignResult(null);
                    setSelectedStationId('');
                    setQuantity(1);
                    setColor('');
                    setModel('');
                    setStatus('draft');
                  }}
                >
                  Phân bổ thêm
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
