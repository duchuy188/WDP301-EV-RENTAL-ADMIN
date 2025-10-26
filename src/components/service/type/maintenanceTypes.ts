/**
 * Maintenance Type Definitions
 */

export type MaintenanceStatus = 'reported' | 'fixed';
export type SortOrder = 'asc' | 'desc';

export interface MaintenanceVehicle {
  _id: string;
  name: string;
  license_plate: string;
  model: string;
  type: string;
}

export interface MaintenanceStation {
  _id: string;
  name: string;
  address: string;
}

export interface MaintenanceReporter {
  _id: string;
  fullname: string;
  email: string;
}

export interface MaintenanceReport {
  _id: string;
  code: string;
  vehicle_id: MaintenanceVehicle | string;
  station_id: MaintenanceStation | string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  reported_by: MaintenanceReporter | string;
  notes?: string;
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface MaintenanceStats {
  reported: number;
  fixed: number;
}

export interface GetMaintenanceParams {
  page?: number;
  limit?: number;
  status?: MaintenanceStatus | 'all';
  station_id?: string;
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface GetStationMaintenanceParams {
  page?: number;
  limit?: number;
  status?: MaintenanceStatus | 'all';
}

export interface GetMaintenanceResponse {
  success: boolean;
  data: {
    reports: MaintenanceReport[];
    pagination: MaintenancePagination;
    stats: MaintenanceStats;
  };
}

export interface GetStationMaintenanceResponse {
  success: boolean;
  data: {
    reports: MaintenanceReport[];
    pagination: MaintenancePagination;
  };
}

export interface GetMaintenanceByIdResponse {
  success: boolean;
  data: MaintenanceReport;
}

export interface UpdateMaintenancePayload {
  status: MaintenanceStatus;
  notes?: string;
  images?: File[];
}

export interface UpdateMaintenanceResponse {
  success: boolean;
  message: string;
  data: MaintenanceReport;
}

export interface DeleteMaintenanceResponse {
  success: boolean;
  message: string;
}






