// Private_Cabins.jsx - COMPLETELY FIXED
import React, { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/privateCabins.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';

const Private_Cabins = ({ title }) => {
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
        baseURL:  BaseUrl,
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
            const response = await apiClient.get('api/spaces/unit/private_cabins');

            if (response.data?.success && response.data?.units?.length > 0) {
                const transformedSpaces = response.data.units
                    .filter(unit => unit.is_active === true)
                    .map((unit) => {
                        const bestRate = getBestRate(unit);
                        return {
                            // CRITICAL: Use space_id, NOT unit.id
                            id: unit.space_id,
                            unit_id: unit.id,   // Keep unit_id for reference if needed
                            title: unit.name || "Private Cabin",
                            location: unit.city || "Coworking Space",
                            price: bestRate ? bestRate.display : "N/A",
                            nights: parseInt(unit.duration) || 1,
                            images: unit.images && unit.images.length > 0 ? unit.images : [],
                            rating: 4.8,
                            reviews: 0,
                            unit_type: unit.unit_type,
                            is_active: unit.is_active
                        };
                    });

                console.log('✅ Private cabins with SPACE IDs:', transformedSpaces.map(s => ({ id: s.id, title: s.title })));
                setSpaces(transformedSpaces);
            } else {
                setSpaces([]);
            }
        } catch (err) {
            console.error('Error fetching private cabins:', err);
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
        navigate(`/private-cabins/${id}`);
    };

    const handleFavoriteToggle = (spaceId, isLiked) => {
        console.log(`❤️ Favorite toggled for SPACE ${spaceId}: ${isLiked ? 'LIKED' : 'UNLIKED'}`);
    };

    if (loading) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <div className="Private_Cabins_loading"></div>
                    <p>Loading private cabins...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <p>Error loading spaces. Please try again.</p>
                    <button onClick={fetchSpaces}>Retry</button>
                </div>
            </section>
        );
    }

    if (spaces.length === 0) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <h2>{title || "Private Cabins"}</h2>
                    <p>No private cabins available at the moment.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="Private_Cabins_section">
            <div className="Private_Cabins_container">
                <div className="Private_Cabins_header">
                    <h2 className="Private_Cabins_title">{title || "Private Cabins"}</h2>
                    <button className="Private_Cabins_viewAll">
                        View all <FiArrowRight />
                    </button>
                </div>

                <div className="Private_Cabins_grid">
                    {spaces.map((space) => (
                        <div key={space.id} className="Private_Cabins_card">
                            <SpaceCard
                                id={space.id}         // space_id for favorites
                                unit_id={space.unit_id}  // unit_id for navigationD
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

export default Private_Cabins;