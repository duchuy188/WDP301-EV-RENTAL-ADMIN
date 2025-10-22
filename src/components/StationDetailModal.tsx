import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Car, 
  Battery,
  DollarSign,
  Calendar,
  Building2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Navigation,
  Heart,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  Edit,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { stationService } from './service/stationService';
import { StationDetail, StationVehicle, StationStaff } from './service/type/stationTypes';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface StationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationId: string | null;
  onEdit?: (station: StationDetail) => void;
}

export function StationDetailModal({ isOpen, onClose, stationId, onEdit }: StationDetailModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  const [station, setStation] = useState<StationDetail | null>(null);
  const [staff, setStaff] = useState<StationStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'staff'>('overview');
  
  // Vehicle filters
  const [vehicleFilter, setVehicleFilter] = useState<{
    type?: 'scooter' | 'motorcycle';
    status?: 'available' | 'rented' | 'maintenance';
    sort?: 'name' | 'price';
  }>({ sort: 'name' });
  
  // Staff filters & pagination
  const [staffFilter, setStaffFilter] = useState<{
    status?: 'active' | 'inactive' | 'suspended';
    kyc_status?: 'pending' | 'approved' | 'rejected';
    search?: string;
  }>({});
  const [staffPagination, setStaffPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  // Load station detail when modal opens
  useEffect(() => {
    if (isOpen && stationId) {
      loadStationDetail();
    }
  }, [isOpen, stationId, vehicleFilter]);

  // Load staff when staff tab is active
  useEffect(() => {
    if (isOpen && stationId && activeTab === 'staff') {
      loadStationStaff();
    }
  }, [isOpen, stationId, activeTab, staffFilter, staffPagination.page]);

  const loadStationDetail = async () => {
    if (!stationId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await stationService.getStationById(stationId, vehicleFilter);
      setStation(response.station);
      setCurrentImageIndex(0); // Reset image index
    } catch (error) {
      console.error('Error loading station detail:', error);
      setError('Không thể tải dữ liệu trạm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadStationStaff = async () => {
    if (!stationId) return;
    
    try {
      setStaffLoading(true);
      const response = await stationService.getStationStaff(stationId);
      setStaff(response.staff);
      setStaffPagination(prev => ({
        ...prev,
        total: response.count
      }));
    } catch (error) {
      console.error('Error loading station staff:', error);
      // Don't show error for staff loading, just log it
    } finally {
      setStaffLoading(false);
    }
  };

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'rented':
        return <Car className="h-4 w-4" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getBatteryColor = (level: number) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBatteryBgColor = (level: number) => {
    if (level >= 70) return 'bg-green-100';
    if (level >= 30) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const handleNavigateToStation = () => {
    if (station) {
      const address = encodeURIComponent(`${station.address}, ${station.district}, ${station.city}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const handleCallStation = () => {
    if (station?.phone) {
      window.open(`tel:${station.phone}`, '_self');
    }
  };

  const handleEmailStation = () => {
    if (station?.email) {
      window.open(`mailto:${station.email}`, '_self');
    }
  };

  const nextImage = () => {
    if (station?.images && station.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % station.images.length);
    }
  };

  const prevImage = () => {
    if (station?.images && station.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + station.images.length) % station.images.length);
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    try {
      if (!dateString || dateString === '' || dateString === 'Invalid Date') {
        return 'Chưa có thông tin';
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Chưa có thông tin';
      }
      
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Chưa có thông tin';
    }
  };


  // Loading State
  if (loading) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={onClose}
            />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] modal-scroll-container pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Skeleton Loading */}
                <div className="p-6">
                  <div className="animate-pulse">
                    {/* Hero Section Skeleton */}
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
                    
                    {/* Title Skeleton */}
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                    
                    {/* Stats Skeleton */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    
                    {/* Content Skeleton */}
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Error State
  if (error) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={onClose}
            />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Lỗi tải dữ liệu</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <div className="flex space-x-3 justify-center">
                  <Button variant="outline" onClick={onClose}>
                    Đóng
                  </Button>
                  <Button onClick={loadStationDetail}>
                    Thử lại
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (!station) return null;

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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] modal-scroll-container pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Section */}
              <div className="relative">
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
                  {onEdit && station && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(station)}
                      className="h-9 px-4 bg-white/95 hover:bg-white dark:bg-gray-800/95 dark:hover:bg-gray-800 backdrop-blur-sm flex items-center space-x-2 shadow-lg border-gray-200 dark:border-gray-700"
                      title="Chỉnh sửa trạm"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-sm font-medium">Chỉnh sửa</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-9 w-9 p-0 bg-white/95 hover:bg-white dark:bg-gray-800/95 dark:hover:bg-gray-800 backdrop-blur-sm shadow-lg rounded-full"
                    title="Đóng"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Hero Section - Image Carousel */}
                <div className="relative h-64 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 overflow-hidden">
                {(station.images && station.images.length > 0) ? (
                  <>
                    <img
                      src={station.images[currentImageIndex]}
                      alt={station.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Image Navigation */}
                    {station.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                          title="Ảnh trước"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2"
                          title="Ảnh tiếp theo"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {station.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                              title={`Ảnh ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-24 w-24 text-white/50" />
                  </div>
                )}
                </div>

                {/* Station Info Header */}
                <div className="px-6 pt-6 pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{station.name}</h1>
                  <div className="flex items-center space-x-3 mb-3">
                    <Badge className={
                      station.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      station.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }>
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          station.status === 'active' ? 'bg-green-500' :
                          station.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium">
                          {station.status === 'active' ? 'Đang hoạt động' :
                           station.status === 'maintenance' ? 'Bảo trì' : 'Tạm đóng cửa'}
                        </span>
                      </div>
                    </Badge>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Code: {station.code}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-4">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="cursor-pointer hover:text-green-600 dark:hover:text-green-400 transition-colors" onClick={handleNavigateToStation}>
                      {station.address}, {station.district}, {station.city}
                    </span>
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'overview'
                          ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Tổng quan</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('vehicles')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'vehicles'
                          ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Car className="h-4 w-4" />
                      <span>Phương tiện</span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === 'vehicles'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {station.current_vehicles}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('staff')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'staff'
                          ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span>Nhân viên</span>
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === 'staff'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {station.staff_count}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="px-6 py-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Quick Stats - 4 columns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="p-2 bg-green-500 rounded-full">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {station.available_vehicles}
                          </div>
                          <div className="text-xs font-medium text-green-700 dark:text-green-300">Xe sẵn sàng</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="p-2 bg-blue-500 rounded-full">
                              <Car className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                            {station.rented_vehicles}
                          </div>
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Đang thuê</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="p-2 bg-yellow-500 rounded-full">
                              <AlertTriangle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                            {station.maintenance_vehicles}
                          </div>
                          <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Bảo trì</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
                        <CardContent className="p-5 text-center">
                          <div className="flex items-center justify-center mb-2">
                            <div className="p-2 bg-purple-500 rounded-full">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {station.staff_count}
                          </div>
                          <div className="text-xs font-medium text-purple-700 dark:text-purple-300">Nhân viên</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Capacity Bar */}
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sức chứa trạm</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {station.current_vehicles}/{station.max_capacity} xe ({Math.round((station.current_vehicles / station.max_capacity) * 100)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${
                              station.current_vehicles >= station.max_capacity * 0.9 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : station.current_vehicles >= station.max_capacity * 0.7
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${Math.min((station.current_vehicles / station.max_capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Primary Actions */}
                    <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                      <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                          <Navigation className="h-4 w-4 mr-2 text-green-600" />
                          Thao tác nhanh
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Button 
                            onClick={handleNavigateToStation}
                            className="flex flex-col items-center justify-center space-y-2 h-auto py-4 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <Navigation className="h-5 w-5" />
                            <span className="text-xs font-medium">Chỉ đường</span>
                          </Button>
                          
                          {station.phone && (
                            <Button 
                              variant="outline"
                              onClick={handleCallStation}
                              className="flex flex-col items-center justify-center space-y-2 h-auto py-4 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-500 transition-all"
                            >
                              <Phone className="h-5 w-5 text-blue-600" />
                              <span className="text-xs font-medium">Gọi điện</span>
                            </Button>
                          )}
                          
                          {station.email && (
                            <Button 
                              variant="outline"
                              onClick={handleEmailStation}
                              className="flex flex-col items-center justify-center space-y-2 h-auto py-4 border-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 transition-all"
                            >
                              <Mail className="h-5 w-5 text-purple-600" />
                              <span className="text-xs font-medium">Gửi email</span>
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline"
                            className="flex flex-col items-center justify-center space-y-2 h-auto py-4 border-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-500 transition-all"
                          >
                            <Star className="h-5 w-5 text-red-600" />
                            <span className="text-xs font-medium">Yêu thích</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Operating Hours */}
                      <Card className="border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center space-x-2 text-base">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span>Giờ hoạt động</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Mở cửa</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{station.opening_time}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Đóng cửa</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{station.closing_time}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            Hoạt động 7 ngày/tuần
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Info */}
                      <Card className="border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center space-x-2 text-base">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span>Thông tin liên hệ</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {station.phone && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors cursor-pointer" onClick={handleCallStation}>
                              <div className="flex items-center space-x-3">
                                <Phone className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Điện thoại</span>
                              </div>
                              <span className="font-bold text-green-600 dark:text-green-400">{station.phone}</span>
                            </div>
                          )}
                          {station.email && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer" onClick={handleEmailStation}>
                              <div className="flex items-center space-x-3">
                                <Mail className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
                              </div>
                              <span className="font-medium text-purple-600 dark:text-purple-400 text-sm truncate ml-2">{station.email}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Description */}
                    {station.description && (
                      <Card className="border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center space-x-2 text-base">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span>Giới thiệu</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">{station.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Vehicles Tab */}
                {activeTab === 'vehicles' && (
                  <div className="space-y-6">
                    {/* Vehicle Statistics - Compact */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow">
                        <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{station.available_vehicles}</div>
                        <div className="text-xs font-medium text-green-700 dark:text-green-300">Sẵn sàng</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow">
                        <Car className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{station.rented_vehicles}</div>
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300">Đang thuê</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-shadow">
                        <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-yellow-600" />
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{station.maintenance_vehicles}</div>
                        <div className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Bảo trì</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <BarChart3 className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                        <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{station.current_vehicles}</div>
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Tổng cộng</div>
                      </div>
                    </div>

                    {/* Vehicles List */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center space-x-2">
                            <Car className="h-5 w-5 text-green-600" />
                            <span>Danh sách xe tại trạm ({(station.vehicles || []).length})</span>
                          </CardTitle>
                          
                          {/* Vehicle Filters */}
                          <div className="flex items-center space-x-2">
                            <select
                              value={vehicleFilter.type || ''}
                              onChange={(e) => setVehicleFilter(prev => ({ 
                                ...prev, 
                                type: e.target.value as 'scooter' | 'motorcycle' || undefined 
                              }))}
                              className="text-sm border rounded-md px-2 py-1"
                              title="Lọc theo loại xe"
                            >
                              <option value="">Tất cả loại</option>
                              <option value="scooter">Xe tay ga</option>
                              <option value="motorcycle">Xe máy</option>
                            </select>
                            
                            <select
                              value={vehicleFilter.status || ''}
                              onChange={(e) => setVehicleFilter(prev => ({ 
                                ...prev, 
                                status: e.target.value as 'available' | 'rented' | 'maintenance' || undefined 
                              }))}
                              className="text-sm border rounded-md px-2 py-1"
                              title="Lọc theo trạng thái xe"
                            >
                              <option value="">Tất cả trạng thái</option>
                              <option value="available">Sẵn sàng</option>
                              <option value="rented">Đang thuê</option>
                              <option value="maintenance">Bảo trì</option>
                            </select>
                            
                            <select
                              value={vehicleFilter.sort || 'name'}
                              onChange={(e) => setVehicleFilter(prev => ({ 
                                ...prev, 
                                sort: e.target.value as 'name' | 'price' 
                              }))}
                              className="text-sm border rounded-md px-2 py-1"
                              title="Sắp xếp xe"
                            >
                              <option value="name">Sắp xếp theo tên</option>
                              <option value="price">Sắp xếp theo giá</option>
                            </select>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(station.vehicles || []).length === 0 ? (
                          <div className="text-center py-16">
                            <div className="relative inline-block">
                              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full blur-xl opacity-50"></div>
                              <Car className="relative h-20 w-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có phương tiện</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Trạm này chưa có xe nào được phân bổ</p>
                            <Button variant="outline" className="mt-2">
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm xe vào trạm
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(station.vehicles || []).map((vehicle) => (
                              <Card key={vehicle._id} className="hover:shadow-lg transition-all duration-200">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                      {vehicle.main_image ? (
                                        <img 
                                          src={vehicle.main_image} 
                                          alt={vehicle.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Car className="h-8 w-8 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 truncate">{vehicle.name}</h4>
                                      <p className="text-sm text-gray-500">{vehicle.model}</p>
                                      
                                      <div className="flex items-center justify-between mt-2">
                                        <Badge className={getVehicleStatusColor(vehicle.status)}>
                                          {getVehicleStatusIcon(vehicle.status)}
                                          {vehicle.status === 'available' ? 'Sẵn sàng' :
                                           vehicle.status === 'rented' ? 'Đang thuê' : 'Bảo trì'}
                                        </Badge>
                                        
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                          <Battery className="h-3 w-3" />
                                          <span className={getBatteryColor(vehicle.current_battery)}>
                                            {vehicle.current_battery}%
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between mt-3">
                                        <div className="text-lg font-bold text-green-600">
                                          {formatPrice(vehicle.price_per_day)}
                                        </div>
                                        <Button 
                                          size="sm" 
                                          className="text-xs"
                                          disabled={vehicle.status !== 'available'}
                                        >
                                          Thuê ngay
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Staff Tab */}
                {activeTab === 'staff' && (
                  <div className="space-y-6">
                    {/* Staff Search */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm nhân viên theo tên, email, số điện thoại..."
                        value={staffFilter.search || ''}
                        onChange={(e) => setStaffFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                    </div>

                    {/* Staff List */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          <span>Nhân viên tại trạm ({staffPagination.total})</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {staffLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải nhân viên...</span>
                          </div>
                        ) : staff.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="relative inline-block">
                              <div className="absolute inset-0 bg-purple-200 dark:bg-purple-700 rounded-full blur-xl opacity-50"></div>
                              <Users className="relative h-20 w-20 text-purple-400 dark:text-purple-500 mx-auto mb-4" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Chưa có nhân viên</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Trạm này chưa có nhân viên được phân công</p>
                            <Button variant="outline" className="mt-2">
                              <Plus className="h-4 w-4 mr-2" />
                              Phân công nhân viên
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                              {staff.map((member) => (
                                <Card key={member._id} className="group border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xl transition-all duration-300 overflow-hidden">
                                  <CardContent className="p-0">
                                    {/* Header with gradient */}
                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                      <div className="relative flex items-center space-x-3">
                                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center ring-4 ring-purple-300/50 shadow-lg">
                                          {member.avatar ? (
                                            <img 
                                              src={member.avatar} 
                                              alt={member.fullname}
                                              className="w-full h-full object-cover rounded-full"
                                            />
                                          ) : (
                                            <span className="text-2xl font-bold text-purple-600">
                                              {member.fullname.charAt(0).toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-bold text-white truncate text-lg">{member.fullname}</h4>
                                          <p className="text-purple-100 text-sm">{member.role}</p>
                                        </div>
                                        <Badge className={`${getStaffStatusColor(member.status)} text-xs font-semibold px-2 py-1`}>
                                          {member.status === 'active' ? '✓ Hoạt động' :
                                           member.status === 'inactive' ? 'Không hoạt động' : 'Tạm khóa'}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    {/* Body */}
                                    <div className="p-4 space-y-3">
                                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                          <Phone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="font-medium">{member.phone}</span>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                          <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="font-medium truncate">{member.email}</span>
                                      </div>
                                      
                                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <Calendar className="h-3 w-3" />
                                        <span>Tham gia: {formatDate(member.createdAt)}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>

                            {/* Pagination */}
                            {staffPagination.total > staffPagination.limit && (
                              <div className="flex items-center justify-between border-t pt-4">
                                <div className="text-sm text-gray-500">
                                  Hiển thị {((staffPagination.page - 1) * staffPagination.limit) + 1} - {Math.min(staffPagination.page * staffPagination.limit, staffPagination.total)} 
                                  trong tổng số {staffPagination.total} nhân viên
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStaffPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={staffPagination.page === 1}
                                  >
                                    Trước
                                  </Button>
                                  <span className="text-sm text-gray-500">
                                    Trang {staffPagination.page} / {Math.ceil(staffPagination.total / staffPagination.limit)}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setStaffPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={staffPagination.page >= Math.ceil(staffPagination.total / staffPagination.limit)}
                                  >
                                    Sau
                                  </Button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
