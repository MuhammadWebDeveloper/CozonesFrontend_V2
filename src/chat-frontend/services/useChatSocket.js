import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { ChatUrl } from '../utils/chatconstants';

export const useChatSocket = (chatId, onMessage) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // console.log('=== Socket Debug Info ===');
    // console.log('Chat ID:', chatId);
    // console.log('Current User ID:', currentUser?.id);
    // console.log('Token exists:', !!token);
    
    if (!token) {
      console.error('No token found for socket connection');
      return;
    }

    // Connect using Socket.IO
    const socket = io(ChatUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      // console.log('✅ Socket.IO connected');
      setIsConnected(true);
      
      // Join the chat room
      // console.log('📡 Attempting to join chat:', chatId);
      socket.emit('join_chat', { chatId });
    });

    socket.on('disconnect', () => {
      // console.log('❌ Socket.IO disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error.message);
      setIsConnected(false);
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      // console.log('💬 New message received:', message);
      if (onMessage) {
        onMessage(message);
      }
    });

    // Listen for typing indicators
    socket.on('typing_start', ({ chatId: typingChatId, userId }) => {
      // console.log('⌨️ Typing started:', { typingChatId, userId });
      if (typingChatId === chatId) {
        setTypingUsers((prev) => {
          if (!prev.includes('Someone')) {
            return [...prev, 'Someone'];
          }
          return prev;
        });
      }
    });

    socket.on('typing_stop', ({ chatId: typingChatId, userId }) => {
      // console.log('⌨️ Typing stopped:', { typingChatId, userId });
      if (typingChatId === chatId) {
        setTypingUsers([]);
      }
    });

    // Listen for join confirmation
    socket.on('joined_chat', ({ chatId: joinedChatId }) => {
      // console.log(`✅ Successfully joined chat: ${joinedChatId}`);
    });

    // Handle errors
    socket.on('error', ({ message }) => {
      console.error('⚠️ Socket error:', message);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        // console.log('👋 Leaving chat and disconnecting');
        socketRef.current.emit('leave_chat', { chatId });
        socketRef.current.disconnect();
      }
    };
  }, [chatId, onMessage]);

  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current && isConnected && chatId) {
      const event = isTyping ? 'typing_start' : 'typing_stop';
      socketRef.current.emit(event, { chatId });
    }
  }, [chatId, isConnected]);

  return {
    isConnected,
    typingUsers,
    sendTyping,
  };
};