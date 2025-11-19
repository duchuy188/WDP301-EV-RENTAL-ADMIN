/**
 * Report Type Definitions
 */

export type IssueType = 'accident' | 'battery_issue' | 'vehicle_breakdown' | 'other';
export type ReportStatus = 'pending' | 'resolved';

export interface Report {
  _id: string;
  code: string;
  rental_id: {
    _id: string;
    code: string;
  };
  booking_id: string;
  user_id: {
    _id: string;
    email: string;
    phone: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
  };
  issue_type: IssueType;
  description: string;
  images: string[];
  status: ReportStatus;
  resolution_notes: string;
  resolved_at: string | null;
  resolved_by: {
    _id: string;
  } | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ReportPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetReportsResponse {
  success: boolean;
  data: Report[];
  pagination: ReportPagination;
}

export interface GetReportByIdResponse {
  success: boolean;
  data: Report;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  issue_type?: IssueType;
  station_id?: string;
  search?: string;
}

export interface ReportStatsByType {
  _id: IssueType;
  count: number;
}

export interface ReportStats {
  total: number;
  pending: number;
  resolved: number;
  byType: ReportStatsByType[];
}

export interface GetReportStatsResponse {
  success: boolean;
  data: ReportStats;
}

export interface GetReportStatsParams {
  station_id?: string;
}

export interface ResolveReportPayload {
  resolution_notes: string;
}

export interface ResolveReportResponse {
  success: boolean;
  data: Report;
  message: string;
}

export interface ReportStats {
  total: number;
  pending: number;
  resolved: number;
  byIssueType: {
    accident: number;
    battery_issue: number;
    vehicle_breakdown: number;
    other: number;
  };
}

// Helper function to get issue type display name
export const getIssueTypeLabel = (type: IssueType): string => {
  const labels: Record<IssueType, string> = {
    accident: 'Tai nạn',
    battery_issue: 'Vấn đề pin',
    vehicle_breakdown: 'Hỏng xe',
    other: 'Khác'
  };
  return labels[type] || type;
};

// Helper function to get status label
export const getReportStatusLabel = (status: ReportStatus): string => {
  const labels: Record<ReportStatus, string> = {
    pending: 'Chờ xử lý',
    resolved: 'Đã giải quyết'
  };
  return labels[status] || status;
};

// Helper function to get status color
export const getReportStatusColor = (status: ReportStatus): string => {
  const colors: Record<ReportStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    resolved: 'text-green-600 bg-green-50'
  };
  return colors[status] || 'text-gray-600 bg-gray-50';
};
