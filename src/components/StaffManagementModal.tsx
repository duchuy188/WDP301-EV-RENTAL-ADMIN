import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, AlertTriangle, RefreshCw, Users, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { showToast } from '../lib/toast';
import { AssignmentService, UnassignedStaff, Station } from './service/assignmentService';
import { stationService } from './service/stationService';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface StaffMember {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  stationId: any;
}

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: UnassignedStaff[];
  onSuccess?: () => void;
}

export function StaffManagementModal({
  isOpen,
  onClose,
  staff,
  onSuccess
}: StaffManagementModalProps) {
  useDisableBodyScroll(isOpen);
  
  const [stations, setStations] = useState<Station[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [sourceStationId, setSourceStationId] = useState<string>('');
  const [stationStaff, setStationStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [action, setAction] = useState<'transfer' | 'unassign'>('transfer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStations();
    }
  }, [isOpen]);

  // Fetch nhân viên khi chọn trạm nguồn
  useEffect(() => {
    if (sourceStationId) {
      fetchStationStaff(sourceStationId);
    } else {
      setStationStaff([]);
      setSelectedStaffIds([]);
    }
  }, [sourceStationId]);

  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      const stationsList = await AssignmentService.getStations();
      setStations(stationsList || []);
    } catch (error: any) {
      console.error('Error fetching stations:', error);
      showToast.error('Không thể tải danh sách trạm');
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchStationStaff = async (stationId: string) => {
    try {
      setLoadingStaff(true);
      const response = await stationService.getStationStaff(stationId);
      
      // Handle different response structures
      let staffArray: any[] = [];
      if (response.data?.staff) {
        staffArray = response.data.staff;
      } else if (Array.isArray(response.data)) {
        staffArray = response.data;
      } else if ((response as any).staff) {
        staffArray = (response as any).staff;
      } else if (Array.isArray(response)) {
        staffArray = response as any[];
      }
      
      // Transform to StaffMember interface
      const staffData = staffArray.map((s: any) => ({
        _id: s._id,
        fullname: s.fullname,
        email: s.email,
        phone: s.phone,
        stationId: s.stationId
      }));
      
      setStationStaff(staffData);
    } catch (error: any) {
      console.error('Error fetching station staff:', error);
      showToast.error('Không thể tải danh sách nhân viên');
      setStationStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedStaffIds.length === 0) {
      showToast.error('Vui lòng chọn ít nhất một nhân viên');
      return;
    }

    if (action === 'transfer' && !selectedStation) {
      showToast.error('Vui lòng chọn trạm đích');
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Xử lý từng nhân viên
      for (const staffId of selectedStaffIds) {
        try {
          if (action === 'transfer') {
            // Chuyển trạm: Hủy gán rồi gán lại
            await AssignmentService.unassignStaff({ userId: staffId });
            await AssignmentService.assignStaff({
              userId: staffId,
              stationId: selectedStation
            });
          } else {
            // Hủy phân công
            await AssignmentService.unassignStaff({ userId: staffId });
          }
          successCount++;
        } catch (err) {
          console.error(`Error processing staff ${staffId}:`, err);
          errorCount++;
        }
      }

      // Hiển thị kết quả
      if (successCount > 0) {
        if (action === 'transfer') {
          showToast.success(`Đã chuyển ${successCount} nhân viên thành công!${errorCount > 0 ? ` (${errorCount} thất bại)` : ''}`);
        } else {
          showToast.success(`Đã hủy phân công ${successCount} nhân viên!${errorCount > 0 ? ` (${errorCount} thất bại)` : ''}`);
        }
      } else {
        showToast.error('Không thể xử lý nhân viên nào');
      }

      if (successCount > 0) {
        onSuccess?.();
        handleClose();
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaff = (staffId: string) => {
    setSelectedStaffIds(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleToggleAll = () => {
    if (selectedStaffIds.length === stationStaff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(stationStaff.map(s => s._id));
    }
  };

  const handleClose = () => {
    setSourceStationId('');
    setStationStaff([]);
    setSelectedStaffIds([]);
    setSelectedStation('');
    setAction('transfer');
    onClose();
  };

  if (!isOpen) return null;

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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 p-6 flex-shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Quản lý nhân viên đã phân công
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Chuyển trạm hoặc hủy phân công nhân viên
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                    title="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Action Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Chọn hành động
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAction('transfer')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        action === 'transfer'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <RefreshCw className={`h-6 w-6 mx-auto mb-2 ${
                        action === 'transfer' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div className={`font-medium ${
                        action === 'transfer' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Chuyển trạm
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Chuyển nhân viên sang trạm khác
                      </div>
                    </button>

                    <button
                      onClick={() => setAction('unassign')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        action === 'unassign'
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${
                        action === 'unassign' ? 'text-orange-600' : 'text-gray-400'
                      }`} />
                      <div className={`font-medium ${
                        action === 'unassign' ? 'text-orange-900 dark:text-orange-100' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        Hủy phân công
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Hủy nhân viên khỏi trạm hiện tại
                      </div>
                    </button>
                  </div>
                </div>

                {/* Source Station Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chọn trạm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={sourceStationId}
                      onChange={(e) => setSourceStationId(e.target.value)}
                      disabled={loadingStations}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                      title="Chọn trạm"
                      aria-label="Chọn trạm"
                    >
                      <option value="">
                        {loadingStations ? 'Đang tải...' : '-- Chọn trạm --'}
                      </option>
                      {stations.map((station) => (
                        <option key={station._id} value={station._id}>
                          {station.name} ({station.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Staff List with Checkboxes */}
                {sourceStationId && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Chọn nhân viên cần chuyển <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedStaffIds.length}/{stationStaff.length} được chọn
                      </span>
                    </div>

                    {loadingStaff ? (
                      <div className="flex items-center justify-center py-8 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Đang tải nhân viên...</span>
                      </div>
                    ) : stationStaff.length === 0 ? (
                      <div className="py-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Trạm này chưa có nhân viên nào
                        </p>
                      </div>
                    ) : (
                      <Card className="border-2 border-gray-200 dark:border-gray-700">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStaffIds.length === stationStaff.length && stationStaff.length > 0}
                              onChange={handleToggleAll}
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                              Chọn tất cả ({stationStaff.length})
                            </span>
                          </label>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {stationStaff.map((member) => (
                            <label
                              key={member._id}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStaffIds.includes(member._id)}
                                onChange={() => handleToggleStaff(member._id)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {member.fullname}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {member.email} • {member.phone}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {/* Station Selection (only for transfer) */}
                {action === 'transfer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Chọn trạm đích <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={selectedStation}
                        onChange={(e) => setSelectedStation(e.target.value)}
                        disabled={loadingStations}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                        title="Chọn trạm đích"
                        aria-label="Chọn trạm đích"
                      >
                        <option value="">
                          {loadingStations ? 'Đang tải...' : '-- Chọn trạm --'}
                        </option>
                        {stations.map((station) => (
                          <option key={station._id} value={station._id}>
                            {station.name} ({station.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Warning */}
                {action === 'unassign' && (
                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-orange-800 dark:text-orange-200">
                        <p className="font-medium mb-1">Lưu ý:</p>
                        <p>
                          Nhân viên sẽ được hủy khỏi trạm hiện tại và chuyển về danh sách chưa phân công.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-3 h-12 border-2"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || selectedStaffIds.length === 0 || (action === 'transfer' && !selectedStation)}
                    className={`px-6 py-3 h-12 ${
                      action === 'transfer'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                    } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        {action === 'transfer' ? 'Chuyển trạm' : 'Hủy phân công'}
                        {selectedStaffIds.length > 0 && ` (${selectedStaffIds.length})`}
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

export default StaffManagementModal;


