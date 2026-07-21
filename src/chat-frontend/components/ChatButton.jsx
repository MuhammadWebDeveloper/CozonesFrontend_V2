import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrGetChat } from '../services/chat.service.js';
import '../styles/ChatButton.css';
import { MessageCircle, Loader2 } from 'lucide-react';

/**
 * Drop this button anywhere you show a booking.
 *
 * Usage:
 *   <ChatButton bookingId={booking.id} />
 *
 * Optional props:
 *   label      – button text  (default: "Message")
 *   variant    – "primary" | "outline"  (default: "primary")
 *   className  – extra class names
 */
const ChatButton = ({ bookingId, label = 'Message', variant = 'primary', className = '' }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOpen = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const data = await createOrGetChat(bookingId);
      const chatId = data?.id || data?.chat?.id;
      if (chatId) navigate(`/chats/${chatId}`);
    } catch (err) {
      console.error('Failed to open chat:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`chat-open-btn chat-open-btn--${variant} ${className}`}
      onClick={handleOpen}
      disabled={loading}
    >
      {loading ? (
        <Loader2 size={18} className="chat-btn-spinner" style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        <>
          <MessageCircle size={18} style={{ marginRight: '6px' }} />
          {label}
        </>
      )}
    </button>
  );
};

export default ChatButton;