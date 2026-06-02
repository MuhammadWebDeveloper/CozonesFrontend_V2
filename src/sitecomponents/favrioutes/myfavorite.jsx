// MyFavorites.jsx - Updated to work with nested API response
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../../src/componentstyles/utilstyle/myfavorites.css";
import { FiHeart, FiMapPin, FiClock, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

const MyFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('api/favorites/my-favorites');
            console.log('API Response:', response.data);

            if (response.data.success) {
                setFavorites(response.data.favorites);
                console.log('Favorites data:', response.data.favorites);
            }
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError('Failed to load favorites');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Access unit.id from nested structure
    const removeFavorite = async (unitId) => {
        try {
            console.log('Removing favorite for unit:', unitId);
            const response = await apiClient.post(`api/favorites/toggle/${unitId}`);
            
            if (response.data.success) {
                // Filter by unit.id from nested structure
                setFavorites(prev => prev.filter(fav => fav.unit?.id !== unitId));
                console.log('Favorite removed successfully');
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
            fetchFavorites(); // Refresh to sync
        }
    };

    // ✅ FIXED: Get best rate from nested unit object
    const getBestRate = (favorite) => {
        const unit = favorite.unit;
        if (unit?.hourly_rate && parseFloat(unit.hourly_rate) > 0 && unit.hourly_rate !== -999) {
            return `PKR ${parseFloat(unit.hourly_rate).toLocaleString()}/hour`;
        }
        if (unit?.daily_rate && parseFloat(unit.daily_rate) > 0 && unit.daily_rate !== -999) {
            return `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/night`;
        }
        if (unit?.monthly_rate && parseFloat(unit.monthly_rate) > 0 && unit.monthly_rate !== -999) {
            return `PKR ${parseFloat(unit.monthly_rate).toLocaleString()}/month`;
        }
        return 'Price on request';
    };

    // ✅ FIXED: Get image from nested unit object
    const getImage = (favorite) => {
        const unit = favorite.unit;
        if (unit?.images && Array.isArray(unit.images) && unit.images.length > 0) {
            let img = unit.images[0];

            if (!img) return getFallbackImage();

            if (typeof img === 'object' && img.image_base64) {
                img = img.image_base64;
            }

            if (typeof img === 'string' && img.startsWith('data:application/octet-stream')) {
                img = img.replace('data:application/octet-stream', 'data:image/jpeg');
            }

            if (typeof img === 'string' && !img.startsWith('data:image') && !img.startsWith('http') && img.length > 100) {
                if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 100))) {
                    return `data:image/jpeg;base64,${img}`;
                }
            }

            if (typeof img === 'string' && (img.startsWith('data:image') || img.startsWith('http'))) {
                return img;
            }

            if (typeof img === 'string' && img.startsWith('/')) {
                return `${BaseUrl}${img}`;
            }

            return img;
        }
        return getFallbackImage();
    };

    const getFallbackImage = () => {
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Recently';
        try {
            return new Date(dateStr).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Recently';
        }
    };

    const getUnitTypeDisplay = (unitType) => {
        if (!unitType) return 'SPACE';
        return unitType.replace('_', ' ').toUpperCase();
    };

    if (loading) return (
        <div className="MF_container">
            <div className="MF_loading">
                <div className="MF_spinner"></div>
                <p>Loading your favorites...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="MF_container">
            <div className="MF_error">
                <p>{error}</p>
                <button onClick={fetchFavorites}>Try again</button>
            </div>
        </div>
    );

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
                        // ✅ Use favorite_id or unit.id as key
                        <div key={fav.favorite_id || fav.unit?.id} className="MF_card">
                            <div
                                className="MF_imageWrap"
                                onClick={() => navigate(`/spaces/${fav.unit?.id}`)}
                            >
                                <img
                                    src={getImage(fav)}
                                    alt={fav.unit?.name || 'Unit'}
                                    className="MF_image"
                                    onError={(e) => {
                                        e.target.src = getFallbackImage();
                                    }}
                                />
                                <div className="MF_badge">
                                    {getUnitTypeDisplay(fav.unit?.unit_type)}
                                </div>
                                <button
                                    className="MF_removeBtn"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await removeFavorite(fav.unit?.id);
                                    }}
                                >
                                    <FiHeart size={20} fill="white" stroke="white" />
                                </button>
                            </div>

                            <div
                                className="MF_info"
                                onClick={() => navigate(`/spaces/${fav.unit?.id}`)}
                            >
                                <h3 className="MF_spaceName">
                                    {fav.unit?.name || fav.unit?.unit_type?.replace('_', ' ') || 'Workspace'}
                                </h3>
                                <div className="MF_location">
                                    <FiMapPin size={14} />
                                    <span>
                                        {fav.space?.city || 'City'}
                                        {fav.space?.address ? ` · ${fav.space.address.substring(0, 30)}` : ''}
                                    </span>
                                </div>
                                <div className="MF_price">{getBestRate(fav)}</div>
                                <div className="MF_savedDate">
                                    <FiClock size={12} />
                                    <span>Saved {formatDate(fav.favorited_at)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyFavorites;