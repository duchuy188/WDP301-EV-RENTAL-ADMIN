/**
 * Feedback Service
 * Handles all feedback-related API calls
 */

import axiosInstance from './api/axiosInstance';
import type {
  GetFeedbacksResponse,
  GetFeedbacksParams,
  GetFeedbackByIdResponse,
  UpdateFeedbackStatusPayload,
  UpdateFeedbackStatusResponse,
  UpdateFeedbackPayload,
  UpdateFeedbackResponse,
} from './type/feedbackTypes';

class FeedbackService {
  /**
   * Get all feedbacks with optional filters
   */
  async getFeedbacks(params?: GetFeedbacksParams): Promise<GetFeedbacksResponse> {
    try {
      console.log('📝 FeedbackService: Fetching feedbacks with params:', params);
      
      const response = await axiosInstance.get<GetFeedbacksResponse>('/api/feedback', {
        params,
      });
      
      console.log('✅ FeedbackService: Feedbacks fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ FeedbackService: Error fetching feedbacks:', error);
      throw error;
    }
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string): Promise<GetFeedbackByIdResponse> {
    try {
      console.log('📝 FeedbackService: Fetching feedback by ID:', id);
      
      const response = await axiosInstance.get<GetFeedbackByIdResponse>(`/api/feedback/${id}`);
      
      console.log('✅ FeedbackService: Feedback fetched successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ FeedbackService: Error fetching feedback:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        throw new Error('Không có quyền truy cập feedback này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy feedback');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải feedback');
      }
      
      throw error;
    }
  }

  /**
   * Update feedback (Admin)
   * Updates feedback status, response, and comment
   */
  async updateFeedback(
    id: string,
    payload: UpdateFeedbackPayload
  ): Promise<UpdateFeedbackResponse> {
    try {
      console.log('📝 FeedbackService: Updating feedback:', { id, payload });
      
      const response = await axiosInstance.put<UpdateFeedbackResponse>(
        `/api/feedback/${id}`,
        payload
      );
      
      console.log('✅ FeedbackService: Feedback updated successfully:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ FeedbackService: Error updating feedback:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        throw new Error('Không có quyền cập nhật feedback này');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy feedback');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi cập nhật feedback');
      }
      
      throw error;
    }
  }

  /**
   * Update feedback status (resolve complaint)
   * @deprecated Use updateFeedback instead
   */
  async updateFeedbackStatus(
    id: string,
    payload: UpdateFeedbackStatusPayload
  ): Promise<UpdateFeedbackStatusResponse> {
    try {
      console.log('📝 FeedbackService: Updating feedback status:', { id, payload });
      
      const response = await axiosInstance.patch<UpdateFeedbackStatusResponse>(
        `/api/feedback/${id}/status`,
        payload
      );
      
      console.log('✅ FeedbackService: Feedback status updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ FeedbackService: Error updating feedback status:', error);
      throw error;
    }
  }

  /**
   * Delete feedback (Admin - Soft delete)
   */
  async deleteFeedback(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📝 FeedbackService: Deleting feedback:', id);
      
      const response = await axiosInstance.delete(`/api/feedback/${id}`);
      
      console.log('✅ FeedbackService: Feedback deleted successfully:', response.data);
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid response structure from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ FeedbackService: Error deleting feedback:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Không tìm thấy feedback');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi xóa feedback');
      }
      
      throw error;
    }
  }
}

export default new FeedbackService();

