import { axiosInstance } from './api/axiosInstance';
import { API_CONFIG } from '../../lib/apiConfig';
import {
  ApiResponse,
  StationListResponse
} from './type/apiTypes';
import {
  Station,
  CreateStationRequest,
  UpdateStationRequest,
  StationQueryParams,
  StationStatistics,
  StationSyncResponse,
  StationWithVehicles,
  StationStaffResponse,
  CreateStationResponse,
  UpdateStationResponse,
  DeleteStationResponse,
  StationDetailResponse,
  IndividualStationSyncResponse
} from './type/stationTypes';

/**
 * Station Service - Quản lý các API liên quan đến trạm thuê
 */
class StationService {
  private baseUrl = '/api/stations';

  /**
   * Lấy danh sách trạm với phân trang và tìm kiếm
   */
  async getStations(params?: StationQueryParams): Promise<StationListResponse> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.stations.list, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          city: params?.city,
          district: params?.district,
          status: params?.status,
          search: params?.search,
          sort: params?.sort || 'name'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching stations:', error);
      
      // Return mock data in development mode if API fails
      if (import.meta.env.DEV) {
        console.log('Returning mock stations data for development');
        return this.getMockStations();
      }
      
      throw error;
    }
  }

  /**
   * Mock data for development when API is not available
   */
  private getMockStations(): StationListResponse {
    const mockStations: Station[] = [
      {
        _id: 'station-1',
        code: 'VF001',
        name: 'Trạm VinFast Quận 1',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        district: 'Quận 1',
        city: 'TP.HCM',
        description: 'Trạm thuê xe điện VinFast tại trung tâm Quận 1',
        phone: '0901234567',
        email: 'quan1@vinfast.vn',
        opening_time: '06:00',
        closing_time: '22:00',
        status: 'active',
        max_capacity: 50,
        current_vehicles: 35,
        available_vehicles: 28,
        rented_vehicles: 7,
        maintenance_vehicles: 0,
        createdAt: '2023-06-01T00:00:00.000Z',
        updatedAt: '2023-06-22T10:30:00.000Z'
      },
      {
        _id: 'station-2',
        code: 'VF002',
        name: 'Trạm VinFast Quận 2',
        address: '456 Đường Thủ Thiêm, Quận 2, TP.HCM',
        district: 'Quận 2',
        city: 'TP.HCM',
        description: 'Trạm thuê xe điện VinFast tại Khu đô thị Thủ Thiêm',
        phone: '0901234568',
        email: 'quan2@vinfast.vn',
        opening_time: '06:00',
        closing_time: '22:00',
        status: 'active',
        max_capacity: 40,
        current_vehicles: 32,
        available_vehicles: 25,
        rented_vehicles: 6,
        maintenance_vehicles: 1,
        createdAt: '2023-06-01T00:00:00.000Z',
        updatedAt: '2023-06-22T11:00:00.000Z'
      },
      {
        _id: 'station-3',
        code: 'VF003',
        name: 'Trạm VinFast Quận 7',
        address: '789 Nguyễn Thị Thập, Quận 7, TP.HCM',
        district: 'Quận 7',
        city: 'TP.HCM',
        description: 'Trạm thuê xe điện VinFast tại Phú Mỹ Hưng',
        phone: '0901234569',
        email: 'quan7@vinfast.vn',
        opening_time: '06:00',
        closing_time: '22:00',
        status: 'active',
        max_capacity: 60,
        current_vehicles: 45,
        available_vehicles: 38,
        rented_vehicles: 5,
        maintenance_vehicles: 2,
        createdAt: '2023-06-01T00:00:00.000Z',
        updatedAt: '2023-06-22T09:15:00.000Z'
      }
    ];

    return {
      stations: mockStations,
      pagination: {
        total: mockStations.length,
        page: 1,
        limit: 100,
        pages: 1
      }
    };
  }

  /**
   * Lấy thông tin chi tiết một trạm theo ID (với vehicles)
   */
  async getStationById(id: string, params?: {
    type?: 'scooter' | 'motorcycle';
    status?: 'available' | 'rented' | 'maintenance';
    sort?: 'name' | 'price';
  }): Promise<StationDetailResponse> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.stations.getById(id), {
        params: {
          type: params?.type,
          status: params?.status,
          sort: params?.sort || 'name'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching station ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tạo trạm mới (tự động generate code)
   */
  async createStation(stationData: CreateStationRequest): Promise<CreateStationResponse> {
    try {
      const response = await axiosInstance.post(API_CONFIG.endpoints.stations.create, stationData);
      return response.data;
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin trạm
   */
  async updateStation(id: string, stationData: UpdateStationRequest): Promise<UpdateStationResponse> {
    try {
      const response = await axiosInstance.put(API_CONFIG.endpoints.stations.update(id), stationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating station ${id}:`, error);
      throw error;
    }
  }

  /**
   * Xóa trạm (đánh dấu không hoạt động)
   */
  async deleteStation(id: string): Promise<DeleteStationResponse> {
    try {
      const response = await axiosInstance.delete(API_CONFIG.endpoints.stations.delete(id));
      return response.data;
    } catch (error) {
      console.error(`Error deleting station ${id}:`, error);
      throw error;
    }
  }


  /**
   * Lấy danh sách trạm đơn giản (chỉ ID và tên) để sử dụng trong dropdown
   */
  async getStationsSimple(): Promise<ApiResponse<import('./type/stationTypes').StationSimple[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/simple`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stations simple list:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê trạm - DEPRECATED: API chưa có trên backend
   * Sử dụng calculateStationStatistics() trong component thay thế
   */
  async getStationStatistics(): Promise<ApiResponse<StationStatistics>> {
    // API này chưa được implement trên backend
    // Sử dụng tính toán trực tiếp từ dữ liệu stations trong component
    throw new Error('Station statistics API not implemented on backend. Use calculateStationStatistics() in component instead.');
  }

  /**
   * Tìm kiếm trạm theo tên hoặc địa chỉ
   */
  async searchStations(query: string): Promise<ApiResponse<Station[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching stations:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách xe tại một trạm
   */
  async getVehiclesAtStation(stationId: string): Promise<ApiResponse<StationWithVehicles>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${stationId}/vehicles`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicles at station ${stationId}:`, error);
      throw error;
    }
  }

  /**
   * Đồng bộ số lượng xe trong một trạm cụ thể
   */
  async syncStation(stationId: string): Promise<ApiResponse<IndividualStationSyncResponse>> {
    try {
      console.log(`🔄 Starting sync for station ${stationId}...`);
      const response = await axiosInstance.post(API_CONFIG.endpoints.stations.sync(stationId));
      console.log(`✅ Sync station ${stationId} response:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error syncing station ${stationId}:`, error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  }

  /**
   * Đồng bộ toàn bộ xe giữa các trạm
   */
  async syncAllStations(): Promise<ApiResponse<StationSyncResponse>> {
    try {
      console.log('🔄 Starting sync all stations...');
      const response = await axiosInstance.post(API_CONFIG.endpoints.stations.syncAll);
      console.log('✅ Sync all stations response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error syncing all stations:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  }

  /**
   * Lấy danh sách nhân viên tại một trạm
   */
  async getStationStaff(stationId: string): Promise<ApiResponse<StationStaffResponse>> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.stations.getStaff(stationId));
      return response.data;
    } catch (error) {
      console.error(`Error fetching station ${stationId} staff:`, error);
      throw error;
    }
  }

}

// Export singleton instance
export const stationService = new StationService();
export default stationService;

