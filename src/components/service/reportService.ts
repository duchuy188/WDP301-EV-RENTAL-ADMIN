/**
 * Report Service
 * Handles all report-related API calls
 */

import axiosInstance from './api/axiosInstance';
import type {
  GetReportsResponse,
  GetReportsParams,
  GetReportByIdResponse,
  ResolveReportPayload,
  ResolveReportResponse,
  GetReportStatsResponse,
  GetReportStatsParams,
} from './type/reportTypes';

class ReportService {
  /**
   * Get all reports with optional filters
   */
  async getReports(params?: GetReportsParams): Promise<GetReportsResponse> {
    try {
      // Clean up params - remove undefined values
      const cleanParams: Record<string, any> = {};
      if (params) {
        if (params.page) cleanParams.page = params.page;
        if (params.limit) cleanParams.limit = params.limit;
        if (params.status) cleanParams.status = params.status;
        if (params.issue_type) cleanParams.issue_type = params.issue_type;
        if (params.station_id) cleanParams.station_id = params.station_id;
        if (params.search) cleanParams.search = params.search;
      }
      
      const response = await axiosInstance.get<GetReportsResponse>('/api/reports', {
        params: cleanParams,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(id: string): Promise<GetReportByIdResponse> {
    try {
      console.log('📝 ReportService: Fetching report by ID:', id);
      
      const response = await axiosInstance.get<GetReportByIdResponse>(`/api/reports/${id}`);
      
      console.log('✅ ReportService: Report fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ReportService: Error fetching report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập báo cáo này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy báo cáo');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải báo cáo');
      }
      
      throw error;
    }
  }

  /**
   * Resolve a report
   */
  async resolveReport(
    id: string,
    payload: ResolveReportPayload
  ): Promise<ResolveReportResponse> {
    try {
      console.log('📝 ReportService: Resolving report:', { id, payload });
      
      const response = await axiosInstance.put<ResolveReportResponse>(
        `/api/reports/${id}/resolve`,
        payload
      );
      
      console.log('✅ ReportService: Report resolved successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ReportService: Error resolving report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ');
      } else if (error.response?.status === 403) {
        throw new Error('Không có quyền giải quyết báo cáo này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy báo cáo');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi giải quyết báo cáo');
      }
      
      throw error;
    }
  }

  /**
   * Get reports by station (for staff)
   */
  async getReportsByStation(stationId: string, params?: GetReportsParams): Promise<GetReportsResponse> {
    try {
      return await this.getReports({
        ...params,
        station_id: stationId,
      });
    } catch (error: any) {
      console.error('❌ Error fetching reports by station:', error);
      throw error;
    }
  }

  /**
   * Get report statistics
   * @param params - Optional station_id filter (for staff)
   */
  async getStats(params?: GetReportStatsParams): Promise<GetReportStatsResponse> {
    try {
      const cleanParams: Record<string, any> = {};
      if (params?.station_id) {
        cleanParams.station_id = params.station_id;
      }
      
      const response = await axiosInstance.get<GetReportStatsResponse>('/reports/stats', {
        params: cleanParams,
      });
      
      console.log('✅ Report stats fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      // Silently fail - will use fallback calculation in Reports page
      throw error;
    }
  }
}

export default new ReportService();
