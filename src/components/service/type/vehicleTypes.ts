/**
 * Vehicle Types - Types cho các API liên quan đến xe điện
 */

// Vehicle Status Enum
export type VehicleStatus = 'draft' | 'available' | 'reserved' | 'rented' | 'maintenance';

// Vehicle Type Enum
export type VehicleType = 'scooter' | 'motorcycle';

// Technical Status Enum
export type TechnicalStatus = 'good' | 'fair' | 'poor' | 'needs_repair';

// Vehicle Entity (matching actual API response)
export interface Vehicle {
  _id: string;
  name: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  battery_capacity: number;
  max_range: number;
  current_battery: number;
  current_mileage: number;
  price_per_day: number;
  deposit_percentage: number;
  station_id?: string;
  status: VehicleStatus;
  technical_status: TechnicalStatus;
  images: string[];
  created_by: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Normalized Vehicle interface for UI (to maintain compatibility)
export interface VehicleUI {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  batteryLevel: number;
  status: VehicleStatus;
  stationId?: string;
  stationName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields from API
  name: string;
  type: VehicleType;
  batteryCapacity: number;
  maxRange: number;
  currentMileage: number;
  pricePerDay: number;
  depositPercentage: number;
  technicalStatus: TechnicalStatus;
  images: string[];
  createdBy: string;
}

// API Response Types
export interface VehicleListResponse {
  vehicles: Vehicle[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Vehicle Request Types
export interface CreateVehicleRequest {
  name: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: VehicleType;
  battery_capacity: number;
  max_range: number;
  price_per_day: number;
  deposit_percentage: number;
  station_id?: string;
}

export interface UpdateVehicleRequest extends Partial<CreateVehicleRequest> {
  isActive?: boolean;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus;
}

export interface UpdateVehicleBatteryRequest {
  current_battery: number;
}

export interface BulkCreateVehicleRequest {
  vehicles: CreateVehicleRequest[];
}

export interface AssignVehicleByQuantityRequest {
  color: string;
  model: string;
  status: 'draft'; // Chỉ phân bổ xe có status draft
  quantity: number;
  station_id: string;
}

// Vehicle Response Types
export interface VehicleSimple {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  status: VehicleStatus;
  batteryLevel: number;
  stationName?: string;
}

export interface VehicleStatistics {
  totalVehicles: number;
  draftVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  averageBatteryLevel: number;
  stationsWithVehicles: number;
  totalStations: number;
}

export interface BulkCreateResponse {
  created: Vehicle[];
  failed: { data: CreateVehicleRequest; error: string }[];
  totalCreated: number;
  totalFailed: number;
}

export interface AssignVehicleResponse {
  message: string;
  assignedVehicles: Vehicle[];
  totalAssigned: number;
}

// Vehicle Query Types
export interface VehicleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  status?: VehicleStatus;
  stationId?: string;
  brand?: string;
  model?: string;
  batteryLevelMin?: number;
  batteryLevelMax?: number;
  year?: number;
  color?: string;
  type?: VehicleType;
}

export interface VehicleSearchParams {
  q: string;
  status?: VehicleStatus;
  stationId?: string;
  brand?: string;
  model?: string;
}

// Vehicle History Types
export interface VehicleHistory {
  vehicle: Vehicle;
  rentals: any[];
  maintenance: any[];
  batteryHistory: BatteryHistoryEntry[];
}

export interface BatteryHistoryEntry {
  id: string;
  vehicleId: string;
  batteryLevel: number;
  recordedAt: string;
  recordedBy?: string;
  notes?: string;
}

// Vehicle Maintenance Types
export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'routine' | 'repair' | 'inspection';
  description: string;
  performedAt: string;
  performedBy: string;
  cost?: number;
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// Vehicle Export/Import Types
export interface VehicleExportParams {
  format: 'excel' | 'csv';
  status?: VehicleStatus;
  stationId?: string;
  brand?: string;
  model?: string;
}

export interface VehicleImportResult {
  imported: Vehicle[];
  failed: { row: number; data: any; error: string }[];
  totalImported: number;
  totalFailed: number;
}

// Import License Plates
export interface ImportLicensePlatesRequest {
  file: File;
}

export interface ImportLicensePlatesResponse {
  imported: string[];
  failed: { licensePlate: string; error: string }[];
  totalImported: number;
  totalFailed: number;
}

// Export/Import Pricing
export interface ExportPricingTemplateResponse {
  file: Blob;
  filename: string;
}

export interface ImportPricingUpdatesRequest {
  file: File;
}

export interface ImportPricingUpdatesResponse {
  success: boolean;
  updated: number;
  failed: number;
  message: string;
  statusStats?: {
    available: number;
    maintenance: number;
  };
  details?: {
    successes: any[];
    failures: any[];
  };
}

// Vehicle Status Colors (for UI)
export interface VehicleStatusConfig {
  status: VehicleStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const VEHICLE_STATUS_CONFIGS: VehicleStatusConfig[] = [
  {
    status: 'available',
    label: 'Sẵn sàng',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    status: 'rented',
    label: 'Đang thuê',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    status: 'maintenance',
    label: 'Bảo trì',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    status: 'broken',
    label: 'Hỏng',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
];

// Withdraw Vehicles from Station
export interface WithdrawVehiclesRequest {
  station_id: string;
  model: string;
  color: string;
  quantity: number;
}

export interface WithdrawVehiclesResponse {
  message: string;
  withdrawn_count: number;
  station: {
    id: string;
    name: string;
    remaining_vehicles: number;
    remaining_available: number;
  };
  vehicles: Array<{
    name: string;
    model: string;
    color: string;
    status: 'draft';
  }>;
}

// Utility function to normalize API vehicle to UI vehicle
export function normalizeVehicleForUI(vehicle: Vehicle): VehicleUI {
  return {
    id: vehicle._id || '',
    licensePlate: vehicle.license_plate || '',
    model: vehicle.model || '',
    brand: vehicle.brand || '',
    year: vehicle.year || 0,
    color: vehicle.color || '',
    batteryLevel: vehicle.current_battery || 0,
    status: vehicle.status || 'available',
    stationId: vehicle.station_id,
    stationName: undefined, // Will be populated by join if needed
    isActive: vehicle.is_active !== false, // Default to true if undefined
    createdAt: vehicle.createdAt || '',
    updatedAt: vehicle.updatedAt || '',
    // Additional fields
    name: vehicle.name || '',
    type: vehicle.type || 'scooter',
    batteryCapacity: vehicle.battery_capacity || 0,
    maxRange: vehicle.max_range || 0,
    currentMileage: vehicle.current_mileage || 0,
    pricePerDay: vehicle.price_per_day || 0,
    depositPercentage: vehicle.deposit_percentage || 0,
    technicalStatus: vehicle.technical_status || 'good',
    images: vehicle.images || [],
    createdBy: vehicle.created_by || ''
  };
}

