/**
 * Chatbot Service
 * Handles all chatbot-related API calls
 */

import axiosInstance from './api/axiosInstance';
import type {
  SendMessagePayload,
  SendMessageResponse,
  GetHistoryResponse,
  CreateConversationResponse,
  GetSuggestionsResponse,
} from './type/chatbotTypes';

class ChatbotService {
  /**
   * Send message to chatbot
   */
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      console.log('📝 ChatbotService: Sending message:', payload);
      
      const response = await axiosInstance.post<SendMessageResponse>('/api/chatbot/message', payload);
      
      console.log('✅ ChatbotService: Message sent successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ChatbotService: Error sending message:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Tin nhắn không hợp lệ');
      } else if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi gửi tin nhắn');
      }
      
      throw error;
    }
  }

  /**
   * Get chat history
   */
  async getHistory(sessionId: string): Promise<GetHistoryResponse> {
    try {
      console.log('📝 ChatbotService: Fetching chat history for session:', sessionId);
      
      const response = await axiosInstance.get<GetHistoryResponse>('/api/chatbot/history', {
        params: { session_id: sessionId },
      });
      
      console.log('✅ ChatbotService: History fetched successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ChatbotService: Error fetching history:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy hội thoại');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải lịch sử');
      }
      
      throw error;
    }
  }

  /**
   * Create new conversation
   */
  async createConversation(): Promise<CreateConversationResponse> {
    try {
      console.log('📝 ChatbotService: Creating new conversation');
      
      const response = await axiosInstance.post<CreateConversationResponse>('/api/chatbot/conversations');
      
      console.log('✅ ChatbotService: Conversation created successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ChatbotService: Error creating conversation:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tạo hội thoại');
      }
      
      throw error;
    }
  }

  /**
   * Get suggestions based on user role
   */
  async getSuggestions(context?: string): Promise<GetSuggestionsResponse> {
    try {
      console.log('📝 ChatbotService: Fetching suggestions for context:', context);
      
      const response = await axiosInstance.get<GetSuggestionsResponse>('/api/chatbot/suggestions', {
        params: context ? { context } : undefined,
      });
      
      console.log('✅ ChatbotService: Suggestions fetched successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ ChatbotService: Error fetching suggestions:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi server khi tải gợi ý');
      }
      
      throw error;
    }
  }
}

export default new ChatbotService();





