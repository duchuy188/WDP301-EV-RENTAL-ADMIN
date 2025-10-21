import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Car, AlertCircle, CheckCircle, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ColorPicker } from './ui/color-picker';
import { Badge } from './ui/badge';
import { vehicleService } from './service/vehicleService';
import { stationService } from './service/stationService';
import { showToast } from '../lib/toast';
import type { Station } from './service/type/stationTypes';
import type { AssignVehicleResponse, WithdrawVehiclesResponse } from './service/type/vehicleTypes';

interface VehicleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VehicleAssignmentModal({ isOpen, onClose, onSuccess }: VehicleAssignmentModalProps) {
  // Tab state: 'assign' or 'withdraw'
  const [activeTab, setActiveTab] = useState<'assign' | 'withdraw'>('assign');
  
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
  const [withdrawResult, setWithdrawResult] = useState<WithdrawVehiclesResponse | null>(null);
  
  // Available draft vehicles count (for assign tab)
  const [availableDraftCount, setAvailableDraftCount] = useState<number | null>(null);
  const [checkingDraftCount, setCheckingDraftCount] = useState(false);
  
  // Available vehicles at station count (for withdraw tab)
  const [availableAtStationCount, setAvailableAtStationCount] = useState<number | null>(null);
  const [checkingAtStationCount, setCheckingAtStationCount] = useState(false);
  
