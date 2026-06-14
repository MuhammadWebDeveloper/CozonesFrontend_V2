// MyFavorites.jsx - Fully optimized with lazy loading images
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../../src/componentstyles/utilstyle/myfavorites.css";
import { FiHeart, FiMapPin, FiClock, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

// Local fallback image
const FALLBACK_IMAGE = 'https://picsum.photos/id/20/400/200';

// Lazy Image Component with Skeleton
const LazyFavoriteImage = ({ unitId, alt, apiClient }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [imageSrc, setImageSrc] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const imageFetchedRef = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px', threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchImage = async () => {
            if (isVisible && unitId && !imageFetchedRef.current) {
                imageFetchedRef.current = true;
                try {
                    const response = await apiClient.get(`api/favorites/unit/${unitId}/images`);
                    if (response.data.success && response.data.images && response.data.images.length > 0) {
                        let img = response.data.images[0].image_base64;
                        if (img && img.startsWith('data:application/octet-stream')) {
                            img = img.replace('data:application/octet-stream', 'data:image/jpeg');
                        }
                        setImageSrc(img);
                    } else {
                        setImageSrc(FALLBACK_IMAGE);
                    }
                } catch (err) {
                    console.error('Failed to load image:', err);
                    setImageSrc(FALLBACK_IMAGE);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchImage();
    }, [isVisible, unitId, apiClient]);

    return (
        <div ref={containerRef} className="MF_imageWrap" style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
            {isLoading && isVisible && (
                <div className="MF_image_skeleton" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    zIndex: 2,
                    borderRadius: '12px 12px 0 0'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div className="MF_spinner_small" style={{
                            width: '24px',
                            height: '24px',
                            border: '2px solid #f3f3f3',
                            borderTop: '2px solid #01095A',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '12px', color: '#999' }}>Loading...</span>
                    </div>
                </div>
            )}
            {imageSrc && (
                <img
                    src={imageSrc}
                    alt={alt}
                    className="MF_image"
                    style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        display: isLoading ? 'none' : 'block'
                    }}
                    onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                    }}
                />
            )}
            {!isLoading && !imageSrc && !isVisible && (
                <div style={{
                    width: '100%',
                    height: '200px',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                }}>
                    <span>No image</span>
                </div>
            )}
        </div>
    );
};

const MyFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingIds, setRemovingIds] = useState(new Set());
    const navigate = useNavigate();

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    useEffect(() => {
        fetchFavorites();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .MF_image_skeleton {
                animation: shimmer 1.5s infinite;
            }
            .MF_spinner_small {
                animation: spin 1s linear infinite;
            }
            .MF_card {
                position: relative;
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .MF_card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            }
            .MF_image {
                width: 100%;
                height: 200px;
                object-fit: cover;
                display: block;
            }
            .MF_info {
                padding: 16px;
                position: relative;
            }
            .MF_removeBtn {
                position: absolute;
                bottom: 16px;
                right: 16px;
                background: #ff4757;
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s, opacity 0.2s;
                z-index: 10;
            }
            .MF_removeBtn:hover {
                transform: scale(1.1);
            }
            .MF_removeBtn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('api/favorites/my-favorites');
            
            if (response.data.success) {
                setFavorites(response.data.favorites);
            }
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (unitId) => {
        if (removingIds.has(unitId)) return;
        
        setRemovingIds(prev => new Set(prev).add(unitId));
        
        try {
            const response = await apiClient.post(`api/favorites/toggle/${unitId}`);
            if (response.data.success) {
                setFavorites(prev => prev.filter(fav => fav.unit?.id !== unitId));
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
            setError('Failed to remove favorite. Please try again.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setRemovingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(unitId);
                return newSet;
            });
        }
    };

    const getBestRate = (favorite) => {
        const unit = favorite.unit;
        if (unit?.hourly_rate && unit.hourly_rate > 0) {
            return `PKR ${unit.hourly_rate.toLocaleString()}/hour`;
        }
        if (unit?.daily_rate && unit.daily_rate > 0) {
            return `PKR ${unit.daily_rate.toLocaleString()}/night`;
        }
        if (unit?.monthly_rate && unit.monthly_rate > 0) {
            return `PKR ${unit.monthly_rate.toLocaleString()}/month`;
        }
        return 'Price on request';
    };

    const getUnitTypeDisplay = (unitType) => {
        if (!unitType) return 'SPACE';
        const displayNames = {
            'open_desk': 'OPEN DESK',
            'dedicated_desk': 'DEDICATED DESK',
            'private_cabin': 'PRIVATE CABIN',
            'meeting_room': 'MEETING ROOM'
        };
        return displayNames[unitType] || unitType.replace('_', ' ').toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            
            return date.toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    };

    const handleCardClick = (unitId) => {
        navigate(`/spaces/${unitId}`);
    };

    if (loading) {
        return (
            <div className="MF_container">
                <div className="MF_loading">
                    <div className="MF_spinner"></div>
                    <p>Loading your favorites...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="MF_container">
                <div className="MF_error">
                    <p>{error}</p>
                    <button onClick={fetchFavorites}>Try again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="MF_container">
            <div className="MF_header">
                <button className="MF_backBtn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={20} /> Back
                </button>
                <div className="MF_titleRow">
                    <FiHeart size={28} className="MF_heartIcon" />
                    <h1 className="MF_title">My Favorites</h1>
                    <span className="MF_count">{favorites.length} saved</span>
                </div>
            </div>

            {favorites.length === 0 ? (
                <div className="MF_empty">
                    <FiHeart size={64} className="MF_emptyIcon" />
                    <h2>No favorites yet</h2>
                    <p>Start exploring spaces and save the ones you love.</p>
                    <button className="MF_exploreBtn" onClick={() => navigate('/')}>
                        Explore spaces
                    </button>
                </div>
            ) : (
                <div className="MF_grid">
                    {favorites.map((fav) => (
                        <div key={fav.favorite_id || fav.unit?.id} className="MF_card">
                            <div 
                                onClick={() => handleCardClick(fav.unit?.id)} 
                                style={{ cursor: 'pointer' }}
                            >
                                <LazyFavoriteImage
                                    unitId={fav.unit?.id}
                                    alt={fav.unit?.name || 'Unit'}
                                    apiClient={apiClient}
                                />
                            </div>

                            <div className="MF_info">
                                <div 
                                    onClick={() => handleCardClick(fav.unit?.id)} 
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="MF_unitType">
                                        {getUnitTypeDisplay(fav.unit?.unit_type)}
                                    </div>
                                    <h3 className="MF_spaceName">
                                        {fav.unit?.name || fav.unit?.unit_type?.replace('_', ' ') || 'Workspace'}
                                    </h3>
                                    <div className="MF_location">
                                        <FiMapPin size={14} />
                                        <span>
                                            {fav.space?.city || 'City not specified'}
                                            {fav.space?.address ? ` · ${fav.space.address.substring(0, 30)}${fav.space.address.length > 30 ? '...' : ''}` : ''}
                                        </span>
                                    </div>
                                    <div className="MF_price">{getBestRate(fav)}</div>
                                    <div className="MF_savedDate">
                                        <FiClock size={12} />
                                        <span>Saved {formatDate(fav.favorited_at)}</span>
                                    </div>
                                </div>

                                <button
                                    className="MF_removeBtn"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await removeFavorite(fav.unit?.id);
                                    }}
                                    disabled={removingIds.has(fav.unit?.id)}
                                    title="Remove from favorites"
                                >
                                    {removingIds.has(fav.unit?.id) ? (
                                        <div className="MF_removeSpinner" style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid white',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                    ) : (
                                        <FiHeart size={16} fill="white" stroke="white" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyFavorites;