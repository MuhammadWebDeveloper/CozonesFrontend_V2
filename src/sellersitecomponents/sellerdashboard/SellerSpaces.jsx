import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../componentstyles/sellerdashboardstyles/SellerSpaces.css';
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

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
    const icons = ['🏢', '🏛️', '🏬', '🏫', '🏪'];
    const index = name?.length % icons.length || 0;
    return icons[index];
  };

  return (
    <main className="ss__main">
      {/* Premium Banner */}
      <div className="ss__banner">
        <div className="ss__banner-content">
          <div className="ss__banner-left">
            <div className="ss__banner-icon">✨</div>
            <div className="ss__banner-text">
              <p className="ss__banner-sub">List a new co-working space on</p>
              <p className="ss__banner-brand">COZONES</p>
            </div>
          </div>
          <button className="ss__get-started" onClick={handleGetStarted}>
            <span>+ Create New Space</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 5L7 1L12 -3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 12C20 7.58172 16.4183 4 12 4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="ss__status ss__loading">
            <div className="ss__loader"></div>
            <p>Loading your premium spaces...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="ss__status ss__error">
            <div className="ss__error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={fetchSpaces} className="ss__retry-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1" stroke="currentColor" strokeWidth="2" />
                <path d="M12 5L7 1L12 -3" stroke="currentColor" strokeWidth="2" />
              </svg>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && spaces.length === 0 && (
          <div className="ss__status ss__empty">
            <div className="ss__empty-icon">🏢</div>
            <h3>No spaces created yet</h3>
            <p>Start your journey by creating your first workspace</p>
            <button className="ss__empty-btn" onClick={handleGetStarted}>
              Create Your First Space
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        )}

        {/* Spaces Grid */}
        {!loading && !error && spaces.length > 0 && (
          <div className="ss__grid">
            {spaces.map((space) => (
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
                  <div className="ss__card-icon">{getSpaceIcon(space.name)}</div>
                  <div className="ss__card-badge">
                    {space.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <h3 className="ss__card-name">{space.name || 'Unnamed Space'}</h3>

                <div className="ss__card-details">
                  <div className="ss__card-detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>{space.city}, {space.area || 'Area not specified'}</span>
                  </div>
                  <div className="ss__card-detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-8H10v8H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>{space.address?.substring(0, 30) || 'Address not specified'}</span>
                  </div>
                </div>

                <div className="ss__card-stats">
                  <div className="ss__stat">
                    <span className="ss__stat-label">Created</span>
                    <span className="ss__stat-value">
                      {new Date(space.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="ss__stat">
                    <span className="ss__stat-label">Rating</span>
                    <span className="ss__stat-value">⭐ {space.rating || 'New'}</span>
                  </div>
                </div>

                <div className="ss__card-actions">
                  <button
                    onClick={(e) => handleEditSpace(space.id, e)}
                    className="ss__edit-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17 3l4 4L7 21H3v-4L17 3z" stroke="currentColor" strokeWidth="2" />
                      <path d="M15 5l4 4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Edit Space
                  </button>
                  <button
                    onClick={(e) => handleDeleteSpace(space.id, e)}
                    className="ss__delete-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" stroke="currentColor" strokeWidth="2" />
                      <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}