  // Backend error state for detailed display
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStations();
      loadModels();
      setActiveTab('assign');
      setAssignResult(null);
      setWithdrawResult(null);
      setSelectedStationId('');
      setQuantity(1);
      setColor('');
      setModel('');
      setStatus('draft');
      setAvailableDraftCount(null);
      setAvailableAtStationCount(null);
      setBackendError(null);
    }
  }, [isOpen]);

  // Clear backend error when filter changes
  useEffect(() => {
    setBackendError(null);
  }, [model, color, quantity, selectedStationId]);

  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await stationService.getStations({ page: 1, limit: 100 });
      console.log('VehicleAssignmentModal - Stations response:', response);
      console.log('VehicleAssignmentModal - Stations array:', response.stations);
      setStations(response.stations || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      showToast.error('Không thể tải danh sách trạm');
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
      showToast.error('Không thể tải danh sách model xe');
    } finally {
      setLoadingModels(false);
    }
  };

  const checkAvailableDraftVehicles = useCallback(async () => {
    if (!model || !color) {
      setAvailableDraftCount(null);
      return;
    }

    try {
      setCheckingDraftCount(true);
      
      console.log('=== CHECKING DRAFT VEHICLES ===');
      console.log('Filter:', { model, color, status: 'draft' });

      // Helper: normalize string for robust comparison (remove accents, lower-case)
      const normalize = (s: string = '') => s
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();
      const normalizedModel = normalize(model);
      const normalizedColor = normalize(color);
      
      // Get draft vehicles (server may ignore filters -> we still filter on client)
      const response = await vehicleService.getVehiclesForAdmin({
        page: 1,
        limit: 1000,
        status: 'draft',
        model: model,
        color: color
      });
      
      const allVehicles = response.data || [];
      console.log('Total draft vehicles (raw from API):', allVehicles.length);
      
      // Filter by license plate validity, model and color (client-side safety)
      const vehiclesWithPlateAndMatching = allVehicles.filter(v => {
        const hasValidPlate = v.licensePlate && 
          v.licensePlate.trim() !== '' &&
          v.licensePlate !== 'N/A' &&
          v.licensePlate !== 'Chưa gán biển' &&
          !v.licensePlate.toLowerCase().includes('chưa');
        const matchModel = normalize(v.model) === normalizedModel;
        const matchColor = normalize(v.color) === normalizedColor;
        return hasValidPlate && matchModel && matchColor;
      });
      
      console.log('After client-side filter (model+color+plate):', vehiclesWithPlateAndMatching.length);
      console.log('Vehicles sample:', vehiclesWithPlateAndMatching.slice(0, 5).map(v => ({
        id: v.id,
        model: v.model,
        color: v.color,
        plate: v.licensePlate
      })));
      
      setAvailableDraftCount(vehiclesWithPlateAndMatching.length);
    } catch (error) {
      console.error('Error checking available draft vehicles:', error);
      setAvailableDraftCount(null);
    } finally {
      setCheckingDraftCount(false);
    }
  }, [model, color]);

  // Check draft vehicles when model or color changes
  useEffect(() => {
    if (model && color) {
      checkAvailableDraftVehicles();
    } else {
      setAvailableDraftCount(null);
    }
  }, [model, color, checkAvailableDraftVehicles]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedStationId) {
      showToast.warning('Vui lòng chọn trạm');
      return;
    }

    if (!color.trim()) {
      showToast.warning('Vui lòng chọn màu xe');
      return;
    }

    if (!model.trim()) {
      showToast.warning('Vui lòng chọn model xe');
      return;
    }

    if (quantity <= 0) {
      showToast.warning('Số lượng xe phải lớn hơn 0');
      return;
    }

    // Check available draft vehicles
    if (availableDraftCount === 0) {
      showToast.error('Không có xe Draft nào để phân bổ với màu và model đã chọn');
      return;
    }

    if (availableDraftCount !== null && quantity > availableDraftCount) {
      showToast.warning(`Chỉ có ${availableDraftCount} xe Draft khả dụng. Vui lòng giảm số lượng.`);
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        color: color.trim(),
        model: model.trim(),
        status: status,
        quantity: quantity,
        station_id: selectedStationId
      };
      
      console.log('=== PHÂN BỔ XE REQUEST ===');
      console.log('Request body:', requestBody);
      console.log('Available draft count:', availableDraftCount);
      console.log('Selected station:', selectedStation?.name);
      
      const toastId = showToast.loading('Đang phân bổ xe...');
      
      const response = await vehicleService.assignVehiclesByQuantity(requestBody);
      
      showToast.dismiss(toastId);
      
      console.log('=== PHÂN BỔ XE RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response.data.data:', (response.data as any)?.data);
      console.log('Response.data.assignedVehicles:', (response.data as any)?.assignedVehicles);
      
      // Handle different response structures
      const assignData = response.data || response;
      
      // Robustly determine assigned count
      const parseCountFromMessage = (msg?: string): number => {
        if (!msg || typeof msg !== 'string') return 0;
        const match = msg.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      // Cast to any to access potentially nested data property
      const rawData = (assignData as any).data || assignData;
      const assignedCount = (rawData.totalAssigned ?? 0)
        || (Array.isArray(rawData.assignedVehicles) ? rawData.assignedVehicles.length : 0)
        || parseCountFromMessage(rawData.message);
      
      // Ensure we have the required properties with fallbacks
      const normalizedResult: AssignVehicleResponse = {
        message: rawData.message || 'Phân bổ xe thành công',
        assignedVehicles: rawData.assignedVehicles || [],
        totalAssigned: assignedCount
      };
      
      console.log('VehicleAssignmentModal - Normalized result:', normalizedResult);
      setAssignResult(normalizedResult);
      
      if (assignedCount > 0) {
        // Update vehicle status from draft to available after successful assignment
        try {
          const assignedVehicles = normalizedResult.assignedVehicles || [];
          console.log('Assigned vehicles from response:', assignedVehicles);
          
          // If response doesn't include vehicle list, query them
          if (assignedVehicles.length === 0) {
            console.log('Response does not include vehicle list, querying assigned vehicles...');
            
            // Query vehicles that were just assigned (draft status at this station)
            const queryResponse = await vehicleService.getVehiclesForAdmin({
              page: 1,
              limit: quantity,
              status: 'draft',
              model: model,
              color: color
            });
            
            const queriedVehicles = (queryResponse.data || [])
              .filter(v => {
                const vAny = v as any;
                return vAny.stationId === selectedStationId || vAny.station_id === selectedStationId;
              })
              .slice(0, quantity); // Limit to exact quantity assigned
            
            console.log('Queried assigned vehicles:', queriedVehicles);
            
            if (queriedVehicles.length > 0) {
              const updatePromises = queriedVehicles.map(vehicle => {
                const vAny = vehicle as any;
                const vehicleId = vAny._id || vAny.id;
                const vehicleName = vAny.name || vAny.license_plate || vAny.licensePlate;
                console.log(`Updating vehicle ${vehicleId} (${vehicleName}) status to available`);
                return vehicleService.updateVehicleStatus(vehicleId, { status: 'available' });
              });
              
              await Promise.all(updatePromises);
              console.log(`✅ Successfully updated ${queriedVehicles.length} vehicle statuses to available`);
            } else {
              console.warn('⚠️ No vehicles found to update status. They might already be available.');
            }
          } else {
            // Update from response vehicle list
            const updatePromises = assignedVehicles.map(vehicle => {
              const vAny = vehicle as any;
              const vehicleId = vAny._id || vAny.id;
              if (!vehicleId) {
                console.warn('Vehicle missing ID:', vehicle);
                return Promise.resolve();
              }
              const vehicleName = vAny.name || vAny.license_plate || vAny.licensePlate;
              console.log(`Updating vehicle ${vehicleId} (${vehicleName}) status to available`);
              return vehicleService.updateVehicleStatus(vehicleId, { status: 'available' });
            });
            
            await Promise.all(updatePromises);
            console.log(`✅ Successfully updated ${assignedVehicles.length} vehicle statuses to available`);
          }
        } catch (statusError) {
          console.error('❌ Failed to update vehicle statuses:', statusError);
          // Don't fail the whole operation if status update fails
        }
        
        showToast.success(`Phân bổ thành công ${assignedCount} xe!`);
        onSuccess();
      } else {
        showToast.warning('Không có xe nào được phân bổ');
      }
    } catch (error: any) {
      console.error('=== PHÂN BỔ XE ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Extract error message - check both error.message and error.response.data.message
      const rawMessage = error.message || error.response?.data?.message || 'Có lỗi xảy ra khi phân bổ xe';
      let errorMessage = rawMessage;
      
      // Handle specific error codes
      if (error.response?.status === 400 || rawMessage.includes('Không đủ xe')) {
        // Extract the specific backend message
        const backendMessage = rawMessage.includes('Không đủ xe') ? rawMessage : 'Không đủ xe Draft để phân bổ';
        
        errorMessage = backendMessage;
        setBackendError(backendMessage); // Save for UI display
        
        // Add helpful hint if client found vehicles but backend didn't
        if (availableDraftCount !== null && availableDraftCount > 0) {
          showToast.error(
            `Backend: ${backendMessage.split('.')[0]}\n\n` +
            `💡 Client tìm thấy ${availableDraftCount} xe nhưng backend không tìm thấy.\n` +
            `Vui lòng kiểm tra lại dữ liệu xe trong hệ thống.`
          );
        } else {
          showToast.error(errorMessage);
        }
        
        // Log comparison for debugging
        console.log('=== MISMATCH DETECTED ===');
        console.log('Client found:', availableDraftCount, 'vehicles');
        console.log('Backend found: 0 vehicles');
        console.log('Filter used:', { color, model, status });
        
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền phân bổ xe';
        setBackendError(errorMessage);
        showToast.error(errorMessage);
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy trạm. Vui lòng chọn lại trạm.';
        setBackendError(errorMessage);
        showToast.error(errorMessage);
      } else {
        setBackendError(errorMessage);
        showToast.error(`Lỗi: ${errorMessage}`);
      }
      
      // Log additional info for debugging
      console.log('Debug Info:');
      console.log('- Color:', color);
      console.log('- Model:', model);
      console.log('- Quantity:', quantity);
      console.log('- Station ID:', selectedStationId);
      console.log('- Available draft count (client-side):', availableDraftCount);
    } finally {
      setLoading(false);
    }
  };

  // Check available vehicles at station for withdrawal
  const checkAvailableAtStation = useCallback(async () => {
    if (!selectedStationId || !model || !color) {
      setAvailableAtStationCount(null);
      return;
    }

    try {
      setCheckingAtStationCount(true);
      
      console.log('=== CHECKING AVAILABLE VEHICLES AT STATION ===');
      console.log('Filter:', { station_id: selectedStationId, model, color, status: 'available' });

      // Get available vehicles at the selected station (backend should convert draft to available after assignment)
      const response = await vehicleService.getVehiclesForAdmin({
        page: 1,
        limit: 1000,
        status: 'available',
        model: model,
        color: color
      });
      
      const allVehicles = response.data || [];
      console.log('Total available vehicles found:', allVehicles.length);
      console.log('Selected station ID:', selectedStationId);
      
      // Log first vehicle to check field names
      if (allVehicles.length > 0) {
        console.log('Sample vehicle station fields:', {
          stationId: allVehicles[0].stationId,
          station_id: (allVehicles[0] as any).station_id
        });
      }
      
      // Filter by station_id on client-side (check both stationId and station_id)
      const vehiclesAtStation = allVehicles.filter(v => {
        const vAny = v as any;
        const vehicleStationId = v.stationId || vAny.station_id;
        return vehicleStationId === selectedStationId;
      });
      
      console.log('Available vehicles at station:', vehiclesAtStation.length);
      console.log('Vehicles at station:', vehiclesAtStation.map(v => ({
        name: (v as any).name || v.licensePlate,
        model: (v as any).model,
        color: (v as any).color,
        stationId: v.stationId || (v as any).station_id
      })));
      
      setAvailableAtStationCount(vehiclesAtStation.length);
    } catch (error) {
      console.error('Error checking available vehicles at station:', error);
      setAvailableAtStationCount(null);
    } finally {
      setCheckingAtStationCount(false);
    }
  }, [selectedStationId, model, color]);

  // Check available vehicles at station when filters change (for withdraw tab)
  useEffect(() => {
    if (activeTab === 'withdraw' && selectedStationId && model && color) {
      checkAvailableAtStation();
    } else {
      setAvailableAtStationCount(null);
    }
  }, [activeTab, selectedStationId, model, color, checkAvailableAtStation]);

  // Handle withdraw vehicles from station
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedStationId) {
      showToast.warning('Vui lòng chọn trạm');
      return;
    }

    if (!color.trim()) {
      showToast.warning('Vui lòng chọn màu xe');
      return;
    }

    if (!model.trim()) {
      showToast.warning('Vui lòng chọn model xe');
      return;
    }

    if (quantity <= 0) {
      showToast.warning('Số lượng xe phải lớn hơn 0');
      return;
    }

    // Check available vehicles at station
    if (availableAtStationCount === 0) {
      showToast.error('Không có xe Available nào tại trạm này với màu và model đã chọn');
      return;
    }

    if (availableAtStationCount !== null && quantity > availableAtStationCount) {
      showToast.warning(`Chỉ có ${availableAtStationCount} xe Available tại trạm. Vui lòng giảm số lượng.`);
      return;
    }

    try {
      setLoading(true);
      
      const requestBody = {
        station_id: selectedStationId,
        color: color.trim(),
        model: model.trim(),
        quantity: quantity
      };
      
      console.log('=== RÚT XE TỪ TRẠM REQUEST ===');
      console.log('Request body:', requestBody);
      
      const response = await vehicleService.withdrawVehiclesFromStation(requestBody);
      
      console.log('=== RÚT XE TỪ TRẠM RESPONSE ===');
      console.log('Response:', response);
      
      // Normalize response
      const result: WithdrawVehiclesResponse = (response as any).data || response;
      setWithdrawResult(result);
      
      const withdrawnCount = result.withdrawn_count || 0;
      
      if (withdrawnCount > 0) {
        showToast.success(`Đã rút ${withdrawnCount} xe từ trạm ${result.station?.name || 'thành công'}!`);
        onSuccess(); // Refresh vehicle list
        
        // Close modal after success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showToast.warning('Không có xe nào được rút');
      }
    } catch (error: any) {
      console.error('=== RÚT XE TỪ TRẠM ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      
      const rawMessage = error.message || error.response?.data?.message || 'Có lỗi xảy ra khi rút xe';
      let errorMessage = rawMessage;
      
      if (error.response?.status === 400) {
        errorMessage = rawMessage;
        setBackendError(errorMessage);
        showToast.error(errorMessage);
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền rút xe';
        setBackendError(errorMessage);
        showToast.error(errorMessage);
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy trạm';
        setBackendError(errorMessage);
        showToast.error(errorMessage);
      } else {
        setBackendError(errorMessage);
        showToast.error(`Lỗi: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedStation = stations.find(s => s._id === selectedStationId);

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
            onClick={onClose}
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
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
                      <h2 className="text-2xl font-bold text-white">
                        Quản lý phân bổ xe
              </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Phân bổ xe cho trạm hoặc rút xe từ trạm
              </p>
            </div>
          </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
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
                {/* Tabs - Centered at the top of content */}
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('assign')}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all min-w-[140px] ${
                      activeTab === 'assign'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Phân bổ xe</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('withdraw')}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all min-w-[140px] ${
                      activeTab === 'withdraw'
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Minus className="h-4 w-4" />
                    <span>Rút xe</span>
                  </button>
                </div>

                {/* ASSIGN TAB */}
                {activeTab === 'assign' && !assignResult && (
                  <form onSubmit={handleAssign} className="space-y-6" id="assign-vehicle-form">
              {/* Vehicle Filters */}
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 mb-0 mt-0 pb-1 pt-1">
                        <CardTitle className="flex items-center space-x-2 text-base">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span>Phâm bổ xe cho trạm</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Hàng 1: Chọn trạm - full width */}
                <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Chọn trạm <span className="text-red-500">*</span>
                  </label>
                          <select
                            value={selectedStationId}
                            onChange={(e) => setSelectedStationId(e.target.value)}
                            className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                            disabled={loadingStations}
                            aria-label="Chọn trạm"
                          >
                            <option value="">
                              {loadingStations ? 'Đang tải...' : '-- Chọn trạm --'}
                            </option>
                            {stations.map((station) => (
                              <option key={station._id} value={station._id}>
                                {station.name} - {station.address}
                              </option>
                            ))}
                          </select>
                </div>

                        {/* Hàng 2: Model và Số lượng */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Model xe - cột trái */}
                <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Model xe <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                              className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={loadingModels}
                    aria-label="Chọn model xe"
                  >
                    <option value="">
                                {loadingModels ? 'Đang tải...' : '-- Chọn model xe --'}
                    </option>
                    {models.map((modelOption) => (
                      <option key={modelOption} value={modelOption}>
                        {modelOption}
                      </option>
                    ))}
                  </select>
                  {models.length === 0 && !loadingModels && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Không có model xe nào trong hệ thống
                    </p>
                  )}
              </div>

                          {/* Số lượng - cột phải */}
              <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Số lượng xe cần phân bổ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                              max={availableDraftCount !== null && availableDraftCount > 0 ? availableDraftCount : 50}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="h-11"
                  required
                />
                          </div>
              </div>

                        {/* Hàng 3: Màu sắc full width */}
              <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Màu xe <span className="text-red-500">*</span>
                </label>
                          <ColorPicker
                            value={color}
                            onChange={setColor}
                          />
                        </div>

                        {/* Draft Count Display */}
                        {checkingDraftCount && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                              <span className="text-sm text-blue-800 dark:text-blue-300">
                                Đang kiểm tra số lượng xe Draft...
                              </span>
                            </div>
                          </div>
                        )}

                        {!checkingDraftCount && availableDraftCount !== null && (
              <div>
                            <div className={`border rounded-lg p-4 ${
                              availableDraftCount > 0 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {availableDraftCount > 0 ? (
                                  <>
                                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                      Tìm thấy {availableDraftCount} xe Draft có thể phân bổ
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                      Không có xe Draft nào để phân bổ với màu và model này
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Troubleshooting for zero vehicles */}
                            {availableDraftCount === 0 && (
                              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mt-3">
                                <div className="flex items-start space-x-2">
                                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-amber-800 dark:text-amber-300">
                                    <p className="font-medium mb-2">🔍 Không tìm thấy xe - Khắc phục:</p>
                                    <ul className="list-disc list-inside space-y-1.5">
                                      <li>Vào tab "Quản lý đội xe" và filter theo Model "<strong>{model}</strong>", Màu "<strong>{color}</strong>", Status "Draft"</li>
                                      <li>Kiểm tra xe có <strong>biển số hợp lệ</strong> chưa (không phải "N/A", "Chưa gán biển")</li>
                                      <li>Màu sắc database phải khớp <strong>chính xác</strong>: "{color}"</li>
                                      <li>Nếu không có xe Draft, hãy dùng "Tạo xe hàng loạt" hoặc "Import biển số"</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                )}
              </div>
                        )}
                      </CardContent>
                    </Card>

                 

              {/* Station Info */}
              {selectedStation && (
                      <Card className="border-2 border-gray-200 dark:border-gray-700">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                          <CardTitle className="flex items-center space-x-2 text-base">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                      <span>Thông tin trạm</span>
                    </CardTitle>
                  </CardHeader>
                        <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tên trạm</p>
                              <p className="text-sm text-gray-900 dark:text-white font-semibold">{selectedStation.name}</p>
                      </div>
                      <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</p>
                              <Badge className={selectedStation.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }>
                          {selectedStation.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</p>
                              <p className="text-sm text-gray-900 dark:text-white">{selectedStation.address}</p>
                      </div>
                      <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sức chứa</p>
                              <p className="text-sm text-gray-900 dark:text-white font-semibold">{selectedStation.max_capacity} xe</p>
                      </div>
                      <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Xe hiện tại</p>
                              <p className="text-sm text-gray-900 dark:text-white font-semibold">{selectedStation.current_vehicles || 0} xe</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

                    {/* Summary Info */}
                    {model && color && selectedStationId && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 dark:border-indigo-700 dark:bg-indigo-900/20 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                          </div>
                          <div className="w-full">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                              Tóm tắt phân bổ
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div>
                                <span className="font-medium">Model:</span> {model}
                              </div>
                              <div>
                                <span className="font-medium">Màu:</span> {color}
                              </div>
                              <div>
                                <span className="font-medium">Số lượng:</span> {quantity} xe
                              </div>
                  <div>
                                <span className="font-medium">Trạm:</span> {selectedStation?.name}
                              </div>
                            </div>
                  </div>
                </div>
              </div>
                    )}

                    {/* Backend Error Display */}
                    {backendError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-5 shadow-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                              ❌ Lỗi từ Backend
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-400 mb-3">
                              {backendError}
                            </p>
                            {availableDraftCount !== null && availableDraftCount > 0 && (
                              <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 rounded-lg p-3 mt-3">
                                <p className="text-xs text-amber-900 dark:text-amber-200 font-medium mb-1">
                                  🔍 Phát hiện không khớp:
                                </p>
                                <p className="text-xs text-amber-800 dark:text-amber-300">
                                  • Client tìm thấy: <strong>{availableDraftCount} xe</strong><br/>
                                  • Backend tìm thấy: <strong>0 xe</strong><br/>
                                  • Nguyên nhân: Màu/Model không khớp chính xác hoặc xe không đủ điều kiện
                    </p>
                  </div>
                            )}
                </div>
              </div>
                </div>
              )}

                    {/* Info about draft vehicles */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Điều kiện xe có thể phân bổ
                          </h4>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            <li className="flex items-start">
                              <span className="font-medium mr-2">•</span>
                              <span>Trạng thái: <strong>Draft</strong></span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">•</span>
                              <span>Đã có biển số xe (không phải "N/A" hay "Chưa gán biển")</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium mr-2">•</span>
                              <span>Khớp <strong>chính xác</strong> với màu và model được chọn</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Warning about capacity */}
              {selectedStation && selectedStation.current_vehicles && (
                      <div className={`border-2 rounded-xl p-5 shadow-sm ${
                        selectedStation.current_vehicles + quantity > selectedStation.max_capacity
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                          : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            </div>
                          </div>
                    <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                              Lưu ý về sức chứa
                            </h4>
                            <p className="text-sm text-gray-700">
                              Trạm hiện có <strong>{selectedStation.current_vehicles}</strong> xe. 
                              Sức chứa tối đa: <strong>{selectedStation.max_capacity}</strong> xe.
                            </p>
                        {selectedStation.current_vehicles + quantity > selectedStation.max_capacity && (
                              <p className="text-sm text-red-600 font-medium mt-2">
                            ⚠️ Vượt quá sức chứa! Chỉ có thể thêm tối đa {selectedStation.max_capacity - selectedStation.current_vehicles} xe.
                      </p>
                            )}
                    </div>
                  </div>
                </div>
              )}
            </form>
                )}

                {/* ASSIGN RESULT */}
                {activeTab === 'assign' && assignResult && (
            <div className="space-y-6">
                    <Card className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-green-200 dark:border-green-700">
                        <CardTitle className="flex items-center space-x-2 text-base">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                    <span>Kết quả phân bổ</span>
                  </CardTitle>
                </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                            <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-800 dark:text-green-300">
                          Đã phân bổ thành công {assignResult?.totalAssigned || 0} xe
                        </span>
                      </div>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                        {assignResult?.message || 'Phân bổ xe thành công'}
                      </p>
                    </div>

                    {assignResult?.assignedVehicles && assignResult.assignedVehicles.length > 0 && (
                      <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Danh sách xe đã phân bổ:</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {assignResult.assignedVehicles.map((vehicle, index) => {
                            const v = vehicle as any; // Cast to any to handle different property names
                            return (
                                <div key={v._id || v.id || index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                    <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                      <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                    {v.license_plate || v.licensePlate || 'N/A'}
                                  </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {v.brand || 'N/A'} {v.model || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  {v.current_battery || v.batteryLevel || 0}%
                                </Badge>
                              </div>
                            </div>
                          );
                          })}
                        </div>
                      </div>
                    )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* WITHDRAW TAB - Form */}
                {activeTab === 'withdraw' && !withdrawResult && (
                  <form onSubmit={handleWithdraw} className="space-y-6" id="withdraw-vehicle-form">
                    {/* Station Selection and Vehicle Filters */}
                    <Card className="border-2 border-gray-200 dark:border-gray-700">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 mb-0 mt-0 pb-1 pt-1">
                        <CardTitle className="flex items-center space-x-2 text-base">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span>Rút xe khỏi trạm</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {/* Hàng 1: Chọn trạm - full width */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Chọn trạm <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={selectedStationId}
                            onChange={(e) => setSelectedStationId(e.target.value)}
                            className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            required
                            disabled={loadingStations}
                            aria-label="Chọn trạm để rút xe"
                          >
                            <option value="">
                              {loadingStations ? 'Đang tải...' : '-- Chọn trạm --'}
                            </option>
                            {stations.map((station) => (
                              <option key={station._id} value={station._id}>
                                {station.name} - {station.address}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Hàng 2: Model và Số lượng */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Model xe - cột trái */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Model xe <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={model}
                              onChange={(e) => setModel(e.target.value)}
                              className="w-full h-11 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              required
                              disabled={loadingModels}
                              aria-label="Chọn model xe"
                            >
                              <option value="">
                                {loadingModels ? 'Đang tải...' : '-- Chọn model xe --'}
                              </option>
                              {models.map((modelOption) => (
                                <option key={modelOption} value={modelOption}>
                                  {modelOption}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Số lượng - cột phải */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Số lượng xe cần rút <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max={availableAtStationCount !== null && availableAtStationCount > 0 ? availableAtStationCount : 50}
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="h-11"
                              required
                            />
                          </div>
                        </div>

                        {/* Hàng 3: Màu sắc full width */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Màu xe <span className="text-red-500">*</span>
                          </label>
                          <ColorPicker
                            value={color}
                            onChange={setColor}
                          />
                        </div>

                        {/* Available at Station Count Display */}
                        {checkingAtStationCount && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                              <span className="text-sm text-blue-800 dark:text-blue-300">
                                Đang kiểm tra số lượng xe Available tại trạm...
                              </span>
                        </div>
                      </div>
                        )}

                        {!checkingAtStationCount && availableAtStationCount !== null && (
                          <div className={`border rounded-lg p-4 ${
                            availableAtStationCount > 0 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                          }`}>
                            <div className="flex items-center space-x-2">
                              {availableAtStationCount > 0 ? (
                                <>
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                    Tìm thấy {availableAtStationCount} xe Available có thể rút
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Không tìm thấy xe Available tại trạm với bộ lọc này
                                  </span>
                                </>
                    )}
                  </div>
                          </div>
                        )}
                </CardContent>
              </Card>

                    {/* Backend Error Display (if any) */}
                    {backendError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                              Lỗi từ server:
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              {backendError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* WITHDRAW RESULT */}
                {activeTab === 'withdraw' && withdrawResult && (
                  <div className="space-y-6">
                    <Card className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-b border-green-200 dark:border-green-700">
                        <CardTitle className="flex items-center space-x-2 text-base">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span>Kết quả rút xe</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <Minus className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-800 dark:text-green-300">
                              {withdrawResult.message}
                            </span>
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                            Đã rút {withdrawResult.withdrawn_count} xe về trạng thái Draft
                          </p>
                        </div>

                        {/* Station Info */}
                        {withdrawResult.station && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                              Thông tin trạm sau khi rút
                            </h4>
                            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                              <p><strong>Tên trạm:</strong> {withdrawResult.station.name}</p>
                              <p><strong>Số xe còn lại:</strong> {withdrawResult.station.remaining_vehicles}</p>
                              <p><strong>Xe Available còn lại:</strong> {withdrawResult.station.remaining_available}</p>
                            </div>
                          </div>
                        )}

                        {/* Withdrawn Vehicles */}
                        {withdrawResult.vehicles && withdrawResult.vehicles.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Danh sách xe đã rút ({withdrawResult.vehicles.length})
                            </h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {withdrawResult.vehicles.map((vehicle, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                                      <Car className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {vehicle.name}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {vehicle.model} - {vehicle.color}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {vehicle.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Fixed Footer - Action Buttons */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                {/* ASSIGN TAB Footer */}
                {activeTab === 'assign' && !assignResult && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                      className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Hủy
                </Button>
                <Button 
                      type="submit"
                      form="assign-vehicle-form"
                      disabled={loading || !selectedStationId || !color.trim() || !model.trim() || quantity <= 0 || availableDraftCount === 0}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Đang phân bổ...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          Phân bổ xe
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {activeTab === 'assign' && assignResult && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                  variant="outline"
                  onClick={() => {
                    setAssignResult(null);
                    setSelectedStationId('');
                    setQuantity(1);
                    setColor('');
                    setModel('');
                    setStatus('draft');
                        setAvailableDraftCount(null);
                  }}
                      className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Phân bổ thêm
                </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Đóng
                </Button>
              </div>
                )}

                {/* WITHDRAW TAB Footer */}
                {activeTab === 'withdraw' && !withdrawResult && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                      className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit"
                      form="withdraw-vehicle-form"
                      disabled={loading || !selectedStationId || !color.trim() || !model.trim() || quantity <= 0 || availableAtStationCount === 0}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Đang rút xe...
                        </>
                      ) : (
                        <>
                          <Minus className="h-5 w-5 mr-2" />
                          Rút xe
                        </>
                      )}
                    </Button>
            </div>
          )}

                {activeTab === 'withdraw' && withdrawResult && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setWithdrawResult(null);
                        setSelectedStationId('');
                        setQuantity(1);
                        setColor('');
                        setModel('');
                        setAvailableAtStationCount(null);
                      }}
                      className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Rút thêm
                    </Button>
                    <Button
                      type="button"
                      onClick={onClose}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Đóng
                    </Button>
        </div>
                )}
      </div>
            </motion.div>
    </div>
        </>
      )}
    </AnimatePresence>
  );
}
