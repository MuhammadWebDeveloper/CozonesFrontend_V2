import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, getMessages, sendMessage, markAsRead } from '../services/chat.service.js';
import { useChatSocket } from '../services/useChatSocket.js';
import '../styles/ChatDetail.css';

const MAX_CHARS = 500;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateDivider = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;
  return date1.toDateString() === date2.toDateString();
};

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

const ChatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.id;

  // ── WebSocket ──
  const handleIncomingMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      // Insert new message in correct chronological order
      const newMessages = [...prev, msg];
      return newMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
    markAsRead(id).catch(() => { });
  }, [id]);

  const { isConnected, typingUsers, sendTyping } = useChatSocket(id, handleIncomingMessage);

  // ── Initial load ──
  useEffect(() => {
    const load = async () => {
      try {
        const [chatData, msgData] = await Promise.all([
          getChatById(id),
          getMessages(id),
        ]);
        setChat(Array.isArray(chatData) ? chatData[0] : chatData.chat || chatData);

        // Ensure messages are sorted chronologically
        let msgs = Array.isArray(msgData) ? msgData : msgData.messages || [];
        msgs = msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(msgs);

        await markAsRead(id).catch(() => { });
      } catch (err) {
        console.error('Load error:', err);
        setError('Could not load this conversation.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ──
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || trimmed.length > MAX_CHARS) return;

    setSending(true);
    setText('');
    sendTyping(false);

    // Optimistic update
    const optimistic = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      message: trimmed,
      created_at: new Date().toISOString(),
      is_read: false,
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await sendMessage(id, trimmed);
      const savedMsg = saved.message || saved;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? savedMsg : m))
      );
    } catch {
      // Remove optimistic msg on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(trimmed);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    // Typing indicator
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 2000);
  };

  // ── Derived: other person ──
  const otherName = chat
    ? currentUserId === chat.user_id
      ? chat.owner_name || chat.other_participant_name || 'Owner'
      : chat.user_name || chat.other_participant_name || 'User'
    : '';

  const bookingRef = chat?.booking_ref || chat?.booking_id?.slice(0, 8).toUpperCase();

  if (loading) {
    return (
      <div className="chat-detail-page">
        <div className="chat-load-center">
          <div className="chat-spinner" />
          <span>Loading conversation…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-detail-page">
        <div className="chat-load-center">
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <span>{error}</span>
          <button
            onClick={() => navigate('/chats')}
            style={{
              marginTop: 8,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#011CCD',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Back to chats
          </button>
        </div>
      </div>
    );
  }

  // Build messages with date dividers - only show when date actually changes
  const messageElements = [];
  let lastDate = null;

  messages.forEach((msg, i) => {
    const currentDate = msg.created_at;
    const shouldShowDateDivider = !lastDate || !isSameDay(lastDate, currentDate);

    if (shouldShowDateDivider) {
      messageElements.push(
        <div className="chat-date-divider" key={`div-${msg.id}-${i}`}>
          <span>{formatDateDivider(currentDate)}</span>
        </div>
      );
    }

    const isSent = msg.sender_id === currentUserId;
    messageElements.push(
      <div className={`chat-message-row ${isSent ? 'sent' : 'received'}`} key={msg.id || `msg-${i}`}>
        <div className="chat-bubble">
          {msg.message}
          <div className="chat-bubble-meta">
            <span className="chat-bubble-time">{formatTime(msg.created_at)}</span>
            {isSent && (
              <span className="chat-read-icon">
                {msg.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );

    lastDate = currentDate;
  });

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="chat-detail-page">
      {/* Header */}
      <div className="chat-detail-header">
        <button className="chat-back-btn" onClick={() => navigate('/chats')}>
          ←
        </button>
        <div className="chat-header-avatar">{getInitials(otherName)}</div>
        <div className="chat-header-info">
          <div className="chat-header-name">{otherName}</div>
          <div className="chat-header-booking">Booking #{bookingRef}</div>
        </div>
        <div className={`chat-status-dot ${isConnected ? 'connected' : ''}`} title={isConnected ? 'Connected' : 'Connecting…'} />
      </div>

      {/* Booking info banner */}
      {chat && (
        <div className="chat-booking-banner">
          {chat.space_name && (
            <div className="booking-banner-item">
              <span className="booking-banner-label">Space</span>
              <span className="booking-banner-value">{chat.space_name}</span>
            </div>
          )}
          {chat.start_time && (
            <div className="booking-banner-item">
              <span className="booking-banner-label">Start Time</span>
              <span className="booking-banner-value">
                {new Date(chat.start_time).toLocaleDateString()}
              </span>
            </div>
          )}
          {chat.end_time && (
            <div className="booking-banner-item">
              <span className="booking-banner-label">End Time</span>
              <span className="booking-banner-value">
                {new Date(chat.end_time).toLocaleDateString()}
              </span>
            </div>
          )}
          {chat.booking_status && (
            <div className="booking-banner-item">
              <span className="booking-banner-label">Status</span>
              <span className="booking-banner-value" style={{ textTransform: 'capitalize' }}>
                {chat.booking_status}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages-area">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: '0.9rem' }}>
            No messages yet. Say hello! 👋
          </div>
        )}

        {messageElements}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="chat-message-row received">
            <div className="chat-typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
              <span className="typing-label">
                {typingUsers[0]} is typing…
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="chat-composer">
        <div className="chat-composer-inner">
          <textarea
            ref={textareaRef}
            className="chat-composer-textarea"
            placeholder="Type a message…"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_CHARS + 10}
          />
          {charCount > 400 && (
            <span className={`chat-char-count ${overLimit ? 'warn' : ''}`}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!text.trim() || sending || overLimit}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;