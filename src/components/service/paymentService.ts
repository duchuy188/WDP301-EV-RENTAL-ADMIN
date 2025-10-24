import { axiosInstance } from './api/axiosInstance';
import { API_CONFIG } from '../../lib/apiConfig';
import {
  Payment,
  PaymentListResponse,
  PaymentQueryParams,
  PaymentUI,
  normalizePaymentForUI,
  PaymentSummary
} from './type/paymentTypes';

/**
 * Payment Service - Quản lý các API liên quan đến thanh toán
 */
class PaymentService {
  private baseUrl = '/api/payments';

  /**
   * Lấy danh sách tất cả payments với filter và pagination
   */
  async getPayments(params?: PaymentQueryParams): Promise<{ 
    data: PaymentUI[]; 
    summary?: PaymentSummary;
    pagination?: any 
  }> {
    try {
      console.log('Fetching payments with params:', params);
      
      const response = await axiosInstance.get(this.baseUrl, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          status: params?.status,
          payment_type: params?.payment_type,
          payment_method: params?.payment_method,
          search: params?.search,
          sort: params?.sort || 'createdAt',
          order: params?.order || 'desc'
        }
      });

      console.log('Raw API Response:', response.data);
      
      const apiResponse: PaymentListResponse = response.data;
      
      // Check if payments array exists
      if (!apiResponse.payments || !Array.isArray(apiResponse.payments)) {
        console.warn('No payments array in response, returning empty array');
        return {
          data: [],
          summary: apiResponse.summary,
          pagination: apiResponse.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
        };
      }
      
      // Normalize payments for UI
      const normalizedPayments = apiResponse.payments.map((payment, index) => {
        try {
          // Log payment data for debugging
          if (index === 0) {
            console.log('Sample payment data:', payment);
          }
          return normalizePaymentForUI(payment);
        } catch (error) {
          console.error(`Error normalizing payment at index ${index}:`, error, payment);
          // Return a fallback payment object
          const createdAt = payment.created_at || payment.createdAt || payment.date_created || '';
          const updatedAt = payment.updated_at || payment.updatedAt || payment.date_updated || '';
          const user = typeof payment.user_id === 'object' ? payment.user_id : null;
          
          return {
            id: payment._id || `fallback-${index}`,
            code: payment.code || 'N/A',
            amount: payment.amount || 0,
            paymentMethod: payment.payment_method || 'N/A',
            paymentType: payment.payment_type || 'N/A',
            status: payment.status || 'pending',
            customerName: user?.full_name || user?.fullname || 'N/A',
            customerEmail: user?.email,
            customerAvatar: user?.avatar,
            transactionId: payment.transaction_id,
            notes: payment.notes,
            refundAmount: payment.refund_amount,
            createdAt: createdAt,
            updatedAt: updatedAt
          } as PaymentUI;
        }
      });

      console.log('Normalized payments:', normalizedPayments);

      return {
        data: normalizedPayments,
        summary: apiResponse.summary,
        pagination: apiResponse.pagination
      };
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết một payment theo ID
   */
  async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${id}`);
      return response.data.payment || response.data;
    } catch (error) {
      console.error(`Error fetching payment ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tìm kiếm payment theo code hoặc customer name
   */
  async searchPayments(query: string): Promise<PaymentUI[]> {
    try {
      const response = await this.getPayments({ search: query, limit: 100 });
      return response.data;
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }

  /**
   * Export danh sách payments ra file Excel
   */
  async exportPayments(params?: PaymentQueryParams): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/export`, {
        params: {
          status: params?.status,
          payment_type: params?.payment_type,
          payment_method: params?.payment_method,
          search: params?.search
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting payments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;

