// Meeting_Rooms.jsx - UPDATED with Swiper.js slider
import React, { useState, useEffect, useRef } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/meetingRooms.css';
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

const Meeting_Rooms = ({ title }) => {
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const swiperRef = useRef(null);

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
                display: `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/day`,
                period: 'day'
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

    // Axios instance
    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 30000,
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

    // Fetch Meeting Rooms
    const fetchSpaces = async () => {
        try {
            setLoading(true);
            setError(false);

            const response = await apiClient.get('api/spaces/unit/meeting_rooms');

            if (response.data?.success && response.data?.units?.length > 0) {
                const transformedSpaces = response.data.units
                    .filter(unit => unit.is_active === true)
                    .map((unit) => {
                        const bestRate = getBestRate(unit);
                        return {
                            id: unit.id,
                            space_id: unit.space_id,
                            title: unit.name || "Meeting Room",
                            location: unit.city || "Coworking Space",
                            price: bestRate ? bestRate.display : "N/A",
                            days: parseInt(unit.duration) || 1,
                            images: unit.images && unit.images.length > 0
                                ? unit.images
                                : ['https://images.unsplash.com/photo-1497366216548-37526070297c'],
                            rating: 4.6,
                            reviews: 0,
                            unit_type: unit.unit_type,
                            is_active: unit.is_active,
                            total_capacity: unit.total_capacity,
                            hourly_rate: unit.hourly_rate,
                            daily_rate: unit.daily_rate,
                            monthly_rate: unit.monthly_rate
                        };
                    });

                // console.log('✅ Meeting rooms with IDs:', transformedSpaces.map(s => ({ id: s.id, title: s.title })));
                setSpaces(transformedSpaces);
            } else {
                console.warn('⚠️ No meeting rooms from API');
                setSpaces([]);
            }

        } catch (err) {
            console.error('Error fetching meeting rooms:', err);
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
        // console.log('🖱️ Navigating to meeting room:', id);
        navigate(`/meeting-rooms/${id}`);
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
            <section className="Meeting_Rooms_section">
                <div className="Meeting_Rooms_container">
                    <div className="Meeting_Rooms_loading"></div>
                    <p>Loading meeting rooms...</p>
                </div>
            </section>
        );
    }

    if (error && spaces.length === 0) {
        return (
            <section className="Meeting_Rooms_section">
                <div className="Meeting_Rooms_container">
                    <h3>Unable to load meeting rooms</h3>
                    <button onClick={fetchSpaces}>Try Again</button>
                </div>
            </section>
        );
    }

    if (spaces.length === 0 && !loading) {
        return (
            <section className="Meeting_Rooms_section">
                <div className="Meeting_Rooms_container">
                    <div className="Meeting_Rooms_header">
                        <h2 className="Meeting_Rooms_title">{title || "Meeting Rooms"}</h2>
                    </div>
                    <div className="Meeting_Rooms_empty">
                        <p>No active meeting rooms available at the moment.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="Meeting_Rooms_section">
            <div className="Meeting_Rooms_container">
                <div className="Meeting_Rooms_header">
                    <h2 className="Meeting_Rooms_title">{title || "Meeting Rooms"}</h2>
                    <button className="Meeting_Rooms_viewAll">
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
                        className="Meeting_Rooms_slider"
                        style={{ overflow: 'hidden' }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                    >
                        {spaces.map((space) => (
                            <SwiperSlide key={space.id} className="Meeting_Rooms_slide">
                                <div className="Meeting_Rooms_card">
                                    <SpaceCard
                                        id={space.id}
                                        unit_id={space.id}
                                        image={space.images.length > 0 ? space.images : ['https://images.unsplash.com/photo-1497366216548-37526070297c']}
                                        title={space.title}
                                        location={space.location}
                                        rating={space.rating}
                                        reviews={space.reviews}
                                        price={space.price}
                                        nights={space.days}
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

export default Meeting_Rooms;