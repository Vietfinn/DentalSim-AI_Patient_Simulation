import { useState, useCallback } from 'react';
import api from '../lib/api';
import { getToken } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useChat = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/sessions/${sessionId}/history`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setError('Không thể tải lịch sử tin nhắn. Vui lòng tải lại trang.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const sendMessage = async (content) => {
    if (!content.trim() || !sessionId || isTyping) return;
    
    setError(null);
    setIsTyping(true);

    // Append the user message to local state immediately
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: content,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Yêu cầu gửi tin nhắn thất bại.');
      }

      // Prepare placeholder for streaming AI message
      const tempAiId = `temp-ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempAiId,
          role: 'assistant',
          content: '',
          created_at: new Date().toISOString()
        }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Save the last incomplete line back to the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.substring(6).trim();
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.chunk) {
                // Update the AI assistant message text chunk
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === tempAiId
                      ? { ...msg, content: msg.content + data.chunk }
                      : msg
                  )
                );
              } else if (data.status === 'done') {
                setIsTyping(false);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn('Failed to parse SSE payload:', trimmedLine, e);
            }
          }
        }
      }
      
      // Once stream is complete, sync history from server to replace temp IDs with proper database UUIDs
      await fetchHistory();
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Lỗi gửi tin nhắn. Bệnh nhân không phản hồi.');
      setIsTyping(false);
      
      // Remove the incomplete AI bubble if it errored out immediately
      setMessages((prev) => prev.filter((msg) => !msg.id.toString().startsWith('temp-ai')));
    }
  };

  return {
    messages,
    loading,
    isTyping,
    error,
    fetchHistory,
    sendMessage
  };
};
