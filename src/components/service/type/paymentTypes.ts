// Payment Types
export interface Payment {
  _id: string;
  code: string;
  amount: number;
  payment_method: 'qr_code' | 'vnpay' | 'cash' | 'bank_transfer';
  payment_type: 'deposit' | 'rental' | 'penalty' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reason?: string;
  transaction_id?: string;
  qr_code_data?: string;
  vnpay_url?: string;
  vnpay_transaction_no?: string;
  vnpay_bank_code?: string;
  notes?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  refunded_by?: string;
  user_id: string | UserInfo;
  booking_id?: string;
  rental_id?: string;
  processed_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  _id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  avatar?: string;
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  refundAmount: number;
  paymentTypes: Record<string, number>;
  paymentMethods: Record<string, number>;
}

export interface PaymentListResponse {
  message?: string;
  payments: Payment[];
  summary?: PaymentSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    timestamp: string;
  };
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_type?: 'deposit' | 'rental' | 'penalty' | 'refund';
  payment_method?: 'qr_code' | 'vnpay' | 'cash' | 'bank_transfer';
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// UI Display Types
export interface PaymentUI {
  id: string;
  code: string;
  amount: number;
  paymentMethod: string;
  paymentType: string;
  status: string;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;
  transactionId?: string;
  notes?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to normalize payment for UI display
export function normalizePaymentForUI(payment: any): PaymentUI {
  const user = typeof payment.user_id === 'object' ? payment.user_id : null;
  
  // Handle both snake_case and camelCase field names from API
  const createdAt = payment.created_at || payment.createdAt || payment.date_created || '';
  const updatedAt = payment.updated_at || payment.updatedAt || payment.date_updated || '';
  
  return {
    id: payment._id,
    code: payment.code,
    amount: payment.amount,
    paymentMethod: payment.payment_method,
    paymentType: payment.payment_type,
    status: payment.status,
    customerName: user?.full_name || user?.fullname || 'N/A',
    customerEmail: user?.email,
    customerAvatar: user?.avatar,
    transactionId: payment.transaction_id || payment.vnpay_transaction_no,
    notes: payment.notes,
    refundAmount: payment.refund_amount,
    createdAt: createdAt,
    updatedAt: updatedAt
  };
}

// Payment method labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  qr_code: 'QR Code',
  vnpay: 'VNPay',
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản'
};

// Payment type labels
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  deposit: 'Đặt cọc',
  rental: 'Thuê xe',
  penalty: 'Phạt',
  refund: 'Hoàn tiền'
};

// Payment status labels
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền'
};

