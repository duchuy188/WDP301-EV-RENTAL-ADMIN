// Analytics Types

// Revenue Overview
export interface TopStationData {
  _id: string;
  stationName: string;
  revenue: number;
}

export interface RevenueOverviewData {
  totalRevenue: number;
  transactionCount: number;
  growthRate: number;
  topStation: TopStationData | null;
  period: 'today' | 'week' | 'month' | 'year';
  dateRange: {
    start: string;
    end: string;
  };
}

export interface RevenueOverviewResponse {
  success: boolean;
  data: RevenueOverviewData;
}

export interface RevenueOverviewParams {
  period?: 'today' | 'week' | 'month' | 'year';
  payment_method?: 'all' | 'cash' | 'vnpay' | 'bank_transfer';
}

// Revenue Trends
export interface RevenueTrendData {
  _id: {
    date: string;
  };
  revenue: number;
  transactionCount: number;
}

export interface RevenueTrendsResponse {
  success: boolean;
  data: {
    trends: RevenueTrendData[];
    period: 'today' | 'week' | 'month' | 'year';
    groupFormat: string;
  };
}

export interface RevenueTrendsParams {
  period?: 'today' | 'week' | 'month' | 'year';
  stations?: string; // ID trạm (phân cách bằng dấu phẩy) hoặc "all"
  payment_method?: 'all' | 'cash' | 'vnpay' | 'bank_transfer';
}

// Revenue Trends UI Display
export interface RevenueTrendUI {
  date: string;
  revenue: number;
  transactionCount: number;
  formattedDate?: string;
  formattedRevenue?: string;
}

// Helper function to normalize revenue trend for UI
export function normalizeRevenueTrendForUI(trend: RevenueTrendData): RevenueTrendUI {
  return {
    date: trend._id.date,
    revenue: trend.revenue,
    transactionCount: trend.transactionCount,
  };
}

// Revenue by Station
export interface StationRevenueData {
  _id: string;
  stationName: string;
  stationCode: string;
  stationAddress: string;
  revenue: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
  growthRate: number;
}

export interface RevenueByStationData {
  stations: StationRevenueData[];
  totalRevenue: number;
  period: 'today' | 'week' | 'month' | 'year';
  dateRange: {
    start: string;
    end: string;
  };
}

export interface RevenueByStationResponse {
  success: boolean;
  data: RevenueByStationData;
}

export interface RevenueByStationParams {
  period?: 'today' | 'week' | 'month' | 'year';
  date?: string; // YYYY-MM-DD
  payment_method?: 'all' | 'cash' | 'vnpay' | 'bank_transfer';
}

// UI Display for Station Revenue
export interface StationRevenueUI {
  id: string;
  name: string;
  code: string;
  address: string;
  revenue: number;
  transactionCount: number;
  averageTransaction: number;
  percentage: number;
  growthRate: number;
}

// Helper function to normalize station revenue for UI
export function normalizeStationRevenueForUI(station: StationRevenueData): StationRevenueUI {
  return {
    id: station._id,
    name: station.stationName,
    code: station.stationCode,
    address: station.stationAddress,
    revenue: station.revenue,
    transactionCount: station.transactionCount,
    averageTransaction: station.averageTransaction,
    percentage: station.percentage,
    growthRate: station.growthRate
  };
}

// Period labels
export const PERIOD_LABELS: Record<string, string> = {
  today: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
  year: 'Năm này'
};

