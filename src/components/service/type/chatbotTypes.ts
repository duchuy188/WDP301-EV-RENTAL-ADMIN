/**
 * Chatbot Type Definitions
 */

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  message: string;
  timestamp: string;
  metadata?: {
    suggestions?: string[];
    actions?: string[];
    context?: string;
  };
}

export interface SendMessagePayload {
  message: string;
  session_id?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  suggestions?: string[];
  actions?: string[];
  context?: string;
  session_id: string;
  conversation_id: string;
}

export interface ChatHistory {
  session_id: string;
  user_role: string;
  total_messages: number;
  last_activity: string;
  messages: ChatMessage[];
}

export interface GetHistoryResponse {
  success: boolean;
  data: ChatHistory;
}

export interface CreateConversationResponse {
  success: boolean;
  message: string;
  data: {
    session_id: string;
    user_role: string;
    created_at: string;
  };
}

export interface GetSuggestionsResponse {
  success: boolean;
  data: {
    suggestions: string[];
    user_role: string;
  };
}





