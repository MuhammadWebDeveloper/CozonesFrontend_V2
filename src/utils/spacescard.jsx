// SpaceCard.jsx - Simple circle loader only
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
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [currentImage, setCurrentImage] = useState(null);

    // Get image URL - only first image
    const getImageUrl = () => {
        if (!image) return null;

        let img = Array.isArray(image) ? image[0] : image;

        if (typeof img === 'object' && img.image_base64) {
            img = img.image_base64;
        }

        if (typeof img === 'string' && img.startsWith('data:application/octet-stream')) {
            img = img.replace('data:application/octet-stream', 'data:image/jpeg');
        }

        return img || null;
    };

    const imageUrl = getImageUrl();

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

    // Preload image when URL changes
    useEffect(() => {
        if (imageUrl) {
            // Image prop has arrived — start preloading
            setIsImageLoading(true);
            setImageError(false);
            setCurrentImage(null); // reset so spinner stays visible while preloading

            const img = new Image();
            img.onload = () => {
                setCurrentImage(imageUrl);
                setIsImageLoading(false);
            };
            img.onerror = () => {
                setImageError(true);
                setIsImageLoading(false);
            };
            img.src = imageUrl;
        } else {
            // No image prop yet — don't mark as "done loading"
            // spinner stays via: !currentImage && !imageError
            setIsImageLoading(false);
        }
    }, [imageUrl]);

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

    // Show spinner when:
    // 1. Actively preloading a known URL, OR
    // 2. Image prop hasn't arrived yet (null) and no error
    const showSpinner = isImageLoading || (!currentImage && !imageError);

    return (
        <div className={`Cozones_Spaces_main ${className}`} onClick={handleCardClick}>
            {/* IMAGE SECTION */}
            <div className="Cozones_Spaces_imageContainer" style={{ position: 'relative', backgroundColor: '#f5f5f5' }}>

                {/* Circle spinner — shows while waiting for image prop OR while preloading */}
                {showSpinner && <div className="image-circle-spinner"></div>}

                {/* Image — only renders once fully preloaded */}
                {currentImage && !showSpinner && (
                    <img
                        src={currentImage}
                        alt={title}
                        className="Cozones_Spaces_image"
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Fallback — only when image fails to load */}
                {imageError && (
                    <img
                        src="https://via.placeholder.com/400x300?text=No+Image"
                        alt={title}
                        className="Cozones_Spaces_image"
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
                        fill={isLiked ? "#ff4d4f" : "rgba(0, 0, 0, 0.5)"}
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

                    {/* <span className="Cozones_Spaces_divider">·</span> */}

                    {/* <div className="Cozones_Spaces_ratingRow">
                        <FiStar size={12} fill="currentColor" />
                        <span>{rating ? rating.toFixed(1) : "4.5"}</span>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default SpaceCard;