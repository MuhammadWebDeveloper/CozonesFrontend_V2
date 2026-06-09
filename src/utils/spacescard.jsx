// SpaceCard.jsx (Fixed - Single Image Only, No Navigation Buttons)
import React, { useState, useEffect } from 'react';
import { FiHeart, FiStar } from 'react-icons/fi';
import { toggleFavorite, checkFavorite } from '../sitecomponents/favrioutes/favorite.apiservices.jsx';

import '../componentstyles/utilstyle/viewcard.css';


const SpaceCard = ({
    id,
    unit_id,
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
    const [imageErrors, setImageErrors] = useState({});

    // Get image URLs - always returns array of strings
    const getImageUrls = () => {
        if (!image) return ['https://via.placeholder.com/400x300?text=No+Image'];

        let imagesArray = Array.isArray(image) ? image : [image];

        imagesArray = imagesArray.map(img => {
            if (typeof img === 'object' && img.image_base64) {
                return img.image_base64;
            }
            return img;
        });

        return imagesArray.length > 0 ? imagesArray : ['https://via.placeholder.com/400x300?text=No+Image'];
    };

    const images = getImageUrls();
    // Show only the first image
    const displayImage = images[0];

    // Check favorite status
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token || !unit_id) return;

            try {
                const response = await checkFavorite(unit_id);
                if (response.success) {
                    setIsLiked(response.isFavorite);
                }
            } catch (error) {
                console.error('Error checking favorite status:', error);
            }
        };

        checkFavoriteStatus();
    }, [unit_id]);

    // Toggle favorite
    const handleFavoriteClick = async (e) => {
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        setIsLoading(true);

        try {
            const response = await toggleFavorite(unit_id);
            if (response.success) {
                setIsLiked(response.isFavorite);
                if (onFavoriteClick) {
                    onFavoriteClick(unit_id, response.isFavorite);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Navigate
    const handleCardClick = () => {
        if (onCardClick) {
            onCardClick(unit_id || id);
        }
    };

    // Handle image error
    const handleImageError = () => {
        setImageErrors(prev => ({
            ...prev,
            [0]: true
        }));
    };

    // Get current image source (always first image)
    const getCurrentImageSrc = () => {
        if (imageErrors[0]) {
            return 'https://via.placeholder.com/400x300?text=Image+Error';
        }
        return displayImage;
    };

    return (
        <div className={`Cozones_Spaces_main ${className}`} onClick={handleCardClick}>
            {/* IMAGE SECTION */}
            <div className="Cozones_Spaces_imageContainer">
                {/* Single Image Display - Only First Image */}
                <img
                    src={getCurrentImageSrc()}
                    alt={title}
                    className="Cozones_Spaces_image"
                    onError={handleImageError}
                />

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
                    {title}{location ? `, ${location}` : ''}
                </h3>

                <div className="Cozones_Spaces_meta">
                    <span className="Cozones_Spaces_price">
                        {price}
                    </span>

                    <span className="Cozones_Spaces_divider">·</span>

                    <div className="Cozones_Spaces_ratingRow">
                        <FiStar size={12} fill="currentColor" />
                        <span>{rating ? rating.toFixed(1) : "4.5"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceCard;