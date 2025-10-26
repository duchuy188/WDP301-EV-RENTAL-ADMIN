/**
 * Rental Type Definitions
 */

export type RentalStatus = 'active' | 'pending_payment' | 'completed';

export interface VehicleCondition {
  mileage: number;
  battery_level: number;
  exterior_condition: string;
  interior_condition: string;
  notes?: string;
}

export interface Rental {
  _id: string;
  code: string;
  booking_id: string | { _id: string; [key: string]: any };
  user_id: string | { _id: string; [key: string]: any };
  vehicle_id: string | { _id: string; [key: string]: any };
  station_id: string | { _id: string; [key: string]: any };
  contract?: { _id: string; [key: string]: any };
  actual_start_time: string;
  actual_end_time?: string;
  pickup_staff_id?: string | { _id: string; [key: string]: any };
  return_staff_id?: string | { _id: string; [key: string]: any };
  vehicle_condition_before: VehicleCondition;
  vehicle_condition_after?: VehicleCondition;
  images_before: string[];
  images_after?: string[];
  status: RentalStatus;
  late_fee?: number;
  damage_fee?: number;
  other_fees?: number;
  total_fees?: number;
  staff_notes?: string;
  customer_notes?: string;
  created_by: string | { _id: string; [key: string]: any };
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetUserRentalsParams {
  status?: RentalStatus;
  page?: number;
  limit?: number;
}

export interface GetAdminRentalsParams {
  status?: RentalStatus;
  user_id?: string;
  station_id?: string;
  page?: number;
  limit?: number;
}

export interface GetUserRentalsResponse {
  success: boolean;
  data: {
    rentals: Rental[];
    pagination: RentalPagination;
  };
}

export interface GetAdminRentalsResponse {
  success: boolean;
  data: {
    rentals: Rental[];
    pagination: RentalPagination;
  };
}

export interface GetRentalByIdResponse {
  success: boolean;
  data: Rental;
}

export interface CheckoutInfo {
  rental: {
    id: string;
    code: string;
    actual_start_time: string;
    vehicle_condition_before: VehicleCondition;
    images_before: string[];
    rental_duration_hours: number;
  };
  customer: {
    id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  vehicle: {
    id: string;
    name: string;
    license_plate: string;
    model: string;
    battery_capacity: number;
  };
  station: {
    id: string;
    name: string;
    address: string;
  };
  pickup_staff: {
    id: string;
    fullname: string;
  };
}

export interface GetCheckoutInfoResponse {
  success: boolean;
  data: CheckoutInfo;
}

