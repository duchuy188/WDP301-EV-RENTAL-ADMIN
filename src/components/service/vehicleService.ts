import { axiosInstance } from './api/axiosInstance';
import { API_CONFIG } from '../../lib/apiConfig';
import {
  ApiResponse,
  PaginatedResponse
} from './type/apiTypes';
import {
  Vehicle,
  VehicleUI,
  VehicleListResponse,
  VehicleStatus,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UpdateVehicleStatusRequest,
  UpdateVehicleBatteryRequest,
  BulkCreateVehicleRequest,
  AssignVehicleByQuantityRequest,
  VehicleStatistics,
  VehicleQueryParams,
  VehicleHistory,
  VehicleImportResult,
  BulkCreateResponse,
  AssignVehicleResponse,
  ImportLicensePlatesRequest,
  ImportLicensePlatesResponse,
  ExportPricingTemplateResponse,
  ImportPricingUpdatesRequest,
  ImportPricingUpdatesResponse,
  WithdrawVehiclesRequest,
  WithdrawVehiclesResponse,
  normalizeVehicleForUI
} from './type/vehicleTypes';

/**
 * Vehicle Service - Quản lý các API liên quan đến xe điện
 */
class VehicleService {
  private baseUrl = '/api/vehicles';

  /**
   * Lấy danh sách xe cho admin với phân trang và bộ lọc
   */
  async getVehiclesForAdmin(params?: VehicleQueryParams): Promise<{ data: VehicleUI[]; pagination?: any }> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.vehicles.list, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          search: params?.search,
          sort: params?.sort || 'createdAt',
          order: params?.sort?.includes('desc') ? 'desc' : 'asc',
          status: params?.status,
          station_id: params?.stationId,
          brand: params?.brand,
          model: params?.model,
          color: params?.color,
          type: params?.type
        }
      });

      // Handle the actual API response structure
      console.log('Raw API Response:', response.data);
      
      const apiResponse: VehicleListResponse = response.data;
      
      // Check if vehicles array exists
      if (!apiResponse.vehicles || !Array.isArray(apiResponse.vehicles)) {
        console.warn('No vehicles array in response, returning empty array');
        return {
          data: [],
          pagination: apiResponse.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
        };
      }
      
      // Normalize vehicles for UI
      const normalizedVehicles = apiResponse.vehicles.map((vehicle, index) => {
        try {
          return normalizeVehicleForUI(vehicle);
        } catch (error) {
          console.error(`Error normalizing vehicle at index ${index}:`, error, vehicle);
          // Return a fallback vehicle object
          return {
            id: vehicle._id || `fallback-${index}`,
            licensePlate: vehicle.license_plate || 'N/A',
            model: vehicle.model || 'Unknown',
            brand: vehicle.brand || 'Unknown',
            year: vehicle.year || 0,
            color: vehicle.color || 'Unknown',
            batteryLevel: vehicle.current_battery || 0,
            status: vehicle.status || 'available',
            stationId: vehicle.station_id,
            stationName: undefined,
            isActive: true,
            createdAt: vehicle.createdAt || '',
            updatedAt: vehicle.updatedAt || '',
            name: vehicle.name || 'Unknown',
            type: vehicle.type || 'scooter',
            batteryCapacity: vehicle.battery_capacity || 0,
            maxRange: vehicle.max_range || 0,
            currentMileage: vehicle.current_mileage || 0,
            pricePerDay: vehicle.price_per_day || 0,
            depositPercentage: vehicle.deposit_percentage || 0,
            technicalStatus: vehicle.technical_status || 'good',
            images: vehicle.images || [],
            createdBy: vehicle.created_by || ''
          } as VehicleUI;
        }
      });

      console.log('Normalized vehicles:', normalizedVehicles);

      return {
        data: normalizedVehicles,
        pagination: apiResponse.pagination
      };
    } catch (error) {
      console.error('Error fetching vehicles for admin:', error);
      
      // Return mock data for development if network fails
      if (import.meta.env.DEV) {
        console.warn('Using mock data due to network error');
        const mockData = this.getMockVehicles();
        // Throw a special error to indicate we're using mock data
        const mockError = new Error('Using mock data due to network error');
        mockError.name = 'MockDataError';
        // But still return the data through a promise resolution
        return Promise.resolve(mockData);
      }
      
      throw error;
    }
  }

  /**
   * Mock data for development when API is not available
   */
  public getMockVehicles(): { data: VehicleUI[]; pagination: any } {
    const mockVehicles: VehicleUI[] = [
      {
        id: 'mock-1',
        licensePlate: '51A-123.45',
        model: 'Klara S',
        brand: 'VinFast',
        year: 2023,
        color: 'Đỏ',
        batteryLevel: 85,
        status: 'available',
        stationId: 'station-1',
        stationName: 'Trạm thử xe VinFast Quận 2',
        isActive: true,
        createdAt: '2023-06-21T15:30:45.123Z',
        updatedAt: '2023-06-22T10:15:30.456Z',
        name: 'VH001',
        type: 'scooter',
        batteryCapacity: 2.3,
        maxRange: 80,
        currentMileage: 1250,
        pricePerDay: 150000,
        depositPercentage: 50,
        technicalStatus: 'good',
        images: ['https://via.placeholder.com/300x200?text=VinFast+Klara+S'],
        createdBy: 'admin'
      },
      {
        id: 'mock-2',
        licensePlate: '30B-678.90',
        model: 'Klara A2',
        brand: 'VinFast',
        year: 2023,
        color: 'Xanh',
        batteryLevel: 92,
        status: 'rented',
        stationId: 'station-2',
        stationName: 'Trạm VinFast Quận 1',
        isActive: true,
        createdAt: '2023-06-20T14:20:30.789Z',
        updatedAt: '2023-06-22T09:45:15.123Z',
        name: 'VH002',
        type: 'scooter',
        batteryCapacity: 2.5,
        maxRange: 90,
        currentMileage: 890,
        pricePerDay: 180000,
        depositPercentage: 50,
        technicalStatus: 'good',
        images: ['https://via.placeholder.com/300x200?text=VinFast+Klara+A2'],
        createdBy: 'admin'
      },
      {
        id: 'mock-3',
        licensePlate: '29C-111.22',
        model: 'Evo 200',
        brand: 'VinFast',
        year: 2023,
        color: 'Trắng',
        batteryLevel: 45,
        status: 'maintenance',
        stationId: 'station-1',
        stationName: 'Trạm thử xe VinFast Quận 2',
        isActive: true,
        createdAt: '2023-06-19T11:10:20.456Z',
        updatedAt: '2023-06-22T08:30:45.789Z',
        name: 'VH003',
        type: 'motorcycle',
        batteryCapacity: 3.2,
        maxRange: 120,
        currentMileage: 2150,
        pricePerDay: 250000,
        depositPercentage: 60,
        technicalStatus: 'fair',
        images: ['https://via.placeholder.com/300x200?text=VinFast+Evo+200'],
        createdBy: 'admin'
      }
    ];

    return {
      data: mockVehicles,
      pagination: {
        total: mockVehicles.length,
        page: 1,
        limit: 10,
        pages: 1
      }
    };
  }

  /**
   * Lấy thông tin chi tiết một xe theo ID
   */
  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.vehicles.getById(id));
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tạo xe mới
   */
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.create, vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin xe
   */
  async updateVehicle(id: string, vehicleData: UpdateVehicleRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await axiosInstance.put(API_CONFIG.endpoints.vehicles.update(id), vehicleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật trạng thái xe
   */
  async updateVehicleStatus(id: string, statusData: UpdateVehicleStatusRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await axiosInstance.patch(API_CONFIG.endpoints.vehicles.updateStatus(id), statusData);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id} status:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật pin xe
   */
  async updateVehicleBattery(id: string, batteryData: UpdateVehicleBatteryRequest): Promise<ApiResponse<Vehicle>> {
    try {
      const response = await axiosInstance.patch(API_CONFIG.endpoints.vehicles.updateBattery(id), batteryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id} battery:`, error);
      throw error;
    }
  }

  /**
   * Xóa xe
   */
  async deleteVehicle(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.delete(API_CONFIG.endpoints.vehicles.delete(id));
      return response.data;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  }

  /**
   * Tạo xe hàng loạt hoặc xuất Excel template
   */
  async bulkCreateVehicles(bulkData: any): Promise<any> {
    try {
      // Create FormData to handle image uploads
      const formData = new FormData();
      
      // Append text fields
      formData.append('model', bulkData.model);
      formData.append('year', bulkData.year.toString());
      formData.append('color', bulkData.color);
      formData.append('type', bulkData.type);
      formData.append('battery_capacity', bulkData.battery_capacity.toString());
      formData.append('max_range', bulkData.max_range.toString());
      formData.append('current_battery', bulkData.current_battery.toString());
      formData.append('price_per_day', bulkData.price_per_day.toString());
      formData.append('deposit_percentage', bulkData.deposit_percentage.toString());
      formData.append('quantity', bulkData.quantity.toString());
      formData.append('export_excel', bulkData.export_excel.toString());
      
      // Append images (if any)
      if (bulkData.images && bulkData.images.length > 0) {
        bulkData.images.forEach((image: File) => {
          formData.append('images', image);
        });
      }
      
      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.bulkCreate, formData, {
        responseType: bulkData.export_excel ? 'blob' : 'json',
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (bulkData.export_excel) {
        // Return blob for Excel download
        return response.data;
      } else {
        // Return JSON response for vehicle creation
        return response.data;
      }
    } catch (error) {
      console.error('Error in bulk create vehicles:', error);
      throw error;
    }
  }

  /**
   * Phân bổ xe theo trạm
   */
  async assignVehiclesByQuantity(assignData: AssignVehicleByQuantityRequest): Promise<ApiResponse<AssignVehicleResponse>> {
    try {
      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.assignByQuantity, assignData);
      return response.data;
    } catch (error) {
      console.error('Error assigning vehicles by quantity:', error);
      throw error;
    }
  }

  /**
   * Rút xe từ trạm về trạng thái draft (chưa phân bổ)
   */
  async withdrawVehiclesFromStation(withdrawData: WithdrawVehiclesRequest): Promise<ApiResponse<WithdrawVehiclesResponse>> {
    try {
      console.log('Withdrawing vehicles from station:', withdrawData);
      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.withdrawFromStation, withdrawData);
      console.log('Withdraw response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error withdrawing vehicles from station:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách model xe duy nhất
   */
  async getVehicleModels(): Promise<ApiResponse<string[]>> {
    try {
      // Lấy tất cả xe để extract models
      const response = await this.getVehiclesForAdmin({ limit: 1000 });
      const vehicles = response.data || [];
      
      // Lấy danh sách model duy nhất và sắp xếp
      const uniqueModels = [...new Set(vehicles.map(v => v.model).filter(Boolean))].sort();
      
      return {
        success: true,
        data: uniqueModels,
        message: 'Lấy danh sách model thành công'
      };
    } catch (error) {
      console.error('Error getting vehicle models:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách brand xe duy nhất
   */
  async getVehicleBrands(): Promise<ApiResponse<string[]>> {
    try {
      // Lấy tất cả xe để extract brands
      const response = await this.getVehiclesForAdmin({ limit: 1000 });
      const vehicles = response.data || [];
      
      // Lấy danh sách brand duy nhất và sắp xếp
      const uniqueBrands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort();
      
      return {
        success: true,
        data: uniqueBrands,
        message: 'Lấy danh sách brand thành công'
      };
    } catch (error) {
      console.error('Error getting vehicle brands:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê tổng hợp đội xe
   */
  async getVehicleStatistics(): Promise<ApiResponse<VehicleStatistics>> {
    try {
      const response = await axiosInstance.get(API_CONFIG.endpoints.vehicles.statistics);
      console.log('Raw statistics response:', response.data);
      
      // Handle the actual API response structure
      const statsData = response.data;
      console.log('Raw statistics data:', statsData);
      
      // Calculate totals from the actual API response
      const statusStats = statsData.statusStats || [];
      const stationStats = statsData.stationStats || [];
      const typeStats = statsData.typeStats || [];
      
      // Calculate vehicle counts by status (enum: 'draft', 'available', 'reserved', 'rented', 'maintenance')
      const draftVehicles = statusStats.find((s: any) => s._id === 'draft')?.count || 0;
      const availableVehicles = statusStats.find((s: any) => s._id === 'available')?.count || 0;
      const reservedVehicles = statusStats.find((s: any) => s._id === 'reserved')?.count || 0;
      const rentedVehicles = statusStats.find((s: any) => s._id === 'rented')?.count || 0;
      const maintenanceVehicles = statusStats.find((s: any) => s._id === 'maintenance')?.count || 0;
      
      // Calculate total vehicles
      const totalVehicles = statusStats.reduce((sum: number, stat: any) => sum + (stat.count || 0), 0);
      
      // Map API response to our VehicleStatistics interface
      const normalizedStats: VehicleStatistics = {
        totalVehicles,
        draftVehicles,
        availableVehicles,
        reservedVehicles,
        rentedVehicles,
        maintenanceVehicles,
        averageBatteryLevel: 75, // Default since API doesn't provide this
        stationsWithVehicles: stationStats.length,
        totalStations: stationStats.length
      };
      
      return {
        data: normalizedStats,
        message: 'Statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching vehicle statistics:', error);
      
      // Return mock statistics for development if network fails
      if (import.meta.env.DEV) {
        console.warn('Using mock statistics due to network error');
        return {
          data: {
            totalVehicles: 3,
            draftVehicles: 0,
            availableVehicles: 1,
            reservedVehicles: 0,
            rentedVehicles: 1,
            maintenanceVehicles: 1,
            averageBatteryLevel: 74,
            stationsWithVehicles: 2,
            totalStations: 3
          },
          message: 'Mock statistics for development'
        };
      }
      
      throw error;
    }
  }

  /**
   * Tìm kiếm xe theo biển số, model, brand
   */
  async searchVehicles(query: string, filters?: {
    status?: VehicleStatus;
    stationId?: string;
  }): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/search`, {
        params: { 
          q: query,
          status: filters?.status,
          stationId: filters?.stationId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching vehicles:', error);
      throw error;
    }
  }

  /**
   * Lấy xe theo trạng thái
   */
  async getVehiclesByStatus(status: VehicleStatus): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/status/${status}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicles by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Lấy xe cần sạc (pin thấp)
   */
  async getVehiclesNeedCharging(batteryThreshold: number = 20): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/need-charging`, {
        params: { batteryThreshold }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles need charging:', error);
      throw error;
    }
  }

  /**
   * Lấy xe cần bảo trì
   */
  async getVehiclesNeedMaintenance(): Promise<ApiResponse<Vehicle[]>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/need-maintenance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles need maintenance:', error);
      throw error;
    }
  }

  /**
   * Lấy lịch sử xe (nếu có API)
   */
  async getVehicleHistory(vehicleId: string): Promise<ApiResponse<VehicleHistory>> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/${vehicleId}/history`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${vehicleId} history:`, error);
      throw error;
    }
  }

  /**
   * Export danh sách xe ra file Excel/CSV
   */
  async exportVehicles(format: 'excel' | 'csv' = 'excel', filters?: {
    status?: VehicleStatus;
    stationId?: string;
    brand?: string;
  }): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/export`, {
        params: {
          format,
          status: filters?.status,
          stationId: filters?.stationId,
          brand: filters?.brand
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting vehicles:', error);
      throw error;
    }
  }

  /**
   * Import xe từ file Excel/CSV
   */
  async importVehicles(file: File): Promise<ApiResponse<VehicleImportResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post(`${this.baseUrl}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing vehicles:', error);
      throw error;
    }
  }

  /**
   * Export danh sách xe chưa có biển số
   */
  async exportDraftVehicles(): Promise<Blob> {
    try {
      console.log('Exporting draft vehicles (without license plates)');
      console.log('API endpoint:', API_CONFIG.endpoints.vehicles.exportDraftVehicles);

      const response = await axiosInstance.get(API_CONFIG.endpoints.vehicles.exportDraftVehicles, {
        responseType: 'blob',
        timeout: 60000 // 60 seconds timeout
      });
      
      console.log('Export draft vehicles response received, blob size:', response.data.size);
      return response.data;
    } catch (error: any) {
      console.error('Error exporting draft vehicles:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Import biển số từ Excel
   */
  async importLicensePlates(file: File): Promise<ApiResponse<ImportLicensePlatesResponse>> {
    try {
      const formData = new FormData();
      formData.append('excel_file', file); // API spec shows 'excel_file' as parameter name
      
      console.log('Importing license plates with file:', file.name, 'size:', file.size);
      console.log('API endpoint:', API_CONFIG.endpoints.vehicles.importLicensePlates);

      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.importLicensePlates, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds timeout for file upload
      });
      
      console.log('Import license plates response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error importing license plates:', error);
      
      // Log detailed error information
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
   * Xuất template cập nhật giá hàng loạt
   */
  async exportPricingTemplate(filter?: { model?: string; color?: string; year?: number }): Promise<Blob> {
    try {
      // Sử dụng filter được truyền vào, hoặc rỗng nếu không có
      const requestBody = filter || {};
      
      console.log('Exporting pricing template with filter:', requestBody);
      console.log('API endpoint:', API_CONFIG.endpoints.vehicles.exportPricingTemplate);

      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.exportPricingTemplate, requestBody, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });
      
      console.log('Export pricing template response received, blob size:', response.data.size);
      return response.data;
    } catch (error: any) {
      console.error('Error exporting pricing template:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      
      throw error;
    }
  }

  /**
   * Import và cập nhật giá từ Excel
   */
  async importPricingUpdates(file: File): Promise<ApiResponse<ImportPricingUpdatesResponse>> {
    try {
      const formData = new FormData();
      formData.append('excel_file', file); // API spec shows 'excel_file' as parameter name
      
      console.log('Importing pricing updates with file:', file.name, 'size:', file.size);
      console.log('API endpoint:', API_CONFIG.endpoints.vehicles.importPricingUpdates);

      const response = await axiosInstance.post(API_CONFIG.endpoints.vehicles.importPricingUpdates, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 60 seconds timeout for file upload
      });
      
      console.log('Import pricing updates response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error importing pricing updates:', error);
      
      // Log detailed error information
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

}

// Export singleton instance
export const vehicleService = new VehicleService();
export default vehicleService;

