// SpaceDetail.jsx - Updated with Booking Dates Integration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../componentstyles/utilstyle/SpaceDetail.css';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import DateTimePicker from './DateTimePicker';
import BaseUrl from './AppConstants';

// Image Component with lazy loading, skeleton, and FIXED dimensions
const LazyImage = ({ src, alt, className, onError }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => {
                            setIsLoading(false);
                            if (imgRef.current) {
                                imgRef.current.src = src;
                            }
                        };
                        img.onerror = () => {
                            setIsLoading(false);
                            setError(true);
                            if (onError) onError();
                        };
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '50px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src, onError]);

    return (
        <div className="lazy-image-container" style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '400px',
            maxHeight: '500px',
            backgroundColor: '#f5f5f5',
            overflow: 'hidden'
        }}>
            {isLoading && (
                <div className="image-skeleton" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px'
                }}>
                    <div className="skeleton-content" style={{
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        <div className="loading-spinner-small"></div>
                        <span style={{ marginTop: '8px', fontSize: '12px' }}>Loading image...</span>
                    </div>
                </div>
            )}
            <img
                ref={imgRef}
                alt={alt}
                className={className}
                style={{
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out',
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    maxHeight: '500px',
                    objectFit: 'cover',
                    objectPosition: 'center'
                }}
                onError={(e) => {
                    setError(true);
                    setIsLoading(false);
                    if (onError) onError(e);
                }}
            />
            {error && !isLoading && (
                <div className="image-error-fallback" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f5f5f5',
                    borderRadius: '12px'
                }}>
                    <span>📷 Failed to load</span>
                </div>
            )}
        </div>
    );
};

// Thumbnail component with FIXED dimensions
const LazyThumbnail = ({ src, alt, className, onClick, isActive }) => {
    const [isLoading, setIsLoading] = useState(true);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        setIsLoading(false);
                        if (imgRef.current) {
                            imgRef.current.src = src;
                        }
                    };
                    observer.disconnect();
                }
            },
            { rootMargin: '20px' }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, [src]);

    return (
        <div
            className={`thumbnail-wrapper ${isActive ? 'active' : ''}`}
            onClick={onClick}
            style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                flexShrink: 0,
                cursor: 'pointer'
            }}
        >
            {isLoading && (
                <div className="thumbnail-skeleton" style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: '8px'
                }} />
            )}
            <img
                ref={imgRef}
                src={isLoading ? undefined : src}
                alt={alt}
                className={className}
                style={{
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #01095A' : '2px solid transparent',
                    boxSizing: 'border-box'
                }}
            />
        </div>
    );
};

const SpaceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imagesLoading, setImagesLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [currentImage, setCurrentImage] = useState(0);
    // FIXED: Using consistent state names for dates
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);

    // ✅ NEW: States for booking dates
    const [bookedDates, setBookedDates] = useState([]);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Axios instance
    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 60000,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    // Add token to requests
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Get current user info
    useEffect(() => {
        const getUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await apiClient.get('api/auth/profile');
                    setUser(response.data.user);
                    success('Welcome back! 👋');
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
        };
        getUser();
    }, []);

    // Load dates from location state
    useEffect(() => {
        const { state } = location;
        if (state?.prefillStartDate && state?.prefillEndDate) {
            setStartDateTime(state.prefillStartDate);
            setEndDateTime(state.prefillEndDate);
            if (state.fromBookAgain) {
                info('📅 Previous booking dates loaded. You can modify them or select new dates to book again.');
            }
        }
    }, [location]);

    // SpaceDetail.jsx - Update the fetchBookingDates function

    // ✅ NEW: Fetch booking dates function - FIXED URL
    // In SpaceDetail.jsx - Replace the fetchBookingDates function with this

    // ✅ NEW: Fetch booking dates function - FIXED URL
    const fetchBookingDates = async () => {
        if (!id) return;

        try {
            setLoadingBookings(true);
            console.log('📅 Fetching booking dates for unit:', id);

            // ✅ FIXED: Use the correct endpoint from spaces routes
            const response = await apiClient.get(`api/spaces/unit/${id}/calendar-dates`);

            if (response.data?.success) {
                const data = response.data.data;
                setBookedDates(data.bookedDates || []);
                setBookingDetails(data.details || null);

                console.log('✅ Booked dates loaded:', data.bookedDates?.length || 0, 'dates');

                if (data.bookedDates && data.bookedDates.length > 0) {
                    info(`📅 ${data.bookedDates.length} dates are already booked`);
                }
            } else {
                setBookedDates([]);
                setBookingDetails(null);
            }
        } catch (err) {
            console.error('❌ Error fetching booking dates:', err);
            setBookedDates([]);
            setBookingDetails(null);

            // Only show error toast if it's not a 404 (which is expected if no bookings exist)
            if (err.response?.status !== 404) {
                error('Failed to load booking dates. Please refresh the page.');
            }
        } finally {
            setLoadingBookings(false);
        }
    };
    // Load space details first (without images)
    useEffect(() => {
        const fetchSpaceDetails = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`api/spaces/unit/${id}`);

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;

                    // Determine rate type
                    let rateType = 'daily';
                    const hasHourly = unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999;
                    const hasDaily = unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999;
                    const hasMonthly = unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999;

                    if (hasHourly) rateType = 'hourly';
                    else if (hasDaily) rateType = 'daily';
                    else if (hasMonthly) rateType = 'monthly';

                    // Get owner_id
                    let ownerId = null;
                    if (unitData.owner_id) {
                        ownerId = unitData.owner_id;
                    } else if (unitData.space?.owner_id) {
                        ownerId = unitData.space.owner_id;
                    } else if (unitData.space_owner_id) {
                        ownerId = unitData.space_owner_id;
                    }

                    const transformedSpace = {
                        id: unitData.id,
                        space_id: unitData.space_id,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Workspace",
                        description: unitData.space_description || "A comfortable workspace with all necessary amenities",
                        unit_type: unitData.unit_type,
                        total_capacity: unitData.total_capacity,
                        is_active: unitData.is_active !== false,
                        city: unitData.city || 'City not specified',
                        area: unitData.area,
                        address: unitData.address || 'Address not specified',
                        latitude: unitData.latitude,
                        longitude: unitData.longitude,
                        opening_time: unitData.opening_time,
                        closing_time: unitData.closing_time,
                        working_days: unitData.working_days || [],
                        space_name: unitData.space_name,
                        space_description: unitData.space_description,
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
                        has_wifi: unitData.has_wifi || false,
                        has_ac: unitData.has_ac || false,
                        has_coffee: unitData.has_coffee || false,
                        has_printer: unitData.has_printer || false,
                        has_parking: unitData.has_parking || false,
                        has_security: unitData.has_security || false,
                        has_backup_power: unitData.has_backup_power || false,
                        owner_id: ownerId
                    };

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    success('Space details loaded successfully! 🎉');

                    // ✅ NEW: Fetch booking dates after space is loaded
                    await fetchBookingDates();

                    // After space details are loaded, fetch images separately
                    fetchImages();
                } else {
                    console.error('Invalid response structure:', response.data);
                    error('Space not found or invalid data structure');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching space:', err);
                let errorMessage = 'Failed to load space details. Please try again.';
                if (err.response?.status === 404) {
                    errorMessage = 'Space not found. It may have been removed.';
                } else if (err.response?.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (err.code === 'ECONNABORTED') {
                    errorMessage = 'Request timeout. Please check your connection.';
                } else if (err.message === 'Network Error') {
                    errorMessage = 'Network error. Please check if the server is running.';
                }
                error(errorMessage);
                setLoading(false);
            }
        };

        // Fetch images separately
        const fetchImages = async () => {
            try {
                setImagesLoading(true);
                const response = await apiClient.get(`api/spaces/unit/${id}/images`);

                if (response.data?.success && response.data?.images) {
                    let imagesArray = response.data.images
                        .filter(img => img.image_base64)
                        .map(img => img.image_base64);

                    // If no images, use fallback
                    if (imagesArray.length === 0 && space) {
                        const fallbackImages = {
                            'open_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'dedicated_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'private_cabin': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'meeting_room': 'https://images.unsplash.com/photo-1497366216548-37526070297c'
                        };
                        imagesArray = [fallbackImages[space?.unit_type] || fallbackImages.open_desk];
                    }

                    setImages(imagesArray);
                }
            } catch (err) {
                console.error('Error fetching images:', err);
                // Set fallback images
                if (space) {
                    const fallbackImages = {
                        'open_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                        'dedicated_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                        'private_cabin': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                        'meeting_room': 'https://images.unsplash.com/photo-1497366216548-37526070297c'
                    };
                    setImages([fallbackImages[space.unit_type] || fallbackImages.open_desk]);
                }
            } finally {
                setImagesLoading(false);
                setLoading(false);
            }
        };

        if (id) {
            fetchSpaceDetails();
        } else {
            error('No space ID provided');
            setLoading(false);
        }
    }, [id]);

    // Image navigation functions
    const nextImage = () => {
        if (images.length > 0) {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (images.length > 0) {
            setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    const isOwnSpace = () => {
        if (!user || !space) return false;
        return user.id === space.owner_id;
    };

    const getRateDisplay = () => {
        if (!space) return { rate: 0, unit: 'day', value: 0 };
        switch (selectedRateType) {
            case 'hourly': return { rate: space.hourly_rate, unit: 'hour', value: space.hourly_rate || 0 };
            case 'daily': return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
            case 'monthly': return { rate: space.monthly_rate, unit: 'month', value: space.monthly_rate || 0 };
            default: return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
        }
    };

    // FIXED: Use startDateTime and endDateTime
    const calcHours = () => {
        if (!startDateTime || !endDateTime) return 0;
        const diff = new Date(endDateTime) - new Date(startDateTime);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    };

    const calcDays = () => {
        if (!startDateTime || !endDateTime) return 0;
        const diff = new Date(endDateTime) - new Date(startDateTime);
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const calcMonths = () => {
        if (!startDateTime || !endDateTime) return 0;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return Math.max(0, monthDiff);
    };

    const calculateTotal = () => {
        if (!startDateTime || !endDateTime) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours() * (space?.hourly_rate || 0);
            case 'daily': return calcDays() * (space?.daily_rate || 0);
            case 'monthly': return calcMonths() * (space?.monthly_rate || 0);
            default: return calcDays() * (space?.daily_rate || 0);
        }
    };

    const getQuantity = () => {
        if (!startDateTime || !endDateTime) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours();
            case 'daily': return calcDays();
            case 'monthly': return calcMonths();
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

    const handleBooking = async () => {
        if (!user) {
            warning('Please login to book this space');
            setTimeout(() => navigate('/login', { state: { from: `/space/${id}` } }), 1500);
            return;
        }

        if (isOwnSpace()) {
            error('❌ You cannot book your own space! As the owner, you can edit your space instead.');
            return;
        }

        if (!startDateTime || !endDateTime) {
            warning('Please select both start and end dates');
            return;
        }

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        if (start >= end) {
            error('End time must be after start time');
            return;
        }

        const totalPrice = calculateTotal();
        if (totalPrice <= 0) {
            error('Invalid booking duration or price');
            return;
        }

        setBookingLoading(true);

        try {
            const bookingData = {
                space_unit_id: id,
                start_time: new Date(startDateTime).toISOString(),
                end_time: new Date(endDateTime).toISOString(),
                total_price: totalPrice
            };

            const response = await apiClient.post('api/bookings/createbooking', bookingData);

            if (response.data.success) {
                success(`Booking successful! Reference: ${response.data.booking.booking_ref}`, 5000);
                setTimeout(() => navigate('/my-bookings'), 2000);
            } else {
                throw new Error(response.data.message || 'Booking failed');
            }
        } catch (err) {
            console.error('Booking error:', err);
            let errorMessage = 'Failed to create booking. Please try again.';
            if (err.response?.status === 401) {
                errorMessage = 'Session expired. Please login again';
                setTimeout(() => navigate('/login'), 2000);
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            error(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    const renderAmenities = () => {
        if (!space) return [];
        const amenities = [];
        if (space.has_wifi) amenities.push('WiFi');
        if (space.has_ac) amenities.push('Air Conditioning');
        if (space.has_coffee) amenities.push('Free Coffee');
        if (space.has_printer) amenities.push('Printer');
        if (space.has_parking) amenities.push('Parking');
        if (space.has_security) amenities.push('24/7 Security');
        if (space.has_backup_power) amenities.push('Backup Power');
        return amenities;
    };

    const getAvailableRateTypes = () => {
        const types = [];
        if (space?.hourly_rate && space.hourly_rate > 0)
            types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
        if (space?.daily_rate && space.daily_rate > 0)
            types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
        if (space?.monthly_rate && space.monthly_rate > 0)
            types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
        return types;
    };

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();
    const amenities = renderAmenities();
    const availableRateTypes = getAvailableRateTypes();
    const isOwner = isOwnSpace();

    // Add CSS animations
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .loading-spinner-small {
                width: 24px;
                height: 24px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #01095A;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    if (loading && !space) return (
        <div className="SpaceDetail_loading">
            <div className="SpaceDetail_spinner"></div>
            <p>Loading space details...</p>
        </div>
    );

    if (!space) return (
        <div className="SpaceDetail_loading">
            <p>Unable to load space details.</p>
            <button onClick={() => navigate(-1)} className="SpaceDetail_back-btn">Go Back</button>
            <button onClick={() => window.location.reload()} className="SpaceDetail_retry-btn">Retry</button>
        </div>
    );

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="SpaceDetail_page">
                <button className="SpaceDetail_back-btn" onClick={() => navigate(-1)}>
                    Back to spaces
                </button>

                <h2 className="SpaceDetail_page-title">Space Details</h2>

                {isOwner && (
                    <div className="SpaceDetail_owner_warning" style={{
                        backgroundColor: '#fff3cd',
                        borderLeft: '4px solid #ffc107',
                        padding: '16px 20px',
                        marginBottom: '24px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '24px' }}>⚠️</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '4px', color: '#856404' }}>
                                You are viewing your own space
                            </strong>
                            <span style={{ color: '#856404', fontSize: '14px' }}>
                                As the owner, you cannot book this space. You can edit it from your dashboard instead.
                            </span>
                        </div>
                    </div>
                )}

                {!user && (
                    <div className="SpaceDetail_login_warning">
                        🔐 Please <button onClick={() => navigate('/login')} className="login-link">login</button> to book this space
                    </div>
                )}

                {space.unit_type && (
                    <div className="SpaceDetail_unit_badge">
                        {space.unit_type.replace('_', ' ').toUpperCase()}
                    </div>
                )}

                <div className="SpaceDetail_top-grid">
                    <div className="SpaceDetail_left">
                        <h1 className="SpaceDetail_title">{space.title}</h1>

                        <p className="SpaceDetail_meta">
                            📍 {space.city || 'City not specified'}
                            {space.area && `, ${space.area}`}
                            {space.address && <span> - {space.address}</span>}
                        </p>

                        {space.total_capacity && (
                            <p className="SpaceDetail_meta">
                                👥 Capacity: {space.total_capacity} people
                            </p>
                        )}

                        <p className="SpaceDetail_meta">
                            Availability: <span className={space.is_active ? "SpaceDetail_available" : "SpaceDetail_unavailable"}>
                                {space.is_active ? 'Available' : 'Currently Unavailable'}
                            </span>
                        </p>

                        {availableRateTypes.length > 1 && (
                            <div className="SpaceDetail_rate_selector">
                                <label>Select Pricing Plan:</label>
                                <div className="SpaceDetail_rate_options">
                                    {availableRateTypes.map(type => (
                                        <button
                                            key={type.key}
                                            className={`SpaceDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedRateType(type.key);
                                                info(`${type.label} pricing selected`);
                                            }}
                                        >
                                            {type.label}
                                            <span className="SpaceDetail_rate_amount">
                                                {type.rate.toLocaleString()} PKR
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="SpaceDetail_pricing">
                            <p className="SpaceDetail_price">
                                {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
                            </p>
                            {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
                                <p className="SpaceDetail_note">
                                    💡 Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
                                </p>
                            )}
                            {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
                                <p className="SpaceDetail_note">
                                    💡 Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
                                </p>
                            )}
                        </div>

                        <div className="SpaceDetail_datetime_section" style={{ opacity: isOwner ? 0.6 : 1 }}>
                            <h3 className="SpaceDetail_section_title">Select Date & Time</h3>

                            {/* ✅ NEW: Show booking summary if available */}
                            {bookingDetails && bookedDates.length > 0 && (
                                <div style={{
                                    background: '#f0f4ff',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                    borderLeft: '4px solid #01095A'
                                }}>
                                    <span>📅 <strong>{bookedDates.length}</strong> dates already booked</span>
                                    <span>📊 <strong>{bookingDetails.totalBookings || 0}</strong> total bookings</span>
                                    <span style={{ color: '#666', fontSize: '12px' }}>
                                        ⚡ Booked dates are disabled in calendar
                                    </span>
                                </div>
                            )}

                            {/* ✅ NEW: Show when no bookings exist */}
                            {bookingDetails && bookedDates.length === 0 && (
                                <div style={{
                                    background: '#e8f5e9',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                    borderLeft: '4px solid #2e7d32'
                                }}>
                                    <span>✅ All dates are available for booking!</span>
                                </div>
                            )}

                            <div className="SpaceDetail_datetime_grid">
                                <DateTimePicker
                                    type="start"
                                    label="Start Date & Time"
                                    value={startDateTime}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setStartDateTime(newValue);
                                        // If end date is before start date, clear it
                                        if (endDateTime && new Date(endDateTime) <= new Date(newValue)) {
                                            setEndDateTime(null);
                                            warning('End date must be after start date. Please select a new end date.');
                                        }
                                    }}
                                    minDate={new Date()}
                                    placeholder="Select start date and time"
                                    // ✅ NEW: Pass booked dates
                                    bookedDates={bookedDates}
                                    rateType={selectedRateType}
                                    unitId={id}
                                    onWarning={warning}
                                />

                                <DateTimePicker
                                    type="end"
                                    label="End Date & Time"
                                    value={endDateTime}
                                    onChange={(e) => setEndDateTime(e.target.value)}
                                    minDate={startDateTime || new Date()}
                                    startDate={startDateTime}
                                    placeholder="Select end date and time"
                                    // ✅ NEW: Pass booked dates
                                    bookedDates={bookedDates}
                                    rateType={selectedRateType}
                                    unitId={id}
                                    onWarning={warning}
                                />
                            </div>
                        </div>

                        {startDateTime && endDateTime && !isOwner && (
                            <div className="SpaceDetail_summary">
                                <div className="SpaceDetail_summary-row">
                                    <span>Starting Date</span>
                                    <span>{new Date(startDateTime).toLocaleString()}</span>
                                </div>
                                <div className="SpaceDetail_summary-row">
                                    <span>Ending Date</span>
                                    <span>{new Date(endDateTime).toLocaleString()}</span>
                                </div>
                                <div className="SpaceDetail_summary-row">
                                    <span>
                                        {rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}
                                    </span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                                <div className="SpaceDetail_summary-row SpaceDetail_summary-total">
                                    <span>Total</span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="SpaceDetail_continue-btn"
                            disabled={isOwner || !startDateTime || !endDateTime || bookingLoading || !user || !space.is_active}
                            onClick={handleBooking}
                            style={{
                                backgroundColor: isOwner ? '#6c757d' : undefined,
                                cursor: isOwner ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {bookingLoading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Processing...
                                </>
                            ) : isOwner ? (
                                '📝 Edit Your Space'
                            ) : !space.is_active ? (
                                'Currently Unavailable'
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>

                        {isOwner && (
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <button
                                    onClick={() => navigate(`/edit-space/${space.id}`)}
                                    style={{
                                        background: 'transparent',
                                        border: '2px solid #01095A',
                                        color: '#01095A',
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        width: '100%'
                                    }}
                                >
                                    ✏️ Edit Space Details
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="SpaceDetail_right">
                        <div className="SpaceDetail_gallery" style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '600px',
                            margin: '0 auto'
                        }}>
                            {images.length > 0 ? (
                                <LazyImage
                                    src={images[currentImage]}
                                    alt={space.title}
                                    className="SpaceDetail_main-img"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c';
                                    }}
                                />
                            ) : (
                                <div className="SpaceDetail_no-img" style={{
                                    width: '100%',
                                    minHeight: '400px',
                                    maxHeight: '500px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f5f5f5',
                                    borderRadius: '12px'
                                }}>
                                    {imagesLoading ? (
                                        <div className="image-skeleton" style={{
                                            width: '100%',
                                            height: '400px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f5f5f5'
                                        }}>
                                            <div className="loading-spinner-small"></div>
                                        </div>
                                    ) : 'No image available'}
                                </div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <button
                                        className="SpaceDetail_img-nav SpaceDetail_prev"
                                        onClick={prevImage}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10
                                        }}
                                    >‹</button>
                                    <button
                                        className="SpaceDetail_img-nav SpaceDetail_next"
                                        onClick={nextImage}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            zIndex: 10
                                        }}
                                    >›</button>
                                    <div className="SpaceDetail_img-counter" style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        right: '10px',
                                        background: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        zIndex: 10
                                    }}>
                                        {currentImage + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="SpaceDetail_thumbnails" style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '16px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                {images.slice(0, 5).map((img, i) => (
                                    <LazyThumbnail
                                        key={i}
                                        src={img}
                                        alt={`view-${i}`}
                                        className="SpaceDetail_thumb"
                                        isActive={i === currentImage}
                                        onClick={() => setCurrentImage(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="SpaceDetail_bottom">
                    <div className="SpaceDetail_section">
                        <h3 className="SpaceDetail_section-title">About this space</h3>
                        <p className="SpaceDetail_description">
                            {space.description}
                        </p>
                    </div>

                    {(space.opening_time && space.closing_time) && (
                        <div className="SpaceDetail_section">
                            <h3 className="SpaceDetail_section-title">Working Hours</h3>
                            <p className="SpaceDetail_working_hours">
                                ⏰ {space.opening_time} - {space.closing_time}
                            </p>
                            {space.working_days && space.working_days.length > 0 && (
                                <p className="SpaceDetail_working_days">
                                    📅 {space.working_days.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {amenities.length > 0 && (
                        <div className="SpaceDetail_section">
                            <h3 className="SpaceDetail_section-title">Amenities</h3>
                            <div className="SpaceDetail_features">
                                {amenities.map((item, i) => (
                                    <span key={i} className="SpaceDetail_feature-tag">✓ {item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="SpaceDetail_section">
                        <h3 className="SpaceDetail_section-title">Space Information</h3>
                        <div className="SpaceDetail_space_info">
                            {space.space_name && (
                                <p><strong>🏢 Space Name:</strong> {space.space_name}</p>
                            )}
                            <p><strong>📌 Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
                            {space.total_capacity && (
                                <p><strong>👥 Total Capacity:</strong> {space.total_capacity} seats</p>
                            )}
                            {space.address && (
                                <p><strong>📍 Address:</strong> {space.address}</p>
                            )}
                            {space.city && (
                                <p><strong>🌆 City:</strong> {space.city}</p>
                            )}
                            {isOwner && (
                                <p style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8eaf0', color: '#01095A' }}>
                                    👑 You are the owner of this space
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SpaceDetail;