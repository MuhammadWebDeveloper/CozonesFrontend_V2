// // Meeting_Rooms.jsx - Fixed (no lazy loading, use images from backend)
// import React, { useState, useEffect, useRef } from 'react';
// import { FiArrowRight } from 'react-icons/fi';
// import axios from 'axios';
// import SpaceCard from "../../../utils/spacescard.jsx";
// import './../../../componentstyles/homestyle/meetingRooms.css';
// import { useNavigate } from 'react-router-dom';
// import BaseUrl from '../../../utils/AppConstants.jsx';

// // Swiper imports
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Mousewheel, Autoplay } from 'swiper/modules';

// // Import Swiper styles
// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/mousewheel';
// import 'swiper/css/autoplay';

// const Meeting_Rooms = ({ title }) => {
//     const [spaces, setSpaces] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [loadingMore, setLoadingMore] = useState(false);
//     const [error, setError] = useState(false);
//     const [hasMore, setHasMore] = useState(true);
//     const [page, setPage] = useState(1);
//     const [totalCount, setTotalCount] = useState(0);
//     const swiperRef = useRef(null);
//     const isLoadingRef = useRef(false);

//     const ITEMS_PER_PAGE = 5;

//     const getBestRate = (unit) => {
//         if (unit.hourly_rate && parseFloat(unit.hourly_rate) > 0) {
//             return `PKR ${parseFloat(unit.hourly_rate).toLocaleString()}/hour`;
//         } else if (unit.daily_rate && parseFloat(unit.daily_rate) > 0) {
//             return `PKR ${parseFloat(unit.daily_rate).toLocaleString()}/day`;
//         } else if (unit.monthly_rate && parseFloat(unit.monthly_rate) > 0) {
//             return `PKR ${parseFloat(unit.monthly_rate).toLocaleString()}/month`;
//         }
//         return "Price on request";
//     };

//     const apiClient = axios.create({
//         baseURL: BaseUrl,
//         timeout: 60000, // Increased timeout for base64 images
//         headers: { 'Content-Type': 'application/json' }
//     });

//     apiClient.interceptors.request.use((config) => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     });

//     // Helper to extract image from unit data (backend already returns it)
//     const getUnitImage = (unit) => {
//         if (unit.images && unit.images.length > 0) {
//             let img = unit.images[0].image_base64;
//             if (img && img.startsWith('data:application/octet-stream')) {
//                 img = img.replace('data:application/octet-stream', 'data:image/jpeg');
//             }
//             return img;
//         }
//         return null;
//     };

//     // Fetch Meeting Rooms with pagination
//     const fetchSpaces = async (pageNum = 1, isLoadMore = false) => {
//         if (isLoadingRef.current) return;

//         try {
//             if (isLoadMore) {
//                 setLoadingMore(true);
//             } else {
//                 setLoading(true);
//             }
//             isLoadingRef.current = true;
//             setError(false);

//             const response = await apiClient.get(`api/spaces/unit/meeting_rooms?page=${pageNum}&limit=${ITEMS_PER_PAGE}`);

//             if (response.data?.success) {
//                 const total = response.data.total_count || 0;
//                 setTotalCount(total);

//                 const newUnits = response.data.units || [];

//                 // Transform units with images from backend
//                 const transformedSpaces = newUnits
//                     .filter(unit => unit.is_active === true)
//                     .map(unit => {
//                         const image = getUnitImage(unit);
//                         return {
//                             id: unit.id,
//                             unit_id: unit.id,
//                             title: unit.name || "Meeting Room",
//                             location: unit.city || unit.space_city || "Coworking Space",
//                             price: getBestRate(unit),
//                             days: 1,
//                             rating: 4.6,
//                             reviews: 0,
//                             images: image ? [image] : null, // Use image from backend
//                             unit_type: unit.unit_type,
//                             total_capacity: unit.total_capacity,
//                             hourly_rate: unit.hourly_rate,
//                             daily_rate: unit.daily_rate,
//                             monthly_rate: unit.monthly_rate
//                         };
//                     });

//                 if (isLoadMore) {
//                     setSpaces(prev => [...prev, ...transformedSpaces]);
//                 } else {
//                     setSpaces(transformedSpaces);
//                 }

//                 const currentTotal = isLoadMore ? spaces.length + transformedSpaces.length : transformedSpaces.length;
//                 setHasMore(currentTotal < total);

//                 console.log(`📊 Loaded ${currentTotal} of ${total} meeting rooms`);
//             } else {
//                 console.warn('⚠️ No meeting rooms from API');
//                 setSpaces([]);
//                 setHasMore(false);
//             }

//         } catch (err) {
//             console.error('Error fetching meeting rooms:', err);
//             setError(true);
//             if (!isLoadMore) setSpaces([]);
//         } finally {
//             setLoading(false);
//             setLoadingMore(false);
//             isLoadingRef.current = false;
//         }
//     };

