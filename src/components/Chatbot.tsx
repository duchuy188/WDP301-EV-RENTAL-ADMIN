import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  User,
  Bot
} from 'lucide-react';
import { Button } from './ui/button';
import ChatbotService from './service/chatbotService';
import { ChatMessage } from './service/type/chatbotTypes';
import { showToast } from '../lib/toast';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create new conversation when opening chatbot
  const handleOpen = async () => {
    setIsOpen(true);
    
    if (!sessionId) {
      try {
        const response = await ChatbotService.createConversation();
        setSessionId(response.data.session_id);
        console.log('✅ New conversation created:', response.data.session_id);
        
        // Load suggestions
        loadSuggestions();
      } catch (error: any) {
        showToast.error(error.message || 'Không thể tạo hội thoại');
      }
    }
  };

  // Load chat history
  const loadHistory = async (sid: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await ChatbotService.getHistory(sid);
      setMessages(response.data.messages);
      console.log('✅ History loaded:', response.data.messages.length, 'messages');
    } catch (error: any) {
      console.error('Error loading history:', error.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load suggestions
  const loadSuggestions = async (context?: string) => {
    try {
      const response = await ChatbotService.getSuggestions(context);
      setSuggestions(response.data.suggestions);
      console.log('✅ Suggestions loaded:', response.data.suggestions);
    } catch (error: any) {
      console.error('Error loading suggestions:', error.message);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      message: inputMessage,
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await ChatbotService.sendMessage({
        message: messageText,
        session_id: sessionId || undefined,
      });

      // Update session ID if new
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id);
      }

      // Add bot response
      const botMessage: ChatMessage = {
        role: 'assistant',
        message: response.message,
        timestamp: new Date().toISOString(),
        metadata: {
          suggestions: response.suggestions,
          actions: response.actions,
          context: response.context,
        },
      };

      setMessages(prev => [...prev, botMessage]);

      // Update suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }

    } catch (error: any) {
      showToast.error(error.message || 'Không thể gửi tin nhắn');
      
      // Remove user message if failed
      setMessages(prev => prev.slice(0, -1));
      setInputMessage(messageText); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // New conversation
  const handleNewConversation = async () => {
    try {
      const response = await ChatbotService.createConversation();
      setSessionId(response.data.session_id);
      setMessages([]);
      setSuggestions([]);
      loadSuggestions();
      showToast.success('Đã tạo hội thoại mới');
    } catch (error: any) {
      showToast.error(error.message || 'Không thể tạo hội thoại mới');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            drag
            dragMomentum={false}
            dragElastic={0.1}
            dragConstraints={{
              left: -window.innerWidth + 80,
              right: 0,
              top: -window.innerHeight + 80,
              bottom: 0
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              if (!isDragging) {
                handleOpen();
              }
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
              setTimeout(() => setIsDragging(false), 100);
            }}
            className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all cursor-grab active:cursor-grabbing"
            title="Mở chatbot (Kéo để di chuyển)"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{
              left: -window.innerWidth + 400,
              right: 0,
              top: -window.innerHeight + 650,
              bottom: 0
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            style={{ x: position.x, y: position.y }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden cursor-move"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">EV Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <p className="text-white/80 text-xs">Đang hoạt động</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleNewConversation}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Hội thoại mới"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Đóng"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Xin chào! 👋
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Tôi có thể giúp gì cho bạn?
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                      {msg.metadata?.context && (
                        <p className="text-xs mt-2 opacity-75">{msg.metadata.context}</p>
                      )}
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Gợi ý:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  disabled={isSending}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:opacity-50"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isSending}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-xl"
                  size="sm"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Nhấn Enter để gửi • Shift + Enter để xuống dòng
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}





