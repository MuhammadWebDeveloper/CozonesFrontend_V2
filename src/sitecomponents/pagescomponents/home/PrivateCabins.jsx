// Private_Cabins.jsx - UPDATED with Swiper.js slider
import React, { useState, useEffect, useRef } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/privateCabins.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/mousewheel';
import 'swiper/css/autoplay';

const Private_Cabins = ({ title }) => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const swiperRef = useRef(null);

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
            const response = await apiClient.get('api/spaces/unit/private_cabins');

            if (response.data?.success && response.data?.units?.length > 0) {
                const transformedSpaces = response.data.units
                    .filter(unit => unit.is_active === true)
                    .map((unit) => {
                        const bestRate = getBestRate(unit);
                        return {
                            id: unit.id,
                            space_id: unit.space_id,
                            title: unit.name || "Private Cabin",
                            location: unit.city || "Coworking Space",
                            price: bestRate ? bestRate.display : "N/A",
                            nights: parseInt(unit.duration) || 1,
                            images: unit.images && unit.images.length > 0 ? unit.images : [],
                            rating: 4.8,
                            reviews: 0,
                            unit_type: unit.unit_type,
                            is_active: unit.is_active,
                            hourly_rate: unit.hourly_rate,
                            daily_rate: unit.daily_rate
                        };
                    });

                // console.log('✅ Private cabins with IDs:', transformedSpaces.map(s => ({ id: s.id, title: s.title })));
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
        // console.log('🖱️ Navigating to private cabin:', id);
        navigate(`/private-cabins/${id}`);
    };

    const handleFavoriteToggle = (unitId, isLiked) => {
        // console.log(`❤️ Favorite toggled for UNIT ${unitId}: ${isLiked ? 'LIKED' : 'UNLIKED'}`);
    };

    // Pause autoplay on hover
    const handleMouseEnter = () => {
        if (swiperRef.current && swiperRef.current.autoplay) {
            swiperRef.current.autoplay.stop();
        }
    };

    const handleMouseLeave = () => {
        if (swiperRef.current && swiperRef.current.autoplay) {
            swiperRef.current.autoplay.start();
        }
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

                {/* Swiper Slider with Infinite Loop and Autoplay */}
                <div 
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ overflow: 'hidden', width: '100%' }}
                >
                    <Swiper
                        modules={[Navigation, Mousewheel, Autoplay]}
                        spaceBetween={16}
                        slidesPerView="auto"
                        loop={true}
                        autoplay={{
                            delay: 3000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                            stopOnLastSlide: false,
                            waitForTransition: true,
                        }}
                        speed={800}
                        mousewheel={{
                            forceToAxis: true,
                            releaseOnEdges: false,
                            sensitivity: 1,
                            enabled: true
                        }}
                        freeMode={{
                            enabled: false,
                            momentum: false
                        }}
                        grabCursor={true}
                        simulateTouch={true}
                        touchRatio={1}
                        touchAngle={45}
                        threshold={5}
                        resistance={true}
                        resistanceRatio={0.85}
                        className="Private_Cabins_slider"
                        style={{ overflow: 'hidden' }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                    >
                        {spaces.map((space) => (
                            <SwiperSlide key={space.id} className="Private_Cabins_slide">
                                <div className="Private_Cabins_card">
                                    <SpaceCard
                                        id={space.id}
                                        unit_id={space.id}
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
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </section>
    );
};

export default Private_Cabins;