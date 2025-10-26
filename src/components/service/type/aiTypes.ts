/**
 * AI Service Type Definitions
 */

export type DemandLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable' | 'increasing' | 'decreasing';
export type ForecastPeriod = '7d' | '30d' | '90d' | '1y';
export type AnalysisPeriod = '30d' | '90d' | '1y';
export type Priority = 'low' | 'medium' | 'high';
export type Timing = 'immediate' | 'short_term' | 'long_term';

// Health Check
export interface AIHealthResponse {
  success: boolean;
  message: string;
  data: {
    status: string;
    testResponse: string;
    timestamp: string;
    geminiModel: string;
  };
}

// Demand Forecast
export interface HourlyTrend {
  hour: number;
  demand: DemandLevel;
  forecast: number;
}

export interface WeeklyTrend {
  day: string;
  demand: DemandLevel;
  forecast: number;
}

export interface TotalForecast {
  period: string;
  predictedBookings: number;
  confidence: number;
}

export interface DemandForecastData {
  hourlyTrend: HourlyTrend[];
  weeklyTrend: WeeklyTrend[];
  totalForecast: TotalForecast;
  factors: string[];
  recommendations: string[];
}

export interface DemandForecastResponse {
  success: boolean;
  message: string;
  data: DemandForecastData;
}

// Station Forecast
export interface StationForecastData {
  stationInfo: {
    name: string;
    currentVehicles: number;
  };
  forecast: {
    period: string;
    predictedBookings: number;
    confidence: number;
  };
  capacityAnalysis: {
    currentUtilization: number;
    peakDemand: number;
    shortage: number;
  };
  recommendations: {
    vehiclesNeeded: number;
    optimalCapacity: number;
    timing: Timing;
  };
  peakHours: Array<{
    hour: number;
    demand: number;
  }>;
  strategies: string[];
}

export interface StationForecastResponse {
  success: boolean;
  message: string;
  data: StationForecastData;
}

// Vehicle Recommendations
export interface VehicleRecommendation {
  stationId: string;
  stationName: string;
  currentVehicles: number;
  predictedDemand: number;
  vehiclesNeeded: number;
  optimalCapacity: number;
  priority: Priority;
  estimatedROI: number;
  timing: Timing;
}

export interface VehicleRecommendationsData {
  totalStations: number;
  totalVehiclesNeeded: number;
  estimatedInvestment: number;
  recommendations: VehicleRecommendation[];
  generatedAt: string;
}

export interface VehicleRecommendationsResponse {
  success: boolean;
  message: string;
  data: VehicleRecommendationsData;
}

// Trend Analysis
export interface TrendData {
  overall: TrendDirection;
  growthRate: number;
  seasonality: string[];
  cyclical: string;
}

export interface TrendFactors {
  weather: string;
  events: string;
  economic: string;
}

export interface ForecastData {
  period: string;
  trend: TrendDirection;
  confidence: number;
}

export interface TrendAnalysisData {
  trends: TrendData;
  factors: TrendFactors;
  forecasts: {
    shortTerm: ForecastData;
    longTerm: ForecastData;
  };
  opportunities: string[];
  challenges: string[];
  recommendations: string[];
}

export interface TrendAnalysisResponse {
  success: boolean;
  message: string;
  data: TrendAnalysisData;
}

// AI Dashboard (Combined)
export interface AIDashboardData {
  overview: {
    totalStations: number;
    totalVehicles: number;
    vehiclesNeeded: number;
    estimatedInvestment: number;
    predictedBookings: number;
    confidence: number;
  };
  demandForecast: DemandForecastData;
  trendAnalysis: TrendAnalysisData;
  vehicleRecommendations: {
    totalNeeded: number;
    topPriorities: VehicleRecommendation[];
    estimatedROI: number;
  };
  insights: string[];
  generatedAt: string;
  period: string;
}

export interface AIDashboardResponse {
  success: boolean;
  message: string;
  data: AIDashboardData;
}





