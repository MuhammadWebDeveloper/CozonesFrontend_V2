// Dedicated_Desks.jsx - Updated with proper favorite functionality
import React, { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/dedicatedDesks.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';

const Dedicated_Desks = ({ title }) => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Axios instance
    const apiClient = axios.create({
        baseURL:  BaseUrl ,
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    // Attach token
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Helper function to determine the best rate to display
    const getBestRate = (unit) => {
        if (unit.hourly_rate && parseFloat(unit.hourly_rate) > 0) {
            return {
                type: 'hourly',
                value: parseFloat(unit.hourly_rate),
                display: `PKR ${parseFloat(unit.hourly_rate).toLocaleString()}/hour`,
                period: 'hour'
            };
        } else if (unit.daily_rate && parseFloat(unit.daily_rate) > 0) {
            return {
                type: 'daily',
                value: parseFloat(unit.daily_rate),
                display: `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/night`,
                period: 'night'
            };
        } else if (unit.monthly_rate && parseFloat(unit.monthly_rate) > 0) {
            return {
                type: 'monthly',
                value: parseFloat(unit.monthly_rate),
                display: `PKR ${parseFloat(unit.monthly_rate).toLocaleString()}/month`,
                period: 'month'
            };
        }
        return null;
    };

    // Fetch Dedicated Desks
    const fetchSpaces = async () => {
        try {
            setLoading(true);
            setError(false);

            const response = await apiClient.get('api/spaces/unit/dedicated_desks');

            if (response.data?.success && response.data?.units?.length > 0) {
                const transformedSpaces = response.data.units
                    .filter(unit => unit.is_active === true)
                    .map((unit) => {
                        const bestRate = getBestRate(unit);
                        return {
                            // IMPORTANT: Use space_id for favorites
                            id: unit.space_id,
                            unit_id: unit.id,   // Keep unit_id for reference if needed
                            title: unit.name || "Dedicated Desk",
                            location: unit.city || "Coworking Space",
                            price: bestRate ? bestRate.display : "N/A",
                            nights: parseInt(unit.duration) || 1,
                            images: unit.images && unit.images.length > 0
                                ? unit.images
                                : ['https://brc.group/wp-content/uploads/2020/11/Benching-Alone-Workstation-Final-2400x1500-1-e1726060377960.jpg'],
                            rating: 4.5,
                            reviews: 0,
                            unit_type: unit.unit_type,
                            is_active: unit.is_active
                        };
                    });

                console.log('✅ Dedicated desks with SPACE IDs:', transformedSpaces.map(s => ({ id: s.id, title: s.title })));
                setSpaces(transformedSpaces);
            } else {
                console.warn('⚠️ No dedicated desks from API');
                setSpaces([]);
            }

        } catch (err) {
            console.error('Error fetching dedicated desks:', err);
            setError(true);
            setSpaces([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, []);

    const navigate = useNavigate();
    const handleCardClick = (id) => {
        console.log('🖱️ Navigating to dedicated desk space:', id);
        navigate(`/dedicated-desk/${id}`);
    };

    const handleFavoriteToggle = (spaceId, isLiked) => {
        console.log(`❤️ Favorite toggled for SPACE ${spaceId}: ${isLiked ? 'LIKED' : 'UNLIKED'}`);
    };

    if (loading) {
        return (
            <section className="Dedicated_Desks_section">
                <div className="Dedicated_Desks_container">
                    <div className="Dedicated_Desks_loading"></div>
                    <p>Loading dedicated desks...</p>
                </div>
            </section>
        );
    }

    if (error && spaces.length === 0) {
        return (
            <section className="Dedicated_Desks_section">
                <div className="Dedicated_Desks_container">
                    <h3>Unable to load dedicated desks</h3>
                    <button onClick={fetchSpaces}>Try Again</button>
                </div>
            </section>
        );
    }

    if (spaces.length === 0 && !loading) {
        return (
            <section className="Dedicated_Desks_section">
                <div className="Dedicated_Desks_container">
                    <div className="Dedicated_Desks_header">
                        <h2 className="Dedicated_Desks_title">{title || "Dedicated Desks"}</h2>
                    </div>
                    <div className="Dedicated_Desks_empty">
                        <p>No active dedicated desks available at the moment.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="Dedicated_Desks_section">
            <div className="Dedicated_Desks_container">
                <div className="Dedicated_Desks_header">
                    <h2 className="Dedicated_Desks_title">{title || "Dedicated Desks"}</h2>
                    <button className="Dedicated_Desks_viewAll">
                        View all <FiArrowRight />
                    </button>
                </div>

                <div className="Dedicated_Desks_grid">
                    {spaces.map((space) => (
                        <div key={space.id} className="Dedicated_Desks_card">
                            <SpaceCard
                                id={space.id}         // space_id for favorites
                                unit_id={space.unit_id}  // unit_id for navigation
                                image={space.images.length > 0 ? space.images : ['https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c']}
                                title={space.title}
                                location={space.location}
                                rating={space.rating}
                                reviews={space.reviews}
                                price={space.price}
                                nights={space.nights}
                                onFavoriteClick={handleFavoriteToggle}
                                onCardClick={handleCardClick}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Dedicated_Desks;