// PrivateCabinsDetail.jsx - Fixed Image Slider with Complete Space Details
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../componentstyles/utilstyle/privateCabinsDetail.css';

const PrivateCabinsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState({});
    const [activeTab, setActiveTab] = useState('start');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const apiClient = axios.create({
        baseURL: 'http://localhost:4343/',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    useEffect(() => {
        const fetchPrivateCabin = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`api/spaces/unit/${id}`);

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;

                    let rateType = 'daily';
                    if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999) {
                        rateType = 'hourly';
                    } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999) {
                        rateType = 'daily';
                    } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999) {
                        rateType = 'monthly';
                    }

                    // Parse images properly - handle JSON string or array
                    let parsedImages = [];
                    if (unitData.images) {
                        if (typeof unitData.images === 'string') {
                            try {
                                const parsed = JSON.parse(unitData.images);
                                parsedImages = Array.isArray(parsed) ? parsed : [parsed];
                            } catch (e) {
                                parsedImages = [unitData.images];
                            }
                        } else if (Array.isArray(unitData.images)) {
                            parsedImages = unitData.images;
                        }
                    }

                    // Parse space amenities
                    let parsedAmenities = unitData.space_amenities || {};
                    if (typeof parsedAmenities === 'string') {
                        try {
                            parsedAmenities = JSON.parse(parsedAmenities);
                        } catch (e) {
                            parsedAmenities = {};
                        }
                    }

                    // Parse policies
                    let parsedPolicies = unitData.policies || {};
                    if (typeof parsedPolicies === 'string') {
                        try {
                            parsedPolicies = JSON.parse(parsedPolicies);
                        } catch (e) {
                            parsedPolicies = {};
                        }
                    }

                    const transformedSpace = {
                        id: unitData.id,
                        name: unitData.name,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Private Cabin",
                        description: unitData.space?.description || "A premium private cabin in a professional coworking space",
                        location: unitData.space?.city || "Coworking Space",
                        area: unitData.space?.area,
                        address: unitData.space?.address,
                        city: unitData.space?.city,
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
                        total_capacity: unitData.total_capacity,
                        unit_type: unitData.unit_type,
                        images: parsedImages,
                        space: unitData.space,
                        space_amenities: parsedAmenities,
                        policies: parsedPolicies,
                        is_active: unitData.is_active,
                        created_at: unitData.created_at,
                        updated_at: unitData.updated_at
                    };

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    setCurrentImage(0);
                    setLoadedImages({});
                } else {
                    console.error('Unit not found');
                }
            } catch (err) {
                console.error('Error fetching private cabin:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPrivateCabin();
        }
    }, [id]);

    // ✅ FIXED: Properly handle Base64 images, URLs, and file paths
    const getImages = useCallback(() => {
        if (space?.images && space.images.length > 0) {
            return space.images
                .filter(img => img && img !== '' && img !== 'null' && img !== 'undefined')
                .map(img => {
                    // If it's already a valid URL (http/https)
                    if (img && (img.startsWith('http://') || img.startsWith('https://'))) {
                        return img;
                    }
                    // If it's a Base64 data URL
                    if (img && img.startsWith('data:image')) {
                        return img;
                    }
                    // If it's a raw Base64 string (without data:image prefix)
                    if (img && !img.startsWith('http') && !img.startsWith('/') && img.length > 100) {
                        // Check if it looks like Base64 (alphanumeric + /+=)
                        if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 100))) {
                            return `data:image/jpeg;base64,${img}`;
                        }
                        return img;
                    }
                    // If it's a relative path starting with /
                    if (img && img.startsWith('/')) {
                        return `http://localhost:4343${img}`;
                    }
                    // If it's a relative path without leading slash
                    if (img && !img.startsWith('http') && !img.startsWith('data:')) {
                        return `http://localhost:4343/uploads/${img}`;
                    }
                    return img;
                });
        }
        
        // Fallback images based on unit type
        return ['https://images.unsplash.com/photo-1497366811357-69a6f18a0b1a'];
    }, [space]);

    const images = getImages();

    // Preload images efficiently
    useEffect(() => {
        if (images && images.length > 0) {
            images.forEach((src, index) => {
                const img = new Image();
                img.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [index]: true }));
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src?.substring(0, 100)}...`);
                    setLoadedImages(prev => ({ ...prev, [index]: false }));
                };
                img.src = src;
            });
        }
    }, [images]);

    // Preload adjacent images for faster navigation
    const preloadAdjacentImages = useCallback((currentIdx) => {
        if (images.length === 0) return;
        const nextIdx = (currentIdx + 1) % images.length;
        const prevIdx = (currentIdx - 1 + images.length) % images.length;

        [nextIdx, prevIdx].forEach(idx => {
            if (!loadedImages[idx] && images[idx]) {
                const img = new Image();
                img.src = images[idx];
                img.onload = () => {
                    setLoadedImages(prev => ({ ...prev, [idx]: true }));
                };
            }
        });
    }, [images, loadedImages]);

    // Preload adjacent images when current image changes
    useEffect(() => {
        if (images.length > 0) {
            preloadAdjacentImages(currentImage);
        }
    }, [currentImage, preloadAdjacentImages, images.length]);

    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const nextIdx = (currentImage + 1) % images.length;
        setCurrentImage(nextIdx);
        if (loadedImages[nextIdx]) {
            setTimeout(() => setImageLoading(false), 100);
        }
    }, [currentImage, images.length, loadedImages]);

    const prevImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const prevIdx = (currentImage - 1 + images.length) % images.length;
        setCurrentImage(prevIdx);
        if (loadedImages[prevIdx]) {
            setTimeout(() => setImageLoading(false), 100);
        }
    }, [currentImage, images.length, loadedImages]);

    const goToImage = (index) => {
        if (index >= 0 && index < images.length && index !== currentImage) {
            setImageLoading(true);
            setCurrentImage(index);
            if (loadedImages[index]) {
                setTimeout(() => setImageLoading(false), 100);
            }
        }
    };

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        if (isLeftSwipe) nextImage();
        if (isRightSwipe) prevImage();
        setTouchStart(0);
        setTouchEnd(0);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') prevImage();
            else if (e.key === 'ArrowRight') nextImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextImage, prevImage]);

    const calcHours = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    };

    const calcDays = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    };

    const calcMonths = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return Math.max(0, monthDiff);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    };

    const getRateDisplay = () => {
        if (!space) return { rate: 0, unit: 'day' };
        switch (selectedRateType) {
            case 'hourly': return { rate: space.hourly_rate, unit: 'hour' };
            case 'daily': return { rate: space.daily_rate, unit: 'day' };
            case 'monthly': return { rate: space.monthly_rate, unit: 'month' };
            default: return { rate: space.daily_rate, unit: 'day' };
        }
    };

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours() * (space?.hourly_rate || 0);
            case 'daily': return calcDays() * (space?.daily_rate || 0);
            case 'monthly': return calcMonths() * (space?.monthly_rate || 0);
            default: return calcDays() * (space?.daily_rate || 0);
        }
    };

    const getQuantity = () => {
        if (!startDate || !endDate) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours();
            case 'daily': return calcDays();
            case 'monthly': return Math.max(1, calcMonths());
            default: return calcDays();
        }
    };

    const getUnitLabel = () => {
        const qty = getQuantity();
        switch (selectedRateType) {
            case 'hourly': return qty === 1 ? 'hour' : 'hours';
            case 'daily': return qty === 1 ? 'night' : 'nights';
            case 'monthly': return qty === 1 ? 'month' : 'months';
            default: return qty === 1 ? 'night' : 'nights';
        }
    };

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();

    const renderAmenities = () => {
        const amenities = space?.space_amenities || {};
        const amenityList = [];
        if (amenities.wifi) amenityList.push('✓ High-Speed WiFi');
        if (amenities.ac) amenityList.push('❄️ Air Conditioning');
        if (amenities.coffee) amenityList.push('☕ Free Coffee & Tea');
        if (amenities.printer) amenityList.push('🖨️ Printer & Scanner');
        if (amenities.parking) amenityList.push('🅿️ Parking');
        if (amenities.security) amenityList.push('🔒 24/7 Security');
        if (amenities.backup_power) amenityList.push('⚡ Backup Power');
        return amenityList;
    };

    const getAvailableRateTypes = () => {
        const types = [];
        if (space?.hourly_rate && space.hourly_rate > 0 && space.hourly_rate !== -999) {
            types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
        }
        if (space?.daily_rate && space.daily_rate > 0 && space.daily_rate !== -999) {
            types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
        }
        if (space?.monthly_rate && space.monthly_rate > 0 && space.monthly_rate !== -999) {
            types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
        }
        return types;
    };

    if (loading) {
        return (
            <div className="PrivateCabinsDetail_loading">
                <div className="PrivateCabinsDetail_spinner"></div>
                <p>Loading private cabin details...</p>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="PrivateCabinsDetail_loading">
                <p>Private cabin not found.</p>
                <button onClick={() => navigate('/private-cabins')} className="PrivateCabinsDetail_back-btn">Go Back</button>
            </div>
        );
    }

    return (
        <div className="PrivateCabinsDetail_page">
            <button className="PrivateCabinsDetail_back-btn" onClick={() => navigate('/')}>
                ← Back to spaces
            </button>

            <h2 className="PrivateCabinsDetail_page-title">Private Cabin Details</h2>

            {space.unit_type && (
                <div className="PrivateCabinsDetail_badge">
                    {space.unit_type.replace('_', ' ').toUpperCase()}
                </div>
            )}

            <div className="PrivateCabinsDetail_top-grid">
                <div className="PrivateCabinsDetail_left">
                    <h1 className="PrivateCabinsDetail_title">{space.title}</h1>

                    <p className="PrivateCabinsDetail_meta">
                        📍 {space.city}, {space.area}
                        {space.address && <span> - {space.address}</span>}
                    </p>

                    {space.total_capacity && (
                        <p className="PrivateCabinsDetail_meta">
                            👥 Capacity: {space.total_capacity} people
                        </p>
                    )}

                    <p className="PrivateCabinsDetail_meta">
                        Availability: <span className="PrivateCabinsDetail_available">
                            {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
                        </span>
                    </p>

                    {getAvailableRateTypes().length > 1 && (
                        <div className="PrivateCabinsDetail_rate_selector">
                            <label>Select Pricing Plan:</label>
                            <div className="PrivateCabinsDetail_rate_options">
                                {getAvailableRateTypes().map(type => (
                                    <button
                                        key={type.key}
                                        className={`PrivateCabinsDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                        onClick={() => setSelectedRateType(type.key)}
                                    >
                                        {type.label}
                                        <span className="PrivateCabinsDetail_rate_amount">
                                            {type.rate.toLocaleString()} PKR
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="PrivateCabinsDetail_pricing">
                        <p className="PrivateCabinsDetail_price">
                            {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
                        </p>
                        {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
                            <p className="PrivateCabinsDetail_note">
                                💡 Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
                            </p>
                        )}
                        {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
                            <p className="PrivateCabinsDetail_note">
                                💡 Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
                            </p>
                        )}
                    </div>

                    <div className="PrivateCabinsDetail_tabs">
                        <button
                            className={`PrivateCabinsDetail_tab ${activeTab === 'start' ? 'active' : ''}`}
                            onClick={() => setActiveTab('start')}
                        >
                            Starting Date
                        </button>
                        <button
                            className={`PrivateCabinsDetail_tab ${activeTab === 'end' ? 'active' : ''}`}
                            onClick={() => setActiveTab('end')}
                        >
                            Ending Date
                        </button>
                    </div>

                    <div className="PrivateCabinsDetail_date-input-wrap">
                        {activeTab === 'start' ? (
                            <input
                                type="date"
                                className="PrivateCabinsDetail_date-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        ) : (
                            <input
                                type="date"
                                className="PrivateCabinsDetail_date-input"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        )}
                    </div>

                    {startDate && endDate && (
                        <div className="PrivateCabinsDetail_summary">
                            <div className="PrivateCabinsDetail_summary-row">
                                <span>Starting Date</span>
                                <span>{formatDate(startDate)}</span>
                            </div>
                            <div className="PrivateCabinsDetail_summary-row">
                                <span>Ending Date</span>
                                <span>{formatDate(endDate)}</span>
                            </div>
                            <div className="PrivateCabinsDetail_summary-row">
                                <span>{rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}</span>
                                <span>PKR {total.toLocaleString()}</span>
                            </div>
                            <div className="PrivateCabinsDetail_summary-row PrivateCabinsDetail_summary-total">
                                <span>Total</span>
                                <span>PKR {total.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <button
                        className="PrivateCabinsDetail_continue-btn"
                        disabled={!startDate || !endDate}
                    >
                        Continue to Booking
                    </button>
                </div>

                {/* IMAGE SLIDER SECTION - FIXED FOR BASE64 */}
                <div className="PrivateCabinsDetail_right">
                    <div
                        className="PrivateCabinsDetail_gallery"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {images.length > 0 && images[0] ? (
                            <>
                                {imageLoading && !loadedImages[currentImage] && (
                                    <div className="PrivateCabinsDetail_image_loader">
                                        <div className="PrivateCabinsDetail_spinner_small"></div>
                                    </div>
                                )}

                                <img
                                    key={currentImage}
                                    src={images[currentImage]}
                                    alt={`${space.title} - Image ${currentImage + 1}`}
                                    className={`PrivateCabinsDetail_main-img ${imageLoading && !loadedImages[currentImage] ? 'hidden' : 'visible'}`}
                                    onLoad={() => {
                                        setImageLoading(false);
                                        setLoadedImages(prev => ({ ...prev, [currentImage]: true }));
                                    }}
                                    onError={(e) => {
                                        console.error('Image failed to load');
                                        e.target.src = 'https://images.unsplash.com/photo-1497366811357-69a6f18a0b1a';
                                        setImageLoading(false);
                                    }}
                                />

                                {images.length > 1 && (
                                    <>
                                        <button
                                            className="PrivateCabinsDetail_img-nav PrivateCabinsDetail_prev"
                                            onClick={prevImage}
                                            aria-label="Previous image"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className="PrivateCabinsDetail_img-nav PrivateCabinsDetail_next"
                                            onClick={nextImage}
                                            aria-label="Next image"
                                        >
                                            ›
                                        </button>
                                        <div className="PrivateCabinsDetail_img-counter">
                                            {currentImage + 1} / {images.length}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="PrivateCabinsDetail_no-img">
                                <img 
                                    src="https://images.unsplash.com/photo-1497366811357-69a6f18a0b1a" 
                                    alt="Fallback"
                                    className="PrivateCabinsDetail_main-img"
                                />
                            </div>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="PrivateCabinsDetail_thumbnails">
                            {images.slice(0, 6).map((img, i) => (
                                <div
                                    key={i}
                                    className={`PrivateCabinsDetail_thumb_wrapper ${i === currentImage ? 'active' : ''}`}
                                    onClick={() => goToImage(i)}
                                >
                                    <img
                                        src={img}
                                        alt={`Thumbnail ${i + 1}`}
                                        className="PrivateCabinsDetail_thumb"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1497366811357-69a6f18a0b1a';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="PrivateCabinsDetail_bottom">
                <div className="PrivateCabinsDetail_section">
                    <h3 className="PrivateCabinsDetail_section-title">About this space</h3>
                    <p className="PrivateCabinsDetail_description">
                        {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
                    </p>
                </div>

                {space.space?.opening_time && space.space?.closing_time && (
                    <div className="PrivateCabinsDetail_section">
                        <h3 className="PrivateCabinsDetail_section-title">Working Hours</h3>
                        <p className="PrivateCabinsDetail_working_hours">
                            🕐 {space.space.opening_time} - {space.space.closing_time}
                        </p>
                        {space.space.working_days && (
                            <p className="PrivateCabinsDetail_working_days">
                                📅 {space.space.working_days.join(', ')}
                            </p>
                        )}
                    </div>
                )}

                {renderAmenities().length > 0 && (
                    <div className="PrivateCabinsDetail_section">
                        <h3 className="PrivateCabinsDetail_section-title">Amenities</h3>
                        <div className="PrivateCabinsDetail_features">
                            {renderAmenities().map((item, i) => (
                                <span key={i} className="PrivateCabinsDetail_feature-tag">{item}</span>
                            ))}
                        </div>
                    </div>
                )}

                {space.space && (
                    <div className="PrivateCabinsDetail_section">
                        <h3 className="PrivateCabinsDetail_section-title">Space Information</h3>
                        <div className="PrivateCabinsDetail_space_info">
                            <p><strong>🏢 Space Name:</strong> {space.space.name}</p>
                            <p><strong>📌 Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
                            {space.total_capacity && <p><strong>👥 Total Capacity:</strong> {space.total_capacity} seats</p>}
                            {space.space.is_verified && <p className="verified">✓ Verified Space</p>}
                        </div>
                    </div>
                )}

                {space.policies && (space.policies.cancellation || space.policies.refund || space.policies.late_arrival) && (
                    <div className="PrivateCabinsDetail_section">
                        <h3 className="PrivateCabinsDetail_section-title">Policies</h3>
                        <div className="PrivateCabinsDetail_policies">
                            {space.policies.cancellation && <p><strong>❌ Cancellation:</strong> {space.policies.cancellation}</p>}
                            {space.policies.refund && <p><strong>💰 Refund:</strong> {space.policies.refund}</p>}
                            {space.policies.late_arrival && <p><strong>⏰ Late Arrival:</strong> {space.policies.late_arrival}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrivateCabinsDetail;