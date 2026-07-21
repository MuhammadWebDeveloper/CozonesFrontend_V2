import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../componentstyles/sellerdashboardstyles/SellerSpaces.css';
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';
import { 
    Plus, 
    RefreshCw, 
    AlertTriangle, 
    Building2, 
    MapPin, 
    Home, 
    Star, 
    Edit3, 
    Trash2, 
    Loader2,
    Calendar,
    Sparkles,
    Crown
} from 'lucide-react';

export default function SellerSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getAuthToken = () => localStorage.getItem('token');

  const fetchSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await axios.get(`${BaseUrl}api/spaces/owner/my-spaces`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data.success) {
        setSpaces(res.data.spaces || []);
      } else {
        setError(res.data.message || 'Failed to load spaces');
        setSpaces([]);
      }
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
      setError(err.response?.data?.message || 'Failed to load spaces. Please try again.');
      setSpaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleGetStarted = () => navigate('/create-space');
  const handleRefresh = () => fetchSpaces();

  // Function for card click - view detailed space
  const handleViewSpace = (spaceId) => {
    navigate(`/space/${spaceId}`);
  };

  // Function for edit button click - update space
  const handleEditSpace = (spaceId, event) => {
    event.stopPropagation(); // Prevent triggering the card click
    navigate(`/space/update/${spaceId}`); // Different route for editing
  };

  const handleDeleteSpace = async (spaceId, event) => {
    event.stopPropagation(); // Prevent card click when clicking delete button
    if (window.confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      try {
        const token = getAuthToken();
        await axios.delete(`${BaseUrl}api/owner/spaces/${spaceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchSpaces();
      } catch (err) {
        console.error('Failed to delete space:', err);
        setError(err.response?.data?.message || 'Failed to delete space. Please try again.');
      }
    }
  };

  const getSpaceIcon = (name) => {
    const icons = [Building2, Home, Crown, Sparkles];
    const index = name?.length % icons.length || 0;
    return icons[index];
  };

  return (
    <main className="ss__main">
      {/* Premium Banner */}
      <div className="ss__banner">
        <div className="ss__banner-content">
          <div className="ss__banner-left">
            <div className="ss__banner-icon">
              <Sparkles size={24} />
            </div>
            <div className="ss__banner-text">
              <p className="ss__banner-sub">List a new co-working space on</p>
              <p className="ss__banner-brand">COZONES</p>
            </div>
          </div>
          <button className="ss__get-started" onClick={handleGetStarted}>
            <span>+ Create New Space</span>
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ss__body">
        <div className="ss__header">
          <div className="ss__header-left">
            <h2 className="ss__title">My Spaces</h2>
            <span className="ss__count">{spaces.length} {spaces.length === 1 ? 'Space' : 'Spaces'}</span>
          </div>
          <button className="ss__refresh" onClick={handleRefresh} aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="ss__status ss__loading">
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
            <p>Loading your premium spaces...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="ss__status ss__error">
            <div className="ss__error-icon">
              <AlertTriangle size={24} />
            </div>
            <p>{error}</p>
            <button onClick={fetchSpaces} className="ss__retry-btn">
              <RefreshCw size={16} style={{ marginRight: '6px' }} />
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && spaces.length === 0 && (
          <div className="ss__status ss__empty">
            <div className="ss__empty-icon">
              <Building2 size={48} />
            </div>
            <h3>No spaces created yet</h3>
            <p>Start your journey by creating your first workspace</p>
            <button className="ss__empty-btn" onClick={handleGetStarted}>
              Create Your First Space
              <Plus size={18} />
            </button>
          </div>
        )}

        {/* Spaces Grid */}
        {!loading && !error && spaces.length > 0 && (
          <div className="ss__grid">
            {spaces.map((space) => {
              const IconComponent = getSpaceIcon(space.name);
              return (
                <div
                  key={space.id || space._id}
                  className="ss__card"
                  onClick={() => handleViewSpace(space.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewSpace(space.id);
                    }
                  }}
                >
                  <div className="ss__card-header">
                    <div className="ss__card-icon">
                      <IconComponent size={32} />
                    </div>
                    <div className="ss__card-badge">
                      {space.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <h3 className="ss__card-name">{space.name || 'Unnamed Space'}</h3>

                  <div className="ss__card-details">
                    <div className="ss__card-detail" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} />
                      <span>{space.city}, {space.area || 'Area not specified'}</span>
                    </div>
                    <div className="ss__card-detail" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Home size={14} />
                      <span>{space.address?.substring(0, 30) || 'Address not specified'}</span>
                    </div>
                  </div>

                  <div className="ss__card-stats">
                    <div className="ss__stat">
                      <span className="ss__stat-label">Created</span>
                      <span className="ss__stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(space.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="ss__stat">
                      <span className="ss__stat-label">Rating</span>
                      <span className="ss__stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} /> {space.rating || 'New'}
                      </span>
                    </div>
                  </div>

                  <div className="ss__card-actions">
                    <button
                      onClick={(e) => handleEditSpace(space.id, e)}
                      className="ss__edit-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit3 size={16} />
                      Edit Space
                    </button>
                    {/* <button
                      onClick={(e) => handleDeleteSpace(space.id, e)}
                      className="ss__delete-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button> */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}