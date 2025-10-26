/**
 * AI Service
 * Handles all AI-related API calls for demand forecasting and analytics
 */

import axiosInstance from './api/axiosInstance';
import type {
  AIHealthResponse,
  DemandForecastResponse,
  StationForecastResponse,
  VehicleRecommendationsResponse,
  TrendAnalysisResponse,
  AIDashboardResponse,
  ForecastPeriod,
  AnalysisPeriod,
} from './type/aiTypes';

class AIService {
  /**
   * Check AI Service health
   */
  async checkHealth(): Promise<AIHealthResponse> {
    try {
      console.log('📝 AIService: Checking AI service health');
      
      const response = await axiosInstance.get<AIHealthResponse>('/api/ai/health');
      
      console.log('✅ AIService: Health check successful:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Health check failed:', error);
      
      if (error.response?.status === 500) {
        throw new Error('AI Service không hoạt động');
      }
      
      throw error;
    }
  }

  /**
   * Get demand forecast
   */
  async getDemandForecast(period: ForecastPeriod = '7d', stationId?: string): Promise<DemandForecastResponse> {
    try {
      console.log('📝 AIService: Getting demand forecast:', { period, stationId });
      
      const params: Record<string, any> = { period };
      if (stationId) params.station_id = stationId;
      
      const response = await axiosInstance.get<DemandForecastResponse>('/api/ai/demand-forecast', {
        params,
      });
      
      console.log('✅ AIService: Demand forecast received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Error getting demand forecast:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Tham số không hợp lệ');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi dự báo nhu cầu');
      }
      
      throw error;
    }
  }

  /**
   * Get station-specific demand forecast
   */
  async getStationForecast(stationId: string, period: ForecastPeriod = '7d'): Promise<StationForecastResponse> {
    try {
      console.log('📝 AIService: Getting station forecast:', { stationId, period });
      
      const response = await axiosInstance.get<StationForecastResponse>(
        `/api/ai/demand-forecast/station/${stationId}`,
        { params: { period } }
      );
      
      console.log('✅ AIService: Station forecast received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Error getting station forecast:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Trạm không tồn tại');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi dự báo nhu cầu trạm');
      }
      
      throw error;
    }
  }

  /**
   * Get vehicle recommendations
   */
  async getVehicleRecommendations(): Promise<VehicleRecommendationsResponse> {
    try {
      console.log('📝 AIService: Getting vehicle recommendations');
      
      const response = await axiosInstance.get<VehicleRecommendationsResponse>('/api/ai/vehicle-recommendations');
      
      console.log('✅ AIService: Vehicle recommendations received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Error getting vehicle recommendations:', error);
      
      if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tạo gợi ý xe');
      }
      
      throw error;
    }
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(period: AnalysisPeriod = '90d'): Promise<TrendAnalysisResponse> {
    try {
      console.log('📝 AIService: Getting trend analysis:', period);
      
      const response = await axiosInstance.get<TrendAnalysisResponse>('/api/ai/trend-analysis', {
        params: { period },
      });
      
      console.log('✅ AIService: Trend analysis received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Error getting trend analysis:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Tham số không hợp lệ');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi phân tích xu hướng');
      }
      
      throw error;
    }
  }

  /**
   * Get AI Dashboard (Combined data)
   */
  async getAIDashboard(period: AnalysisPeriod = '30d'): Promise<AIDashboardResponse> {
    try {
      console.log('📝 AIService: Getting AI dashboard:', period);
      
      const response = await axiosInstance.get<AIDashboardResponse>('/api/ai/dashboard', {
        params: { period },
      });
      
      console.log('✅ AIService: AI dashboard received:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ AIService: Error getting AI dashboard:', error);
      
      if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tạo dashboard AI');
      }
      
      throw error;
    }
  }
}

export default new AIService();





