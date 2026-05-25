// SpaceCard.jsx (Fixed version)
import React, { useState, useEffect } from 'react';
import { FiHeart, FiStar } from 'react-icons/fi';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { toggleFavorite, checkFavorite } from '../sitecomponents/favrioutes/favorite.apiservices.jsx'; // Import checkFavorite

import "swiper/css";
import "swiper/css/navigation";

import '../componentstyles/utilstyle/viewcard.css';

const SpaceCard = ({
    id,           // space_id (for reference only, not used for favorites)
    unit_id,      // ✅ unit_id - USE THIS FOR FAVORITES
    image,
    title,
    location,
    rating,
    price,
    nights,
    isFavorite: propIsFavorite = false,
    onFavoriteClick,
    onCardClick,
    className = ""
}) => {

    const [isLiked, setIsLiked] = useState(propIsFavorite);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ FIXED: Check favorite status using unit_id
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token || !unit_id) return;  // ✅ Use unit_id

            try {
                const response = await checkFavorite(unit_id);  // ✅ Use unit_id
                if (response.success) {
                    setIsLiked(response.isFavorite);
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };

        checkFavoriteStatus();
    }, [unit_id]);  // ✅ Depend on unit_id

    // ✅ FIXED: Toggle favorite using unit_id
    const handleFavoriteClick = async (e) => {
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        setIsLoading(true);

        try {
            const response = await toggleFavorite(unit_id);  // ✅ Use unit_id, NOT id

            if (response.success) {
                setIsLiked(response.isFavorite);  // ✅ Use isFavorite from response
                if (onFavoriteClick) {
                    onFavoriteClick(unit_id, response.isFavorite);  // ✅ Pass unit_id
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Navigate using unit_id
    const handleCardClick = () => {
        if (onCardClick) onCardClick(unit_id || id);
    };

    const images = Array.isArray(image) ? image : [image];

    return (
        <div className={`Cozones_Spaces_main ${className}`} onClick={handleCardClick}>
            {/* IMAGE SECTION */}
            <div className="Cozones_Spaces_imageContainer">
                {images.length > 1 ? (
                    <Swiper
                        modules={[Navigation]}
                        navigation={true}
                        className="Cozones_Spaces_swiper"
                    >
                        {images.map((img, index) => (
                            <SwiperSlide key={index}>
                                <img
                                    src={img}
                                    alt={title}
                                    className="Cozones_Spaces_image"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400';
                                    }}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                ) : (
                    <img
                        src={images[0]}
                        alt={title}
                        className="Cozones_Spaces_image"
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400';
                        }}
                    />
                )}

                {/* Favorite Button */}
                <button
                    className="Cozones_Spaces_favBtn"
                    onClick={handleFavoriteClick}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                >
                    <FiHeart
                        size={24}
                        stroke="white"
                        strokeWidth={2}
                        fill={isLiked ? "white" : "rgba(0, 0, 0, 0.5)"}
                    />
                </button>
            </div>

            {/* CONTENT SECTION */}
            <div className="Cozones_Spaces_info">
                <h3 className="Cozones_Spaces_title">
                    {title} in {location}
                </h3>

                <div className="Cozones_Spaces_meta">
                    <span className="Cozones_Spaces_price">
                        {price} for {nights} Day
                    </span>

                    <span className="Cozones_Spaces_divider">·</span>

                    <div className="Cozones_Spaces_ratingRow">
                        <FiStar size={12} fill="currentColor" />
                        <span>{rating ? rating.toFixed(1) : "0.0"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceCard;