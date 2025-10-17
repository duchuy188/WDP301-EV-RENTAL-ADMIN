import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User, CheckCircle, Loader2, Building2, Phone, Mail, Calendar, Shield, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AssignmentService, UnassignedStaff, Station, AssignStaffRequest } from './service/assignmentService';
import { showToast } from '../lib/toast';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: UnassignedStaff | null;
  onSuccess: () => void;
}

export function AssignmentModal({ isOpen, onClose, staff, onSuccess }: AssignmentModalProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const stationsData = await AssignmentService.getStations();
      setStations(stationsData);
      setFilteredStations(stationsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách trạm';
      showToast.error(`Lỗi tải danh sách trạm: ${errorMessage}`);
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and reorder stations based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStations(stations);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = stations.filter(station => 
        station.name.toLowerCase().includes(searchLower) ||
        station.code.toLowerCase().includes(searchLower) ||
        (station.address && station.address.toLowerCase().includes(searchLower))
      );
      
      // Sort by relevance: exact matches first, then partial matches
      const sorted = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aCode = a.code.toLowerCase();
        const bCode = b.code.toLowerCase();
        const aAddress = a.address?.toLowerCase() || '';
        const bAddress = b.address?.toLowerCase() || '';
        
        // Exact matches first
        if (aName === searchLower || aCode === searchLower) return -1;
        if (bName === searchLower || bCode === searchLower) return 1;
        
        // Starts with search term
        if (aName.startsWith(searchLower) || aCode.startsWith(searchLower)) return -1;
        if (bName.startsWith(searchLower) || bCode.startsWith(searchLower)) return 1;
        
        // Contains search term
        return 0;
      });
      
      setFilteredStations(sorted);
    }
  }, [searchTerm, stations]);

  // Fetch stations when modal opens and reset state
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedStationId('');
      setSearchTerm('');
      setLoading(false);
      setAssigning(false);
      fetchStations();
    }
  }, [isOpen, fetchStations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setSelectedStationId('');
      setLoading(false);
      setAssigning(false);
    };
  }, []);

  const handleAssign = async () => {
    if (!staff || !selectedStationId) {
      showToast.error('Vui lòng chọn trạm để phân công nhân viên');
      return;
    }

    try {
      setAssigning(true);

      const assignData: AssignStaffRequest = {
        userId: staff._id,
        stationId: selectedStationId
      };

      await AssignmentService.assignStaff(assignData);
      
      showToast.success('Phân công nhân viên thành công!');
      onSuccess();
      handleClose();

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi phân công';
      showToast.error(`Lỗi phân công nhân viên: ${errorMessage}`);
      console.error('Error assigning staff:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!assigning) {
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Reset state before closing
      setSelectedStationId('');
      setSearchTerm('');
      setLoading(false);
      onClose();
    }
  }, [assigning, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && staff && (
        <motion.div
          key="assignment-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-2xl h-auto max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Phân công nhân viên
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Chọn trạm để phân công nhân viên
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={assigning}
                className="h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Staff Information Card */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-emerald-600" />
                  Thông tin nhân viên
                </h3>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {staff.fullname}
                        </h4>
                        <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Shield className="w-3 h-3 mr-1" />
                          {staff.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                          <Mail className="w-3 h-3 text-emerald-600" />
                          <span className="truncate">{staff.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{staff.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Tham gia: {new Date(staff.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station Selection */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Chọn trạm phân công
                    </h3>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm trạm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-48 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Đang tải danh sách trạm...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 h-[200px] overflow-y-auto overflow-x-hidden pr-2">
                    {filteredStations.slice(0, 2).map((station) => (
                      <motion.div
                        key={station._id}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                          selectedStationId === station._id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onClick={() => setSelectedStationId(station._id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            selectedStationId === station._id
                              ? 'bg-emerald-500 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-white truncate">
                              {station.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Mã trạm: {station.code}
                            </p>
                            {station.address && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1 flex items-center">
                                <MapPin className="w-3 h-3 mr-1 text-emerald-600" />
                                {station.address}
                              </p>
                            )}
                          </div>
                          {selectedStationId === station._id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <CheckCircle className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {filteredStations.length > 2 && (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Và {filteredStations.length - 2} trạm khác...
                        </span>
                      </div>
                    )}
                    {filteredStations.length === 0 && searchTerm && (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Không tìm thấy trạm nào
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={assigning}
                className="px-8 py-3 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Hủy bỏ
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedStationId || assigning || loading}
                className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-semibold"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang phân công...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    Phân công nhân viên
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}