// Private_Cabins.jsx - Fixed (no lazy loading, use images from backend)
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const swiperRef = useRef(null);
    const isLoadingRef = useRef(false);

    const ITEMS_PER_PAGE = 5;

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

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 60000, // Increased timeout for base64 images
        headers: { 'Content-Type': 'application/json' }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Helper to extract image from unit data (backend already returns it)
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

    // Fetch Private Cabins with pagination
    const fetchSpaces = async (pageNum = 1, isLoadMore = false) => {
        if (isLoadingRef.current) return;

        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            isLoadingRef.current = true;
            setError(false);

            const response = await apiClient.get(`api/spaces/unit/private_cabins?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);

            if (response.data?.success) {
                const total = response.data.total_count || 0;
                setTotalCount(total);

                const newUnits = response.data.units || [];
                
                // Transform units with images from backend
                const transformedSpaces = newUnits
                    .filter(unit => unit.is_active === true)
                    .map(unit => {
                        const image = getUnitImage(unit);
                        return {
                            id: unit.id,
                            unit_id: unit.id,
                            title: unit.name || "Private Cabin",
                            location: unit.city || unit.space_city || "Coworking Space",
                            price: getBestRate(unit),
                            nights: 1,
                            rating: 4.8,
                            reviews: 0,
                            images: image ? [image] : null, // Use image from backend
                            unit_type: unit.unit_type
                        };
                    });

                if (isLoadMore) {
                    setSpaces(prev => [...prev, ...transformedSpaces]);
                } else {
                    setSpaces(transformedSpaces);
                }

                const currentTotal = isLoadMore ? spaces.length + transformedSpaces.length : transformedSpaces.length;
                setHasMore(currentTotal < total);

                console.log(`📊 Loaded ${currentTotal} of ${total} private cabins`);
            } else {
                console.warn('⚠️ No private cabins from API');
                setSpaces([]);
                setHasMore(false);
            }
        } catch (err) {
            console.error('Error fetching private cabins:', err);
            setError(true);
            if (!isLoadMore) setSpaces([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            isLoadingRef.current = false;
        }
    };

    // Load more when reaching the last slide
    const handleSlideChange = (swiper) => {
        const { activeIndex, slides } = swiper;
        if (hasMore && !loadingMore && !isLoadingRef.current) {
            if (activeIndex >= slides.length - 3) {
                loadMore();
            }
        }
    };

    const loadMore = () => {
        if (!hasMore || loadingMore || isLoadingRef.current) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSpaces(nextPage, true);
    };

    useEffect(() => {
        fetchSpaces(1, false);
    }, []);

    const navigate = useNavigate();
    const handleCardClick = (id) => {
        navigate(`/private-cabins/${id}`);
    };

    const handleFavoriteToggle = (unitId, isLiked) => {
        console.log(`Favorite toggled for ${unitId}: ${isLiked}`);
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

    if (loading && spaces.length === 0) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <div className="circle-spinner"></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>Loading private cabins...</p>
                </div>
            </section>
        );
    }

    if (error && spaces.length === 0) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <p className="error-message">Error loading spaces. Please try again.</p>
                    <button onClick={() => fetchSpaces(1, false)} className="retry-btn">Retry</button>
                </div>
            </section>
        );
    }

    if (spaces.length === 0 && !loading) {
        return (
            <section className="Private_Cabins_section">
                <div className="Private_Cabins_container">
                    <div className="Private_Cabins_header">
                        <h2 className="Private_Cabins_title">{title || "Private Cabins"}</h2>
                    </div>
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
                        className="Private_Cabins_slider"
                        style={{ overflow: 'hidden' }}
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={handleSlideChange}
                        onReachEnd={() => {
                            if (hasMore && !loadingMore) {
                                loadMore();
                            }
                        }}
                    >
                        {spaces.map((space) => (
                            <SwiperSlide key={space.id} className="Private_Cabins_slide">
                                <div className="Private_Cabins_card">
                                    <SpaceCard
                                        id={space.id}
                                        unit_id={space.unit_id}
                                        image={space.images}
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

                        {loadingMore && (
                            <SwiperSlide className="Private_Cabins_slide loading-slide">
                                <div className="loading-more-container">
                                    <div className="circle-spinner-small"></div>
                                    <p>Loading more cabins...</p>
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                {hasMore && !loadingMore && spaces.length > 0 && (
                    <div className="load-more-container">
                        <button onClick={loadMore} className="load-more-btn">
                            Load More Cabins
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Private_Cabins;