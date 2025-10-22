import { axiosInstance } from './api/axiosInstance';
import {
  RevenueOverviewResponse,
  RevenueOverviewParams,
  RevenueOverviewData,
  RevenueTrendsResponse,
  RevenueTrendsParams,
  RevenueTrendUI,
  normalizeRevenueTrendForUI,
  RevenueByStationResponse,
  RevenueByStationParams,
  StationRevenueUI,
  normalizeStationRevenueForUI,
  StationRevenueDetailResponse,
  StationRevenueDetailParams,
  StationRevenueDetailData,
  StaffPerformanceResponse,
  StaffPerformanceParams,
  StaffPerformanceData,
  StaffPerformanceDetailResponse,
  StaffPerformanceDetailParams,
  StaffPerformanceDetailData
} from './type/analyticsTypes';

/**
 * Analytics Service - Quản lý các API liên quan đến phân tích và báo cáo
 */
class AnalyticsService {
  private baseUrl = '/api/analytics';

  /**
   * Lấy tổng quan doanh thu hệ thống
   * GET /api/analytics/revenue/overview
   */
  async getRevenueOverview(params?: RevenueOverviewParams): Promise<RevenueOverviewData> {
    try {
      console.log('Fetching revenue overview with params:', params);
      
      const response = await axiosInstance.get<RevenueOverviewResponse>(
        `${this.baseUrl}/revenue/overview`,
        {
          params: {
            period: params?.period || 'today',
            payment_method: params?.payment_method || 'all'
          }
        }
      );

      console.log('Raw Revenue Overview API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        return {
          totalRevenue: 0,
          transactionCount: 0,
          growthRate: 0,
          topStation: null,
          period: params?.period || 'today',
          dateRange: {
            start: '',
            end: ''
          }
        };
      }

      console.log('Revenue overview loaded:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching revenue overview:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Lấy xu hướng doanh thu theo thời gian
   * GET /api/analytics/revenue/trends
   */
  async getRevenueTrends(params?: RevenueTrendsParams): Promise<{
    trends: RevenueTrendUI[];
    period: string;
    groupFormat: string;
  }> {
    try {
      console.log('Fetching revenue trends with params:', params);
      
      const response = await axiosInstance.get<RevenueTrendsResponse>(
        `${this.baseUrl}/revenue/trends`,
        {
          params: {
            period: params?.period || 'month',
            stations: params?.stations || 'all',
            payment_method: params?.payment_method || 'all'
          }
        }
      );

      console.log('Raw Revenue Trends API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        return {
          trends: [],
          period: params?.period || 'month',
          groupFormat: ''
        };
      }

      const { trends, period, groupFormat } = response.data.data;
      
      // Normalize trends for UI
      const normalizedTrends = trends.map((trend, index) => {
        try {
          return normalizeRevenueTrendForUI(trend);
        } catch (error) {
          console.error(`Error normalizing trend at index ${index}:`, error, trend);
          return {
            date: trend._id?.date || '',
            revenue: trend.revenue || 0,
            transactionCount: trend.transactionCount || 0
          } as RevenueTrendUI;
        }
      });

      console.log('Normalized revenue trends:', normalizedTrends);

      return {
        trends: normalizedTrends,
        period,
        groupFormat
      };
    } catch (error: any) {
      console.error('Error fetching revenue trends:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }


  /**
   * Lấy doanh thu chi tiết theo từng trạm
   * GET /api/analytics/revenue/by-station
   */
  async getRevenueByStation(params?: RevenueByStationParams): Promise<{
    stations: StationRevenueUI[];
    totalRevenue: number;
    period: string;
    dateRange: { start: string; end: string };
  }> {
    try {
      console.log('Fetching revenue by station with params:', params);
      
      const response = await axiosInstance.get<RevenueByStationResponse>(
        `${this.baseUrl}/revenue/by-station`,
        {
          params: {
            period: params?.period || 'month',
            date: params?.date,
            payment_method: params?.payment_method || 'all'
          }
        }
      );

      console.log('Raw Revenue by Station API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        return {
          stations: [],
          totalRevenue: 0,
          period: params?.period || 'month',
          dateRange: { start: '', end: '' }
        };
      }

      const { stations, totalRevenue, period, dateRange } = response.data.data;
      
      // Normalize stations for UI
      const normalizedStations = stations.map((station, index) => {
        try {
          return normalizeStationRevenueForUI(station);
        } catch (error) {
          console.error(`Error normalizing station at index ${index}:`, error, station);
          return {
            id: station._id || `fallback-${index}`,
            name: station.stationName || 'Unknown',
            code: station.stationCode || 'N/A',
            address: station.stationAddress || '',
            revenue: station.revenue || 0,
            transactionCount: station.transactionCount || 0,
            averageTransaction: station.averageTransaction || 0,
            percentage: station.percentage || 0,
            growthRate: station.growthRate || 0
          } as StationRevenueUI;
        }
      });

      console.log('Normalized station revenues:', normalizedStations);

      return {
        stations: normalizedStations,
        totalRevenue,
        period,
        dateRange
      };
    } catch (error: any) {
      console.error('Error fetching revenue by station:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Lấy chi tiết doanh thu của một trạm cụ thể
   * GET /api/analytics/revenue/station-detail/{stationId}
   */
  async getStationRevenueDetail(params: StationRevenueDetailParams): Promise<StationRevenueDetailData> {
    try {
      console.log('Fetching station revenue detail with params:', params);
      
      const { stationId, ...queryParams } = params;
      
      const response = await axiosInstance.get<StationRevenueDetailResponse>(
        `${this.baseUrl}/revenue/station-detail/${stationId}`,
        {
          params: {
            period: queryParams.period || 'month',
            date: queryParams.date,
            payment_method: queryParams.payment_method || 'all'
          }
        }
      );

      console.log('Raw Station Revenue Detail API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        return {
          station: {
            id: stationId,
            name: 'Unknown',
            code: 'N/A',
            address: ''
          },
          revenueByVehicleType: [],
          revenueByHour: [],
          topCustomers: [],
          vehicleUtilization: []
        };
      }

      console.log('Station revenue detail loaded:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching station revenue detail:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Get vehicle utilization stats (placeholder for future API)
   */
  async getVehicleUtilization(params?: { 
    period?: string; 
    stations?: string 
  }): Promise<any> {
    try {
      // This is a placeholder - implement when API is available
      console.log('Get vehicle utilization:', params);
      return {
        totalVehicles: 0,
        rentedVehicles: 0,
        utilizationRate: 0
      };
    } catch (error) {
      console.error('Error fetching vehicle utilization:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách hiệu suất tất cả nhân viên Station Staff
   * GET /api/analytics/staff-performance
   */
  async getStaffPerformance(params?: StaffPerformanceParams): Promise<StaffPerformanceData> {
    try {
      console.log('Fetching staff performance with params:', params);
      
      const response = await axiosInstance.get<StaffPerformanceResponse>(
        `${this.baseUrl}/staff-performance`,
        {
          params: {
            period: params?.period || '30d',
            station_id: params?.station_id
          }
        }
      );

      console.log('Raw Staff Performance API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        return {
          period: params?.period || '30d',
          staff_performance: [],
          summary: {
            total_staff: 0,
            avg_performance_score: 0,
            top_performer: {},
            date_range: { start: '', end: '' }
          }
        };
      }

      console.log('Staff performance loaded:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching staff performance:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Lấy chi tiết hiệu suất của một nhân viên cụ thể
   * GET /api/analytics/staff-performance/{staffId}
   */
  async getStaffPerformanceDetail(params: StaffPerformanceDetailParams): Promise<StaffPerformanceDetailData> {
    try {
      console.log('Fetching staff performance detail with params:', params);
      
      const { staffId, ...queryParams } = params;
      
      const response = await axiosInstance.get<StaffPerformanceDetailResponse>(
        `${this.baseUrl}/staff-performance/${staffId}`,
        {
          params: {
            period: queryParams.period || '30d'
          }
        }
      );

      console.log('Raw Staff Performance Detail API Response:', response.data);
      
      if (!response.data.success || !response.data.data) {
        console.warn('Invalid response structure:', response.data);
        throw new Error('Invalid response structure');
      }

      console.log('Staff performance detail loaded:', response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching staff performance detail:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Get customer analytics (placeholder for future API)
   */
  async getCustomerAnalytics(params?: { 
    period?: string 
  }): Promise<any> {
    try {
      // This is a placeholder - implement when API is available
      console.log('Get customer analytics:', params);
      return {
        newCustomers: 0,
        returningCustomers: 0,
        totalCustomers: 0
      };
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;

