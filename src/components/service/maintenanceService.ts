/**
 * Maintenance Service
 * Handles all maintenance-related API calls
 */

import axiosInstance from './api/axiosInstance';
import type {
  GetMaintenanceParams,
  GetMaintenanceResponse,
  GetStationMaintenanceParams,
  GetStationMaintenanceResponse,
  GetMaintenanceByIdResponse,
  UpdateMaintenancePayload,
  UpdateMaintenanceResponse,
  DeleteMaintenanceResponse,
} from './type/maintenanceTypes';

class MaintenanceService {
  /**
   * Get all maintenance reports (Admin only)
   */
  async getMaintenanceReports(params?: GetMaintenanceParams): Promise<GetMaintenanceResponse> {
    try {
      console.log('📝 MaintenanceService: Fetching maintenance reports with params:', params);
      
      // Clean up params - remove undefined values
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
        if (params.status && params.status !== 'all') cleanParams.status = params.status;
        if (params.station_id) cleanParams.station_id = params.station_id;
        if (params.sort_by) cleanParams.sort_by = params.sort_by;
        if (params.sort_order) cleanParams.sort_order = params.sort_order;
      }
      
      const response = await axiosInstance.get<GetMaintenanceResponse>('/api/maintenance', {
        params: cleanParams,
      });
      
      console.log('✅ MaintenanceService: Reports fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data || !response.data.data.reports) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MaintenanceService: Error fetching reports:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho Admin');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải danh sách báo cáo bảo trì');
      }
      
      throw error;
    }
  }

  /**
   * Get station maintenance reports (Station Staff only)
   */
  async getStationMaintenanceReports(params?: GetStationMaintenanceParams): Promise<GetStationMaintenanceResponse> {
    try {
      console.log('📝 MaintenanceService: Fetching station maintenance reports with params:', params);
      
      // Clean up params
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
        if (params.status && params.status !== 'all') cleanParams.status = params.status;
      }
      
      const response = await axiosInstance.get<GetStationMaintenanceResponse>('/api/maintenance/station', {
        params: cleanParams,
      });
      
      console.log('✅ MaintenanceService: Station reports fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data || !response.data.data.reports) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MaintenanceService: Error fetching station reports:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho Station Staff');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải danh sách báo cáo bảo trì');
      }
      
      throw error;
    }
  }

  /**
   * Get maintenance report by ID
   */
  async getMaintenanceById(id: string): Promise<GetMaintenanceByIdResponse> {
    try {
      console.log('📝 MaintenanceService: Fetching maintenance report by ID:', id);
      
      const response = await axiosInstance.get<GetMaintenanceByIdResponse>(`/api/maintenance/${id}`);
      
      console.log('✅ MaintenanceService: Report fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MaintenanceService: Error fetching report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy báo cáo bảo trì');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải thông tin báo cáo');
      }
      
      throw error;
    }
  }

  /**
   * Update maintenance report (Admin only)
   */
  async updateMaintenance(id: string, payload: UpdateMaintenancePayload): Promise<UpdateMaintenanceResponse> {
    try {
      console.log('📝 MaintenanceService: Updating maintenance report:', { id, payload });
      
      // Create FormData for multipart/form-data
      const formData = new FormData();
      
      formData.append('status', payload.status);
      if (payload.notes) formData.append('notes', payload.notes);
      
      // Add images if exists
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      const response = await axiosInstance.put<UpdateMaintenanceResponse>(
        `/api/maintenance/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('✅ MaintenanceService: Report updated successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MaintenanceService: Error updating report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ');
      } else if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho Admin');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy báo cáo bảo trì');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi cập nhật báo cáo');
      }
      
      throw error;
    }
  }

  /**
   * Delete maintenance report (Admin only - Soft delete)
   */
  async deleteMaintenance(id: string): Promise<DeleteMaintenanceResponse> {
    try {
      console.log('📝 MaintenanceService: Deleting maintenance report:', id);
      
      const response = await axiosInstance.delete<DeleteMaintenanceResponse>(`/api/maintenance/${id}`);
      
      console.log('✅ MaintenanceService: Report deleted successfully:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ MaintenanceService: Error deleting report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập. Chức năng này chỉ dành cho Admin');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy báo cáo bảo trì');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi xóa báo cáo');
      }
      
      throw error;
    }
  }
}

export default new MaintenanceService();






