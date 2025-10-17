/**
 * Station Types - Types cho các API liên quan đến trạm thuê
 */

// Station Entity
export interface Station {
  _id: string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  description?: string;
  images?: string[];
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  status: 'active' | 'inactive' | 'maintenance';
  max_capacity: number;
  current_vehicles: number;
  available_vehicles: number;
  rented_vehicles: number;
  maintenance_vehicles: number;
  createdAt: string;
  updatedAt: string;
}

// Station Request Types
export interface CreateStationRequest {
  name: string; // required
  address: string; // required
  district: string; // required
  city: string; // required
  description?: string; // optional
  images?: string[]; // optional, max 10 images
  phone: string; // required
  email: string; // required
  opening_time: string; // required (format: "HH:MM")
  closing_time: string; // required (format: "HH:MM")
  max_capacity: number; // required
}

export interface UpdateStationRequest {
  name?: string;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  phone?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  max_capacity?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  images?: string[]; // New images to add to the station (optional)
}

// Station Response Types
export interface StationSimple {
  _id: string;
  code: string;
  name: string;
}

export interface StationStatistics {
  totalStations: number;
  activeStations: number;
  inactiveStations: number;
  stationsWithVehicles: number;
  averageVehiclesPerStation: number;
}

export interface StationWithVehicles {
  station: Station;
  vehicles: any[];
  totalVehicles: number;
  availableVehicles: number;
}

// Station Query Types
export interface StationQueryParams {
  page?: number;
  limit?: number;
  city?: string;
  district?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  search?: string;
  sort?: 'name' | 'available';
}

// Station Sync Response (based on actual API)
export interface StationSyncResponse {
  message: string;
  result?: {
    message: string;
  };
}

// Individual Station Sync Response (based on actual API)
export interface IndividualStationSyncResponse {
  message: string;
  station: {
    _id: string;
    code: string;
    name: string;
    address: string;
    district: string;
    city: string;
    description?: string;
    images?: string[];
    phone?: string;
    email?: string;
    opening_time?: string;
    closing_time?: string;
    status: string;
    current_vehicles: number;
    available_vehicles: number;
    rented_vehicles: number;
    maintenance_vehicles: number;
    createdAt: string;
    updatedAt: string;
  };
}


// Station Staff Types
export interface StationStaff {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: string;
  stationId: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface StationStaffResponse {
  station: {
    _id: string;
    code: string;
    name: string;
  };
  staff: StationStaff[];
  count: number;
}

// Create Station Response
export interface CreateStationResponse {
  message: string;
  station: Station;
}

// Update Station Response
export interface UpdateStationResponse {
  message: string;
  station: Station;
}

// Delete Station Response
export interface DeleteStationResponse {
  message: string;
  station: Station;
}

// Station Detail with Vehicles
export interface StationVehicle {
  _id: string;
  name: string;
  model: string;
  type: 'scooter' | 'motorcycle';
  price_per_day: number;
  status: 'available' | 'rented' | 'maintenance';
  current_battery: number;
  main_image: string;
}

export interface StationDetail extends Station {
  vehicles: StationVehicle[];
  staff_count: number;
}

export interface StationDetailResponse {
  station: StationDetail;
}

