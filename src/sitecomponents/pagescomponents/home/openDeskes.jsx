import React, { useState, useRef, useCallback } from 'react';
import { ArrowRight, Loader2, RefreshCw, ChevronRight, Heart, MapPin, Star } from 'lucide-react';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/openDeskes.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';
import { useInfiniteQuery } from '@tanstack/react-query';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/mousewheel';
import 'swiper/css/autoplay';

const Open_Deskes = ({ title }) => {
    const swiperRef = useRef(null);
    const navigate = useNavigate();
    const ITEMS_PER_PAGE = 5;

    // Helper functions (unchanged)
    const getBestRate = (unit) => {
        if (unit.hourly_rate && parseFloat(unit.hourly_rate) > 0) {
            return `PKR ${parseFloat(unit.hourly_rate).toLocaleString()}/hour`;
        } else if (unit.daily_rate && parseFloat(unit.daily_rate) > 0) {
            return `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/day`;
        } else if (unit.monthly_rate && parseFloat(unit.monthly_rate) > 0) {
            return `PKR ${parseFloat(unit.monthly_rate).toLocaleString()}/month`;
        }
        return "Price on request";
    };

    const getUnitImage = (unit) => {
        if (unit.images && unit.images.length > 0) {
            let img = unit.images[0].image_base64;
            if (img && img.startsWith('data:application/octet-stream')) {
                img = img.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            return img;
        }
        return null;
    };

    // API client setup (unchanged)
    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // 👇 REPLACES ALL useState + useEffect + fetchSpaces
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = useInfiniteQuery({
        queryKey: ['openDesks'], // Unique key for cache
        queryFn: async ({ pageParam = 1 }) => {
            const response = await apiClient.get(
                `/api/spaces/unit/open_desks?page=${pageParam}&limit=${ITEMS_PER_PAGE}`
            );
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            // Calculate if there are more pages
            const totalFetched = allPages.length * ITEMS_PER_PAGE;
            const totalCount = lastPage.total_count || 0;

            if (totalFetched < totalCount) {
                return allPages.length + 1; // Next page number
            }
            return undefined; // No more pages
        },
        staleTime: 10 * 60 * 1000, // 👈 10 MINUTES - data stays fresh
        initialPageParam: 1,
    });

    // 👇 Flatten all pages into one array (replaces your spaces state)
    const allSpaces = data?.pages?.flatMap(page =>
        (page.units || [])
            .filter(unit => unit.is_active === true)
            .map(unit => {
                const image = getUnitImage(unit);
                return {
                    id: unit.id,
                    unit_id: unit.id,
                    title: unit.name || "Open Desk",
                    location: unit.city || unit.space_city || "Coworking Space",
                    price: getBestRate(unit),
                    nights: 1,
                    // rating: 4.5,
                    image: image ? [image] : null,
                    unit_type: unit.unit_type
                };
            })
    ) || [];

    // Load more function
    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Swiper handlers
    const handleSlideChange = (swiper) => {
        const { activeIndex, slides } = swiper;
        if (hasNextPage && !isFetchingNextPage) {
            if (activeIndex >= slides.length - 3) {
                loadMore();
            }
        }
    };

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

    const handleCardClick = (id) => {
        navigate(`/spaces/${id}`);
    };

    const handleFavoriteToggle = (unitId, isLiked) => {
        console.log(`Favorite toggled for ${unitId}: ${isLiked}`);
    };

    // Loading state (first load)
    if (isLoading) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <div className="circle-spinner"></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>Loading open desks...</p>
                </div>
            </section>
        );
    }

    // Error state
    if (isError) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <p className="error-message">
                        Error loading spaces: {error?.message || 'Please try again.'}
                    </p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        <RefreshCw size={16} style={{ marginRight: '8px' }} />
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    // Empty state
    if (allSpaces.length === 0) {
        return (
            <section className="Cozones_Spaces_section">
                <div className="Cozones_Spaces_container">
                    <div className="Cozones_Spaces_header">
                        <h2 className="Cozones_Space_title">{title || "Open Desks"}</h2>
                    </div>
                    <p>No open desks available at the moment.</p>
                </div>
            </section>
        );
    }

    // Main render with spaces
    return (
        <section className="Cozones_Spaces_section">
            <div className="Cozones_Spaces_container">
                <div className="Cozones_Spaces_header">
                    <h2 className="Cozones_Space_title">{title || "Open Desks"}</h2>
                    <button className="Cozones_Spaces_viewAll">
                        View all <ArrowRight size={20} />
                    </button>
                </div>

                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    style={{ overflow: 'hidden', width: '100%' }}
                >
                    <Swiper
                        modules={[Navigation, Mousewheel, Autoplay]}
                        spaceBetween={16}
                        slidesPerView="auto"
                        loop={false}
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
                        className="Cozones_Spaces_slider"
                        style={{ overflow: 'hidden' }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={handleSlideChange}
                        onReachEnd={() => {
                            if (hasNextPage && !isFetchingNextPage) {
                                loadMore();
                            }
                        }}
                    >
                        {allSpaces.map((space) => (
                            <SwiperSlide key={space.id} className="Cozones_Spaces_slide">
                                <div className="Cozones_Spaces_card">
                                    <SpaceCard
                                        id={space.id}
                                        unit_id={space.unit_id}
                                        image={space.image}
                                        title={space.title}
                                        location={space.location}
                                        rating={space.rating}
                                        price={space.price}
                                        nights={space.nights}
                                        onFavoriteClick={handleFavoriteToggle}
                                        onCardClick={handleCardClick}
                                    />
                                </div>
                            </SwiperSlide>
                        ))}

                        {/* Loading more indicator */}
                        {isFetchingNextPage && (
                            <SwiperSlide className="Cozones_Spaces_slide loading-slide">
                                <div className="loading-more-container">
                                    <div className="circle-spinner-small"></div>
                                    <p>Loading more spaces...</p>
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                {/* Load More button */}
                {hasNextPage && !isFetchingNextPage && allSpaces.length > 0 && (
                    <div className="load-more-container">
                        <button onClick={loadMore} className="load-more-btn">
                            Load More Spaces <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Open_Deskes;