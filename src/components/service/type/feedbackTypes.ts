/**
 * Feedback Type Definitions
 */

export type FeedbackType = 'rating' | 'complaint';
export type FeedbackStatus = 'pending' | 'resolved';
export type FeedbackCategory = 'vehicle' | 'staff' | 'payment' | 'service' | 'other';

export interface Feedback {
  _id: string;
  rental_id?: string;
  user_id: string;
  staff_id?: string;
  staff_ids?: string[];
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
  resolved_by?: string;
  
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

export interface GetFeedbackByIdResponse {
  success: boolean;
  message: string;
  data: Feedback;
}