//     // Load more when reaching the last slide
//     const handleSlideChange = (swiper) => {
//         const { activeIndex, slides } = swiper;
//         if (hasMore && !loadingMore && !isLoadingRef.current) {
//             if (activeIndex >= slides.length - 3) {
//                 loadMore();
//             }
//         }
//     };

//     const loadMore = () => {
//         if (!hasMore || loadingMore || isLoadingRef.current) return;
//         const nextPage = page + 1;
//         setPage(nextPage);
//         fetchSpaces(nextPage, true);
//     };

//     useEffect(() => {
//         fetchSpaces(1, false);
//     }, []);

//     const navigate = useNavigate();
//     const handleCardClick = (id) => {
//         navigate(`/meeting-rooms/${id}`);
//     };

//     const handleFavoriteToggle = (unitId, isLiked) => {
//         console.log(`Favorite toggled for ${unitId}: ${isLiked}`);
//     };

//     const handleMouseEnter = () => {
//         if (swiperRef.current && swiperRef.current.autoplay) {
//             swiperRef.current.autoplay.stop();
//         }
//     };

//     const handleMouseLeave = () => {
//         if (swiperRef.current && swiperRef.current.autoplay) {
//             swiperRef.current.autoplay.start();
//         }
//     };

//     if (loading && spaces.length === 0) {
//         return (
//             <section className="Meeting_Rooms_section">
//                 <div className="Meeting_Rooms_container">
//                     <div className="circle-spinner"></div>
//                     <p style={{ marginTop: '16px', color: '#666' }}>Loading meeting rooms...</p>
//                 </div>
//             </section>
//         );
//     }

//     if (error && spaces.length === 0) {
//         return (
//             <section className="Meeting_Rooms_section">
//                 <div className="Meeting_Rooms_container">
//                     <h3>Unable to load meeting rooms</h3>
//                     <button onClick={() => fetchSpaces(1, false)} className="retry-btn">Try Again</button>
//                 </div>
//             </section>
//         );
//     }

//     if (spaces.length === 0 && !loading) {
//         return (
//             <section className="Meeting_Rooms_section">
//                 <div className="Meeting_Rooms_container">
//                     <div className="Meeting_Rooms_header">
//                         <h2 className="Meeting_Rooms_title">{title || "Meeting Rooms"}</h2>
//                     </div>
//                     <div className="Meeting_Rooms_empty">
//                         <p>No active meeting rooms available at the moment.</p>
//                     </div>
//                 </div>
//             </section>
//         );
//     }

//     return (
//         <section className="Meeting_Rooms_section">
//             <div className="Meeting_Rooms_container">
//                 <div className="Meeting_Rooms_header">
//                     <h2 className="Meeting_Rooms_title">{title || "Meeting Rooms"}</h2>
//                     <button className="Meeting_Rooms_viewAll">
//                         View all <FiArrowRight />
//                     </button>
//                 </div>

//                 <div
//                     onMouseEnter={handleMouseEnter}
//                     onMouseLeave={handleMouseLeave}
//                     style={{ overflow: 'hidden', width: '100%' }}
//                 >
//                     <Swiper
//                         modules={[Navigation, Mousewheel, Autoplay]}
//                         spaceBetween={16}
//                         slidesPerView="auto"
//                         loop={false}
//                         autoplay={{
//                             delay: 3000,
//                             disableOnInteraction: false,
//                             pauseOnMouseEnter: true,
//                             stopOnLastSlide: false,
//                             waitForTransition: true,
//                         }}
//                         speed={800}
//                         mousewheel={{
//                             forceToAxis: true,
//                             releaseOnEdges: false,
//                             sensitivity: 1,
//                             enabled: true
//                         }}
//                         freeMode={{
//                             enabled: false,
//                             momentum: false
//                         }}
//                         grabCursor={true}
//                         simulateTouch={true}
//                         touchRatio={1}
//                         touchAngle={45}
//                         threshold={5}
//                         resistance={true}
//                         resistanceRatio={0.85}
//                         className="Meeting_Rooms_slider"
//                         style={{ overflow: 'hidden' }}
//                         onSwiper={(swiper) => {
//                             swiperRef.current = swiper;
//                         }}
//                         onSlideChange={handleSlideChange}
//                         onReachEnd={() => {
//                             if (hasMore && !loadingMore) {
//                                 loadMore();
//                             }
//                         }}
//                     >
//                         {spaces.map((space) => (
//                             <SwiperSlide key={space.id} className="Meeting_Rooms_slide">
//                                 <div className="Meeting_Rooms_card">
//                                     <SpaceCard
//                                         id={space.id}
//                                         unit_id={space.unit_id}
//                                         image={space.images}
//                                         title={space.title}
//                                         location={space.location}
//                                         rating={space.rating}
//                                         reviews={space.reviews}
//                                         price={space.price}
//                                         nights={space.days}
//                                         onFavoriteClick={handleFavoriteToggle}
//                                         onCardClick={handleCardClick}
//                                     />
//                                 </div>
//                             </SwiperSlide>
//                         ))}

