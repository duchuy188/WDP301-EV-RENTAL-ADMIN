// Standard API Response Types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  success?: boolean;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Station specific response format
export interface StationListResponse {
  stations: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
  details?: any;
}

// Common Query Parameters
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request Configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
}

// Re-export specific types from dedicated files
export type { Station, CreateStationRequest, UpdateStationRequest } from './stationTypes';
export type { 
  Vehicle, 
  VehicleStatus, 
  CreateVehicleRequest, 
  UpdateVehicleRequest,
  UpdateVehicleStatusRequest,
  UpdateVehicleBatteryRequest,
  BulkCreateVehicleRequest,
  AssignVehicleByQuantityRequest,
  VehicleStatistics
} from './vehicleTypes';





