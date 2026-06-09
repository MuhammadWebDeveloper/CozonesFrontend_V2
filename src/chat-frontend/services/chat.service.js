// chat.service.js
import { ChatUrl } from "../utils/chatconstants";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  // console.log('Token being used:', token ? `${token.substring(0, 20)}...` : 'No token'); // Debug
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Create or get existing chat for a booking
export const createOrGetChat = async (bookingId) => {
  const res = await fetch(`${ChatUrl}/api/chats/creating`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ booking_id: bookingId }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create/get chat');
  
  // Handle both response formats
  return data.data || data;
};

// Get all chats for the logged-in user/owner
export const getMyChats = async () => {
  const res = await fetch(`${ChatUrl}/api/chats/chat`, {
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch chats');
  
  // Handle both response formats
  return data.data || data.chats || data;
};

// Get a single chat by ID
export const getChatById = async (chatId) => {
  const res = await fetch(`${ChatUrl}/api/chats/chat/${chatId}`, {
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch chat');
  
  // Handle both response formats
  return data.data || data.chat || data;
};

// Get messages for a chat (with pagination)
export const getMessages = async (chatId, page = 1, limit = 50) => {
  const res = await fetch(
    `${ChatUrl}/api/chats/${chatId}/getmessages?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch messages');
  
  // Handle both response formats
  return data.data || data.messages || data;
};

// Send a message
export const sendMessage = async (chatId, message, messageType = 'text') => {
  const res = await fetch(`${ChatUrl}/api/chats/${chatId}/sendmessages`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, messageType }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send message');
  
  // Handle both response formats
  return data.data || data.message || data;
};

// Mark messages as read
export const markAsRead = async (chatId) => {
  const res = await fetch(`${ChatUrl}/api/chats/${chatId}/asread`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to mark as read');
  
  return data;
};