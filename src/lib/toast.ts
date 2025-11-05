import { toast, ToastOptions, Id } from 'react-toastify';

/**
 * Professional Toast Configuration
 * - Duration: Success (2-2.5s), Warning (3s), Error (3.5-4s)
 * - Position: top-right (không che modal)
 * - Auto-close với progress bar
 * - Chống spam toast duplicate
 */

// Store active toasts để chống spam
const activeToasts = new Map<string, Id>();

// Base configuration cho tất cả toast
const baseConfig: ToastOptions = {
  position: "top-right",
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  pauseOnFocusLoss: false, // Không pause khi blur để admin làm việc nhanh
  newestOnTop: true, // Toast mới luôn ở trên
};

/**
 * Helper function để tránh spam duplicate toast
 */
const showUniqueToast = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  options?: ToastOptions
) => {
  // Tạo unique key từ type + message
  const toastKey = `${type}:${message}`;
  
  // Nếu toast này đang hiển thị, không show thêm
  if (activeToasts.has(toastKey)) {
    return activeToasts.get(toastKey);
  }
  
  // Show toast mới
  const toastId = toast[type](message, {
    ...baseConfig,
    ...options,
    onClose: () => {
      // Xóa khỏi active list khi toast đóng
      activeToasts.delete(toastKey);
    }
  });
  
  // Lưu vào active list
  activeToasts.set(toastKey, toastId);
  
  return toastId;
};

export const showToast = {
  /**
   * Toast thành công
   * Duration: 2-2.5s (đủ để đọc, không làm phiền)
   * Use case: Create/Update/Delete thành công
   */
  success: (message: string, options?: ToastOptions) => {
    return showUniqueToast('success', message, {
      autoClose: 2500, // 2.5s - chuẩn UX
      ...options,
    });
  },

  /**
   * Toast lỗi
   * Duration: 3.5-4s (dài hơn để user đọc kỹ lỗi)
   * Use case: API error, validation error nghiêm trọng
   */
  error: (message: string, options?: ToastOptions) => {
    return showUniqueToast('error', message, {
      autoClose: 3500, // 3.5s - đủ thời gian đọc lỗi
      ...options,
    });
  },

  /**
   * Toast cảnh báo
   * Duration: 3s
   * Use case: Validation warning, cảnh báo không nghiêm trọng
   */
  warning: (message: string, options?: ToastOptions) => {
    return showUniqueToast('warning', message, {
      autoClose: 3000, // 3s - chuẩn UX
      ...options,
    });
  },

  /**
   * Toast thông tin
   * Duration: 2.5s
   * Use case: Thông tin bổ sung, không quan trọng lắm
   */
  info: (message: string, options?: ToastOptions) => {
    return showUniqueToast('info', message, {
      autoClose: 2500, // 2.5s
      ...options,
    });
  },

  /**
   * Toast loading (không tự đóng)
   * Use case: Đang xử lý tác vụ dài
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...baseConfig,
      ...options,
    });
  },

  /**
   * Cập nhật toast loading thành success/error
   */
  update: (toastId: Id, type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: type === 'success' ? 2500 : type === 'error' ? 3500 : 3000,
      ...baseConfig,
    });
  },

  /**
   * Đóng một toast cụ thể
   */
  dismiss: (toastId?: Id) => {
    if (toastId) {
      toast.dismiss(toastId);
      // Clear từ active list
      activeToasts.forEach((id, key) => {
        if (id === toastId) {
          activeToasts.delete(key);
        }
      });
    } else {
      toast.dismiss();
      activeToasts.clear();
    }
  },

  /**
   * Đóng tất cả toast
   */
  dismissAll: () => {
    toast.dismiss();
    activeToasts.clear();
  },

  /**
   * Toast bulk action (xử lý nhiều item)
   * Ví dụ: "Đã xóa 5 khách hàng thành công"
   */
  bulkSuccess: (count: number, action: string, itemName: string) => {
    const message = `${action} ${count} ${itemName} thành công`;
    return showToast.success(message);
  },
};
