import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, Calendar, Shield, Clock, Edit3, Save, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { User as UserType, UpdateUserPayload } from './service/type/userTypes';
import { UserService } from './service/userService';
import { showToast } from '../lib/toast';
import useDisableBodyScroll from '../hooks/useDisableBodyScroll';

interface UserDetailModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function UserDetailModal({ user, isOpen, onClose, onUpdated }: UserDetailModalProps) {
  // Disable body scroll when modal is open
  useDisableBodyScroll(isOpen);
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURN
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const normalizeStationId = (station: any): string | undefined => {
    if (!station) return undefined;
    if (typeof station === 'string') return station;
    if (typeof station === 'object' && station._id) return station._id as string;
    return undefined;
  };
  
  const [form, setForm] = useState<UpdateUserPayload>({
    fullname: user?.fullname || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    stationId: normalizeStationId(user?.stationId),
    status: user?.status || 'active',
  });

  // Keep form in sync if opening modal on different user
  React.useEffect(() => {
    if (user) {
      setForm({
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        address: user.address,
        stationId: normalizeStationId(user.stationId),
        status: user.status,
      });
      setIsEditing(false);
    }
  }, [user]);

  // Early return AFTER all hooks
  if (!user) return null;

  const handleChange = (key: keyof UpdateUserPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);
      
      const payload: UpdateUserPayload = { ...form };
      await UserService.updateUser(user._id, payload);
      
      // 1. Close modal immediately
      setIsEditing(false);
      onClose();
      
      // 2. Show success toast
      showToast.success(`Cập nhật thông tin ${user.fullname} thành công`);
      
      // 3. Refresh data
      onUpdated?.();
      
    } catch (err: any) {
      console.error('Failed to update user', err);
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
      setError(errorMessage);
      showToast.error(errorMessage);
      // Modal KHÔNG đóng khi lỗi - để user sửa lại
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    try {
      // Check if dateString exists and is not empty
      if (!dateString || dateString === '' || dateString === 'Invalid Date') {
        return 'Chưa có thông tin';
      }

      // Handle different date formats from API
      let date: Date;
      
      // Check if it's already in DD/MM/YYYY HH:mm:ss format
      if (dateString.includes('/')) {
        // Parse DD/MM/YYYY HH:mm:ss format
        const parts = dateString.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '00:00:00';
        const [day, month, year] = datePart.split('/');
        const [hour, minute, second] = timePart.split(':');
        date = new Date(
          parseInt(year), 
          parseInt(month) - 1, 
          parseInt(day), 
          parseInt(hour || '0'), 
          parseInt(minute || '0'), 
          parseInt(second || '0')
        );
      } else {
        // Try standard ISO format
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Chưa có thông tin';
      }
      
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Chưa có thông tin';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'destructive';
      default: return 'secondary';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'not_submitted': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'suspended': return 'Đã chặn';
      default: return status;
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'not_submitted': return 'Chưa nộp';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
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
            onClick={onClose}
            style={{ padding: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed inset-0 z-[10000] flex items-center justify-center pt-16 pb-16 px-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[calc(95vh-1rem)] overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.fullname}
                          className="h-6 w-6 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = '<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                            }
                          }}
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      {isEditing ? (
                        <input
                          value={form.fullname || ''}
                          onChange={(e) => handleChange('fullname', e.target.value)}
                          className="text-2xl font-bold bg-white/20 border-b-2 border-white/40 focus:outline-none focus:border-white text-white placeholder-white/60 transition-colors px-2 py-1 rounded"
                          aria-label="Họ tên"
                          placeholder="Họ tên"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-white">{user.fullname}</h2>
                      )}
                      <p className="text-green-100 text-sm mt-1 font-medium">
                        {user.role} • {getStatusText(user.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-9 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                </motion.div>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Thông tin cơ bản
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                            <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                            {isEditing ? (
                              <input
                                type="email"
                                value={form.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                aria-label="Email"
                                placeholder="Email"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                            <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Số điện thoại</p>
                            {isEditing ? (
                              <input
                                value={form.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                aria-label="Số điện thoại"
                                placeholder="Số điện thoại"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors mt-0.5">
                            <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Địa chỉ</p>
                            {isEditing ? (
                              <input
                                value={form.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                aria-label="Địa chỉ"
                                placeholder="Địa chỉ"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{user.address || '—'}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Trạng thái & Quyền hạn
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                              <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trạng thái</span>
                          </div>
                          {isEditing ? (
                            <select
                              value={form.status || user.status}
                              onChange={(e) => handleChange('status', e.target.value)}
                              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                              aria-label="Trạng thái"
                            >
                              <option value="active">Hoạt động</option>
                              <option value="suspended">Đã chặn</option>
                            </select>
                          ) : (
                            <Badge variant={getStatusColor(user.status) as any} className="px-3 py-1">
                              {getStatusText(user.status)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* KYC Status - Chỉ hiển thị cho EV Renter */}
                      {user.role === 'EV Renter' && (
                        <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">KYC Status</span>
                            </div>
                            <Badge variant={getKycStatusColor(user.kycStatus) as any} className="px-3 py-1">
                              {getKycStatusText(user.kycStatus)}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="group p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center group-hover:bg-lime-200 dark:group-hover:bg-lime-900/50 transition-colors">
                            <User className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vai trò</span>
                          </div>
                          <Badge variant="default" className="px-3 py-1">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 pb-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Thông tin thời gian
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="group p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                          <Calendar className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ngày tạo tài khoản</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="group p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <Calendar className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cập nhật lần cuối</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {formatDate(user.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Removed User ID section as requested */}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={isEditing ? () => setIsEditing(false) : onClose} 
                    disabled={saving}
                    className="px-6 py-3 h-12 border-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </>
                    ) : (
                      'Đóng'
                    )}
                  </Button>
                  {isEditing && (
                    <Button 
                      type="button"
                      onClick={handleSave} 
                      disabled={saving}
                      className="px-8 py-3 h-12 min-w-[160px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
