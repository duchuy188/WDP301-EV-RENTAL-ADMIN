import { axiosInstance } from './api/axiosInstance';
import { buildUrlSearchParams } from './utils/apiUtils';

// Types for Assignment API
export interface UnassignedStaff {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  avatar?: string;
  status: string;
  role: string;
  stationId?: string;
  kyc_status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnassignedStaffResponse {
  message: string;
  staff: UnassignedStaff[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AssignStaffRequest {
  userId: string;
  stationId: string;
}

export interface AssignStaffResponse {
  message: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
    stationId: string;
  };
  station: {
    _id: string;
    name: string;
    code: string;
  };
}

export interface UnassignStaffRequest {
  userId: string;
}

export interface UnassignStaffResponse {
  message: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
    stationId: null;
    previousStationId: string;
  };
}

export interface Station {
  _id: string;
  name: string;
  code: string;
  address?: string;
  status?: string;
}

export interface UnassignedStaffParams {
  page?: number;
  limit?: number;
  search?: string;
}

export class AssignmentService {
  /**
   * Get list of staff without assigned stations
   * @param params - Query parameters for pagination and search
   * @returns Promise<UnassignedStaffResponse>
   */
  static async getUnassignedStaff(params: UnassignedStaffParams = {}): Promise<UnassignedStaffResponse> {
    const queryParams = this.buildQueryParams(params);
    const response = await axiosInstance.get(`/api/users/staff/unassigned?${queryParams}`);
    return response.data;
  }

  /**
   * Assign staff to a station
   * @param data - Assignment request data
   * @returns Promise<AssignStaffResponse>
   */
  static async assignStaff(data: AssignStaffRequest): Promise<AssignStaffResponse> {
    const response = await axiosInstance.post('/api/users/staff/assign', data);
    return response.data;
  }

  /**
   * Unassign staff from current station
   * @param data - Unassign request data
   * @returns Promise<UnassignStaffResponse>
   */
  static async unassignStaff(data: UnassignStaffRequest): Promise<UnassignStaffResponse> {
    const response = await axiosInstance.post('/api/users/staff/unassign', data);
    return response.data;
  }

  /**
   * Get list of stations
   * @returns Promise<Station[]>
   */
  static async getStations(): Promise<Station[]> {
    // Request with high limit to get all stations
    const response = await axiosInstance.get('/api/stations?page=1&limit=999');
    const stations = response.data.stations || response.data;
    
    console.log('🏢 All Stations API Response:', response.data);
    console.log('📊 Total stations from API:', stations?.length || 0);
    console.log('📋 Station details:', stations?.map((s: any) => ({
      name: s.name,
      code: s.code,
      status: s.status,
      address: s.address
    })));
    
    return stations;
  }

  /**
   * Build query parameters string
   * @param params - Parameters object
   * @returns Query string
   */
  private static buildQueryParams(params: UnassignedStaffParams): string {
    return buildUrlSearchParams(params);
  }
}

