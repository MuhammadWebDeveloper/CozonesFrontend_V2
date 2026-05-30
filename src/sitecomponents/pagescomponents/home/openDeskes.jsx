// Open_Deskes.jsx - Use space_id instead of unit id
import React, { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/openDeskes.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';
const Open_Deskes = ({ title }) => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

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

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    const fetchSpaces = async () => {
        try {
            setLoading(true);
            setError(false);
            const response = await apiClient.get('/api/spaces/unit/open_desks');

            console.log('📡 API Response:', response.data);

            if (response.data?.success && response.data?.units?.length > 0) {
                const transformedSpaces = response.data.units
                    .filter(unit => unit.is_active === true)
                    .map((unit) => {
                        const bestRate = getBestRate(unit);
                        return {
                            // IMPORTANT: Use space_id for favorites, not unit id
                            id: unit.space_id,
                            unit_id: unit.id,   // Keep unit_id for reference if needed
                            title: unit.name || "Open Desk",
                            location: unit.city || "Coworking Space",
                            price: bestRate ? bestRate.display : "PKR 0/hour",
                            nights: 1,
                            images: unit.images?.length > 0 ? unit.images : [],
                            rating: 4.5,
                            reviews: 0,
                            // Keep unit info for display
                            unit_type: unit.unit_type,
                            hourly_rate: unit.hourly_rate,
                            daily_rate: unit.daily_rate
                        };
                    });

                console.log('✅ Transformed spaces with SPACE IDs:', transformedSpaces.map(s => ({ id: s.id, title: s.title })));
                setSpaces(transformedSpaces);
            } else {
                console.warn('⚠️ No spaces from API');
                setSpaces([]);
            }
        } catch (err) {
            console.error('❌ Error fetching:', err);
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
        console.log('🖱️ Navigating to space:', id);
        // When clicking card, you might want to go to unit detail or space detail
        // For now, go to space detail
        navigate(`/spaces/${id}`);
    };

    const handleFavoriteToggle = (spaceId, isLiked) => {
        console.log(`❤️ Favorite toggled for SPACE ${spaceId}: ${isLiked ? 'LIKED' : 'UNLIKED'}`);
    };

    if (loading) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <div className="Cozones_Spaces_loading"></div>
                    <p>Loading open desks...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <p>Error loading spaces. Please try again.</p>
                    <button onClick={fetchSpaces}>Retry</button>
                </div>
            </section>
        );
    }

    if (spaces.length === 0) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <h2>{title || "Open Desks"}</h2>
                    <p>No open desks available at the moment.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="Cozones_Spaces_section">
            <div className="Cozones_Spaces_container">
                <div className="Cozones_Spaces_header">
                    <h2 className="Cozones_Space_title">{title || "Open Desks"}</h2>
                    <button className="Cozones_Spaces_viewAll">
                        View all <FiArrowRight />
                    </button>
                </div>

                <div className="Cozones_Spaces_grid">
                    {spaces.map((space) => (
                        <div key={space.id} className="Cozones_Spaces_card">
                            <SpaceCard
                                id={space.id}         // space_id for favorites
                                unit_id={space.unit_id}  // unit_id for navigation
                                image={space.images.length > 0 ? space.images : ['https://via.placeholder.com/400x300']}
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

export default Open_Deskes;