//                         {loadingMore && (
//                             <SwiperSlide className="Meeting_Rooms_slide loading-slide">
//                                 <div className="loading-more-container">
//                                     <div className="circle-spinner-small"></div>
//                                     <p>Loading more rooms...</p>
//                                 </div>
//                             </SwiperSlide>
//                         )}
//                     </Swiper>
//                 </div>

//                 {hasMore && !loadingMore && spaces.length > 0 && (
//                     <div className="load-more-container">
//                         <button onClick={loadMore} className="load-more-btn">
//                             Load More Rooms
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </section>
//     );
// };

// export default Meeting_Rooms;



import React, { useRef, useCallback } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import SpaceCard from "../../../utils/spacescard.jsx";
import './../../../componentstyles/homestyle/meetingRooms.css';
import { useNavigate } from 'react-router-dom';
import BaseUrl from '../../../utils/AppConstants.jsx';
import { useInfiniteQuery } from '@tanstack/react-query'; // 👈 ADD THIS

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/mousewheel';
import 'swiper/css/autoplay';

const Meeting_Rooms = ({ title }) => {
    const swiperRef = useRef(null);
    const navigate = useNavigate();
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
        queryKey: ['meetingRooms'], // Unique cache key
        queryFn: async ({ pageParam = 1 }) => {
            const response = await apiClient.get(
                `api/spaces/unit/meeting_rooms?page=${pageParam}&limit=${ITEMS_PER_PAGE}`
            );
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.length * ITEMS_PER_PAGE;
            const totalCount = lastPage.total_count || 0;

            if (totalFetched < totalCount) {
                return allPages.length + 1;
            }
            return undefined;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes cache
        initialPageParam: 1,
    });

    // Flatten all pages into one array
    const allSpaces = data?.pages?.flatMap(page =>
        (page.units || [])
            .filter(unit => unit.is_active === true)
            .map(unit => {
                const image = getUnitImage(unit);
                return {
                    id: unit.id,
                    unit_id: unit.id,
                    title: unit.name || "Meeting Room",
                    location: unit.city || unit.space_city || "Coworking Space",
                    price: getBestRate(unit),
                    days: 1,
                    rating: 4.6,
                    reviews: 0,
                    images: image ? [image] : null,
                    unit_type: unit.unit_type,
                    total_capacity: unit.total_capacity,
                    hourly_rate: unit.hourly_rate,
                    daily_rate: unit.daily_rate,
                    monthly_rate: unit.monthly_rate
                };
            })
    ) || [];

    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        navigate(`/meeting-rooms/${id}`);
    };

    const handleFavoriteToggle = (unitId, isLiked) => {
        console.log(`Favorite toggled for ${unitId}: ${isLiked}`);
    };

    // Loading state
    if (isLoading) {
        return (
            <section className="Meeting_Rooms_section">
                <div className="Meeting_Rooms_container">
                    <div className="circle-spinner"></div>
                    <p style={{ marginTop: '16px', color: '#666' }}>Loading meeting rooms...</p>
                </div>
            </section>
        );
    }

    // Error state
    if (isError) {
        return (
            <section className="Meeting_Rooms_section">
                <div className="Meeting_Rooms_container">
                    <h3>Unable to load meeting rooms</h3>
                    <p style={{ color: '#666', marginBottom: '12px' }}>
                        {error?.message || 'Something went wrong'}
                    </p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Try Again
                    </button>
                </div>
            </section>
        );
    }

    // Empty state
    if (allSpaces.length === 0) {
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
                        className="Meeting_Rooms_slider"
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
                            <SwiperSlide key={space.id} className="Meeting_Rooms_slide">
                                <div className="Meeting_Rooms_card">
                                    <SpaceCard
                                        id={space.id}
                                        unit_id={space.unit_id}
                                        image={space.images}
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

                        {isFetchingNextPage && (
                            <SwiperSlide className="Meeting_Rooms_slide loading-slide">
                                <div className="loading-more-container">
                                    <div className="circle-spinner-small"></div>
                                    <p>Loading more rooms...</p>
                                </div>
                            </SwiperSlide>
                        )}
                    </Swiper>
                </div>

                {hasNextPage && !isFetchingNextPage && allSpaces.length > 0 && (
                    <div className="load-more-container">
                        <button onClick={loadMore} className="load-more-btn">
                            Load More Rooms
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Meeting_Rooms;