// Station Revenue Detail
export interface StationBasicInfo {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface RevenueByVehicleType {
  _id: string;
  revenue: number;
  count: number;
}

export interface RevenueByHour {
  _id: number;
  revenue: number;
  count: number;
}

export interface TopCustomer {
  _id: string;
  customerName: string;
  customerEmail: string;
  totalSpent: number;
  rentalCount: number;
}

export interface VehicleUtilization {
  _id: string;
  licensePlate: string;
  vehicleType: string;
  rentalCount: number;
  totalRevenue: number;
}

export interface StationRevenueDetailData {
  station: StationBasicInfo;
  revenueByVehicleType: RevenueByVehicleType[];
  revenueByHour: RevenueByHour[];
  topCustomers: TopCustomer[];
  vehicleUtilization: VehicleUtilization[];
}

export interface StationRevenueDetailResponse {
  success: boolean;
  data: StationRevenueDetailData;
}

export interface StationRevenueDetailParams {
  stationId: string;
  period?: 'today' | 'week' | 'month' | 'year';
  date?: string; // YYYY-MM-DD
  payment_method?: 'all' | 'cash' | 'vnpay' | 'bank_transfer';
}

// Payment method labels for analytics
export const ANALYTICS_PAYMENT_METHOD_LABELS: Record<string, string> = {
  all: 'Tất cả',
  cash: 'Tiền mặt',
  vnpay: 'VNPay',
  bank_transfer: 'Chuyển khoản'
};

// Vehicle type labels
export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  scooter: 'Xe ga',
  motorcycle: 'Xe số',
  electric_bike: 'Xe đạp điện'
};

// Staff Performance
export interface StaffStationInfo {
  id: string;
  name: string;
  address: string;
}

export interface RentalStats {
  total_rentals: number;
  pickup_count: number;
  return_count: number;
}

export interface FeedbackStats {
  total_ratings: number;
  avg_overall_rating: number;
  avg_staff_service: number;
  avg_vehicle_condition: number;
  avg_station_cleanliness: number;
  avg_checkout_process: number;
}

export interface ComplaintStats {
  total_complaints: number;
  pending_complaints: number;
  resolved_complaints: number;
  resolution_rate: number;
}

export interface StaffPerformanceItem {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  station: StaffStationInfo;
  performance_score: number;
  rental_stats: RentalStats;
  feedback_stats: FeedbackStats;
  complaint_stats: ComplaintStats;
}

export interface StaffPerformanceSummary {
  total_staff: number;
  avg_performance_score: number;
  top_performer: Partial<StaffPerformanceItem>;
  date_range: {
    start: string;
    end: string;
  };
}

export interface StaffPerformanceData {
  period: string;
  staff_performance: StaffPerformanceItem[];
  summary: StaffPerformanceSummary;
}

export interface StaffPerformanceResponse {
  success: boolean;
  data: StaffPerformanceData;
}

export interface StaffPerformanceParams {
  period?: '7d' | '30d' | '90d' | '1y';
  station_id?: string;
}

// Staff Performance Detail
export interface StaffBasicInfo {
  id: string;
  name: string;
  email: string;
  station: StaffStationInfo;
}

export interface RentalDetail {
  rental_id: string;
  vehicle_name: string;
  vehicle_type: string;
  license_plate: string;
  station_name: string;
  customer_name: string;
  customer_email: string;
  pickup_staff_id: string;
  return_staff_id: string;
  actual_start_time: string;
  actual_end_time: string;
  total_amount: number;
  is_pickup: boolean;
  is_return: boolean;
}

export interface FeedbackDetail {
  _id: string;
  type: string;
  overall_rating: number;
  staff_service: number;
  vehicle_condition: number;
  station_cleanliness: number;
  checkout_process: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface StaffPerformanceDetailData {
  staff: StaffBasicInfo;
  period: string;
  performance_score: number;
  rental_stats: RentalStats;
  feedback_stats: FeedbackStats;
  complaint_stats: ComplaintStats;
  rental_details: RentalDetail[];
  feedback_details: FeedbackDetail[];
  date_range: {
    start: string;
    end: string;
  };
}

export interface StaffPerformanceDetailResponse {
  success: boolean;
  data: StaffPerformanceDetailData;
}

export interface StaffPerformanceDetailParams {
  staffId: string;
  period?: '7d' | '30d' | '90d' | '1y';
}

// Period labels for staff performance
export const STAFF_PERIOD_LABELS: Record<string, string> = {
  '7d': '7 ngày',
  '30d': '30 ngày',
  '90d': '90 ngày',
  '1y': '1 năm'
};

