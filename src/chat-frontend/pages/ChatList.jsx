import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyChats } from '../services/chat.service.js';
import '../styles/ChatList.css';
import { 
    AlertTriangle, 
    MessageCircle, 
    User, 
    Clock, 
    Loader2,
    ChevronRight,
    Mail,
    Calendar,
    MessageSquare
} from 'lucide-react';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

const SkeletonCard = () => (
  <div className="chat-skeleton">
    <div className="skeleton-circle" />
    <div className="skeleton-lines">
      <div className="skeleton-line short" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line short" />
    </div>
  </div>
);

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getMyChats();
        const chatsArray = Array.isArray(data) ? data : data.chats || data.data || [];
        setChats(chatsArray);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Could not load conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const getOtherName = (chat) => {
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (chat.user_id === currentUserId) {
      return chat.owner_name || chat.other_participant_name || 'Owner';
    }
    return chat.user_name || chat.other_participant_name || 'User';
  };

  return (
    <div className="chat-list-page">
      <div className="chat-list-container">
        <h1>
          <MessageCircle size={24} style={{ marginRight: '10px', display: 'inline' }} />
          Messages
        </h1>
        <p className="chat-list-subtitle">Your booking conversations</p>

        {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

        {error && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <AlertTriangle size={40} />
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && chats.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessageSquare size={40} />
            </div>
            <h3>No conversations yet</h3>
            <p>When you make a booking, a chat will appear here.</p>
          </div>
        )}

        {!loading &&
          chats.map((chat) => {
            const otherName = getOtherName(chat);
            const hasUnread = (chat.unread_count || 0) > 0;

            return (
              <div
                key={chat.id}
                className="chat-card"
                onClick={() => navigate(`/chats/${chat.id}`)}
              >
                <div className="chat-avatar">
                  {getInitials(otherName)}
                </div>

                <div className="chat-info">
                  <div className="chat-info-top">
                    <span className="chat-booking-ref">
                      <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} />
                      #{chat.booking_ref || chat.booking_id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="chat-time">
                      <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                      {formatTime(chat.last_message_at || chat.updated_at)}
                    </span>
                  </div>

                  <div className="chat-other-name">
                    <User size={14} style={{ marginRight: '6px', display: 'inline' }} />
                    {otherName}
                  </div>

                  <div className={`chat-last-msg ${hasUnread ? 'unread' : ''}`}>
                    {chat.last_message || 'No messages yet'}
                  </div>
                </div>

                {hasUnread && (
                  <div className="chat-unread-badge">{chat.unread_count}</div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ChatList;