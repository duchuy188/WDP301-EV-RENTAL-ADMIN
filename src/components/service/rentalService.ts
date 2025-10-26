/**
 * Rental Service
 * Handles all rental-related API calls
 */

import axiosInstance from './api/axiosInstance';
import type {
  GetUserRentalsParams,
  GetUserRentalsResponse,
  GetAdminRentalsParams,
  GetAdminRentalsResponse,
  GetRentalByIdResponse,
  GetCheckoutInfoResponse,
} from './type/rentalTypes';

class RentalService {
  /**
   * Get all rentals (Admin only)
   * Admin can view all rentals with filters
   */
  async getAdminRentals(params?: GetAdminRentalsParams): Promise<GetAdminRentalsResponse> {
    try {
      console.log('📝 RentalService: Fetching admin rentals with params:', params);
      
      // Clean up params - remove undefined values
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.status) cleanParams.status = params.status;
        if (params.user_id) cleanParams.user_id = params.user_id;
        if (params.station_id) cleanParams.station_id = params.station_id;
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
      }
      
      const response = await axiosInstance.get<GetAdminRentalsResponse>('/api/rentals/admin', {
        params: cleanParams,
      });
      
      console.log('✅ RentalService: Admin rentals fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data || !response.data.data.rentals) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ RentalService: Error fetching admin rentals:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho Admin');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải danh sách rentals');
      }
      
      throw error;
    }
  }

  /**
   * Get user's rentals (EV Renter only)
   * User can only view their own rentals
   */
  async getUserRentals(params?: GetUserRentalsParams): Promise<GetUserRentalsResponse> {
    try {
      console.log('📝 RentalService: Fetching user rentals with params:', params);
      
      // Clean up params - remove undefined values
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.status) cleanParams.status = params.status;
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
      }
      
      const response = await axiosInstance.get<GetUserRentalsResponse>('/api/rentals/user', {
        params: cleanParams,
      });
      
      console.log('✅ RentalService: User rentals fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data || !response.data.data.rentals) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ RentalService: Error fetching user rentals:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho EV Renter');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải danh sách rentals');
      }
      
      throw error;
    }
  }

  /**
   * Get rental by ID
   * Get detailed information of a rental
   */
  async getRentalById(id: string): Promise<GetRentalByIdResponse> {
    try {
      console.log('📝 RentalService: Fetching rental by ID:', id);
      
      const response = await axiosInstance.get<GetRentalByIdResponse>(`/api/rentals/${id}`, {
        params: {
          populate: 'vehicle_id,user_id,station_id,booking_id,pickup_staff_id,return_staff_id,contract'
        }
      });
      
      console.log('✅ RentalService: Rental fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ RentalService: Error fetching rental:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy rental');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải thông tin rental');
      }
      
      throw error;
    }
  }

  /**
   * Get checkout info
   * Get necessary information to perform checkout
   */
  async getCheckoutInfo(id: string): Promise<GetCheckoutInfoResponse> {
    try {
      console.log('📝 RentalService: Fetching checkout info for rental:', id);
      
      const response = await axiosInstance.get<GetCheckoutInfoResponse>(`/api/rentals/${id}/checkout-info`);
      
      console.log('✅ RentalService: Checkout info fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ RentalService: Error fetching checkout info:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Rental không hợp lệ');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy rental');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải thông tin checkout');
      }
      
      throw error;
    }
  }
}

export default new RentalService();

