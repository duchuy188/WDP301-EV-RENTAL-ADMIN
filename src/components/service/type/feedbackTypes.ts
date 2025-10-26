/**
 * Feedback Type Definitions
 */

export type FeedbackType = 'rating' | 'complaint';
export type FeedbackStatus = 'pending' | 'resolved';
export type FeedbackCategory = 'vehicle' | 'staff' | 'payment' | 'service' | 'other';

export interface Feedback {
  _id: string;
  rental_id?: string | { _id: string; [key: string]: any };
  user_id: string | { _id: string; [key: string]: any };
  staff_id?: string | { _id: string; [key: string]: any };
  staff_ids?: (string | { _id: string; [key: string]: any })[];
  type: FeedbackType;
  
  // Rating fields
  overall_rating?: number;
  staff_service?: number;
  vehicle_condition?: number;
  station_cleanliness?: number;
  checkout_process?: number;
  comment?: string;
  
  // Complaint fields
  title?: string;
  description?: string;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  response?: string;
  resolved_by?: string | { _id: string; [key: string]: any };
  
  // Common fields
  images?: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FeedbackStats {
  total: number;
  ratings: number;
  complaints: number;
  pending: number;
  resolved: number;
}

export interface GetFeedbacksResponse {
  success: boolean;
  data: {
    feedbacks: Feedback[];
    pagination: FeedbackPagination;
    stats: FeedbackStats;
  };
}

export interface GetFeedbacksParams {
  type?: FeedbackType;
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  station_id?: string;
  page?: number;
  limit?: number;
}

export interface UpdateFeedbackStatusPayload {
  status: FeedbackStatus;
  response?: string;
}

export interface UpdateFeedbackStatusResponse {
  success: boolean;
  data: Feedback;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  response?: string;
  comment?: string;
}

export interface UpdateFeedbackResponse {
  success: boolean;
  message: string;
  data: Feedback;
}

export interface GetFeedbackByIdResponse {
  success: boolean;
  message: string;
  data: Feedback;
}


