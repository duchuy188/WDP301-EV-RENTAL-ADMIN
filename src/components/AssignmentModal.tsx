import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { AssignmentService, UnassignedStaff, Station, AssignStaffRequest } from './service/assignmentService';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: UnassignedStaff | null;
  onSuccess: () => void;
}

export function AssignmentModal({ isOpen, onClose, staff, onSuccess }: AssignmentModalProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stationsData = await AssignmentService.getStations();
      setStations(stationsData);
    } catch (err) {
      setError('Không thể tải danh sách trạm');
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stations when modal opens and reset state
  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setSelectedStationId('');
      setError(null);
      setSuccess(false);
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
      setError(null);
      setSuccess(false);
      setLoading(false);
      setAssigning(false);
    };
  }, []);

  const handleAssign = async () => {
    if (!staff || !selectedStationId) return;

    try {
      setAssigning(true);
      setError(null);

      const assignData: AssignStaffRequest = {
        userId: staff._id,
        stationId: selectedStationId
      };

      const result = await AssignmentService.assignStaff(assignData);
      
      setSuccess(true);
      
      // Auto close after 2 seconds
      timeoutRef.current = setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi phân công');
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
      setError(null);
      setSuccess(false);
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
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          style={{ margin: 0, padding: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
          >
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Phân công nhân viên</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={assigning}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Staff Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{staff.fullname}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{staff.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{staff.phone}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {staff.role}
              </Badge>
            </div>

            {/* Station Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn trạm phân công
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-500">Đang tải danh sách trạm...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stations.map((station) => (
                    <div
                      key={station._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedStationId === station._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedStationId(station._id)}
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {station.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Mã: {station.code}
                          </p>
                          {station.address && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {station.address}
                            </p>
                          )}
                        </div>
                        {selectedStationId === station._id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  Phân công thành công!
                </span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={assigning}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!selectedStationId || assigning || loading}
                className="flex-1"
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang phân công...
                  </>
                ) : (
                  'Phân công'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
