// MeetingRoomsDetail.jsx - Fixed version with NO timezone conversion

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MeetingRoomDateTimePicker from './MeetingRoomDateTimePicker';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import '../componentstyles/utilstyle/meetingRoomsDetail.css';
import BaseUrl from './AppConstants';
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Lock,
    MapPin,
    Users,
    AlertTriangle,
    Pencil,
    FileEdit,
    Crown,
    Check,
    Clock,
    BarChart2,
    Zap,
    CheckCircle,
    Building2,
    Landmark,
    Pin,
    Lightbulb,
    ChevronLeft,
    ChevronRight,
    PartyPopper,
    Hand
} from 'lucide-react';

// Local fallback images
const FALLBACK_IMAGES = {
    main: 'https://picsum.photos/id/20/800/500',
    placeholder: 'https://picsum.photos/id/20/800/500'
};

const MeetingRoomsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [loadedImages, setLoadedImages] = useState({});
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [images, setImages] = useState([]);

    // States for booking dates
    const [bookedDates, setBookedDates] = useState([]);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loadingBookings, setLoadingBookings] = useState(false);

    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
    });

    // Add token to requests
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Helper function to validate and clean image URL
    const validateImageUrl = (url) => {
        if (!url) return FALLBACK_IMAGES.main;
        if (typeof url !== 'string') return FALLBACK_IMAGES.main;

        if (url.startsWith('data:image')) {
            return url;
        }

        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        if (url.length > 100 && /^[A-Za-z0-9+/=]+$/.test(url.substring(0, 100))) {
            return `data:image/jpeg;base64,${url}`;
        }

        return FALLBACK_IMAGES.main;
    };

    // Helper function to extract image URL from object or string
    const extractImageUrl = (img) => {
        if (!img) return null;

        if (typeof img === 'string') {
            return validateImageUrl(img);
        }

        if (typeof img === 'object' && img !== null) {
            if (img.image_base64 && typeof img.image_base64 === 'string') {
                let base64 = img.image_base64;
                if (base64.startsWith('data:application/octet-stream')) {
                    base64 = base64.replace('data:application/octet-stream', 'data:image/jpeg');
                }
                return validateImageUrl(base64);
            }
            if (img.url && typeof img.url === 'string') {
                return validateImageUrl(img.url);
            }
            if (img.src && typeof img.src === 'string') {
                return validateImageUrl(img.src);
            }
        }

        return null;
    };

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

    // Check for pre-filled dates from navigation state
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

    // Fetch booking dates function
    const fetchBookingDates = async () => {
        if (!id) return;

        try {
            setLoadingBookings(true);
            console.log('Fetching booking dates for unit:', id);

            const response = await apiClient.get(`api/spaces/unit/${id}/calendar-dates`);

            if (response.data?.success) {
                const data = response.data.data;
                setBookedDates(data.bookedDates || []);
                setBookingDetails(data.details || null);

                console.log('Booked dates loaded:', data.bookedDates.length, 'dates');
                console.log('Booked dates:', data.bookedDates);

                if (data.bookedDates.length > 0) {
                    info(`📅 ${data.bookedDates.length} dates are already booked`);
                }
            }
        } catch (err) {
            console.error('Error fetching booking dates:', err);
            setBookedDates([]);
            setBookingDetails(null);
        } finally {
            setLoadingBookings(false);
        }
    };

    // Load space and images
    useEffect(() => {
        const fetchMeetingRoom = async () => {
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

                    const transformedSpace = {
                        id: unitData.id,
                        name: unitData.name,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Meeting Room",
                        description: unitData.space_description || unitData.space?.description || "A professional meeting room equipped with modern amenities",
                        location: unitData.city || unitData.space?.city || "Coworking Space",
                        area: unitData.area || unitData.space?.area,
                        address: unitData.address || unitData.space?.address,
                        city: unitData.city || unitData.space?.city,
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
                        total_capacity: unitData.total_capacity,
                        unit_type: unitData.unit_type,
                        space: unitData.space,
                        space_amenities: unitData.space_amenities || {},
                        policies: unitData.policies || {},
                        is_active: unitData.is_active,
                        owner_id: unitData.owner_id || unitData.space?.owner_id,
                        created_at: unitData.created_at,
                        updated_at: unitData.updated_at,
                        opening_time: unitData.opening_time,
                        closing_time: unitData.closing_time,
                        working_days: unitData.working_days,
                        space_name: unitData.space_name,
                        space_description: unitData.space_description
                    };

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    setCurrentImage(0);

                    // Fetch booking dates after space is loaded
                    await fetchBookingDates();

                    // Now fetch images separately
                    try {
                        setImageLoading(true);
                        const imagesResponse = await apiClient.get(`api/spaces/unit/${id}/images`);

                        if (imagesResponse.data?.success && imagesResponse.data?.images) {
                            const parsedImages = imagesResponse.data.images
                                .map(img => extractImageUrl(img))
                                .filter(img => img !== null);

                            if (parsedImages.length > 0) {
                                setImages(parsedImages);
                                console.log('Images loaded:', parsedImages.length);
                            } else {
                                setImages([FALLBACK_IMAGES.main]);
                            }
                        } else {
                            setImages([FALLBACK_IMAGES.main]);
                        }
                    } catch (imgErr) {
                        console.error('Error fetching images:', imgErr);
                        setImages([FALLBACK_IMAGES.main]);
                    } finally {
                        setImageLoading(false);
                    }

                    success('Meeting room details loaded successfully! 🎉');
                } else {
                    error('Meeting room not found');
                }
            } catch (err) {
                console.error('Error fetching meeting room:', err);
                error('Failed to load meeting room details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMeetingRoom();
        }
    }, [id]);

    const isOwnSpace = useCallback(() => {
        if (!user || !space) return false;
        return user.id === space.owner_id;
    }, [user, space]);

    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const nextIdx = (currentImage + 1) % images.length;
        setCurrentImage(nextIdx);
        setTimeout(() => setImageLoading(false), 200);
    }, [currentImage, images.length]);

    const prevImage = useCallback(() => {
        if (images.length === 0) return;
        setImageLoading(true);
        const prevIdx = (currentImage - 1 + images.length) % images.length;
        setCurrentImage(prevIdx);
        setTimeout(() => setImageLoading(false), 200);
    }, [currentImage, images.length]);

    const goToImage = (index) => {
        if (index >= 0 && index < images.length && index !== currentImage) {
            setImageLoading(true);
            setCurrentImage(index);
            setTimeout(() => setImageLoading(false), 200);
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

    // ============================================================
    // DateTime Change Handlers
    // ============================================================

    const handleStartDateTimeChange = (dateValue) => {
        console.log('Start DateTime changed:', dateValue);

        if (!dateValue) {
            setStartDateTime(null);
            return;
        }

        // If dateValue is a string, convert to Date
        const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date value:', dateValue);
            return;
        }

        setStartDateTime(dateObj);

        // If end time is before or equal to start time, clear it
        if (endDateTime && new Date(endDateTime) <= dateObj) {
            setEndDateTime(null);
            warning('End time must be after start time. Please select a new end time.');
        }
    };

    const handleEndDateTimeChange = (dateValue) => {
        console.log('End DateTime changed:', dateValue);

        if (!dateValue) {
            setEndDateTime(null);
            return;
        }

        // If dateValue is a string, convert to Date
        const dateObj = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date value:', dateValue);
            return;
        }

        // Validate that end time is after start time
        if (startDateTime && dateObj <= new Date(startDateTime)) {
            warning('End time must be after start time');
            return;
        }

        setEndDateTime(dateObj);
    };

    // ============================================================
    // CALCULATION FUNCTIONS
    // ============================================================

    const calcHours = () => {
        if (!startDateTime || !endDateTime) return 0;
        const diffMs = new Date(endDateTime) - new Date(startDateTime);
        if (diffMs <= 0) return 0;
        const diffHours = diffMs / (1000 * 60 * 60);
        return Math.max(1, Math.ceil(diffHours));
    };

    const calcDays = () => {
        if (!startDateTime || !endDateTime) return 0;
        const diffMs = new Date(endDateTime) - new Date(startDateTime);
        if (diffMs <= 0) return 0;
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    const calcMonths = () => {
        if (!startDateTime || !endDateTime) return 0;
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
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

    const calculateTotal = () => {
        if (!startDateTime || !endDateTime || !space) return 0;
        switch (selectedRateType) {
            case 'hourly': return calcHours() * (space.hourly_rate || 0);
            case 'daily': return calcDays() * (space.daily_rate || 0);
            case 'monthly': return Math.max(1, calcMonths()) * (space.monthly_rate || 0);
            default: return calcDays() * (space.daily_rate || 0);
        }
    };

    const getQuantity = () => {
        if (!startDateTime || !endDateTime) return 0;
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

    // ============================================================
    // HANDLE BOOKING - NO TIMEZONE CONVERSION
    // ============================================================

    const handleBooking = async () => {
        if (!user) {
            warning('Please login to book this meeting room');
            setTimeout(() => {
                navigate('/login', { state: { from: `/meeting-room/${id}` } });
            }, 1500);
            return;
        }

        if (isOwnSpace()) {
            error('You cannot book your own space!');
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

        // Validate minimum booking duration
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (selectedRateType === 'hourly' && diffHours < 1) {
            error('Hourly bookings require a minimum of 1 hour');
            return;
        }

        if (selectedRateType === 'daily' && diffHours < 24) {
            error('Daily bookings require a minimum of 24 hours (1 full day)');
            return;
        }

        if (selectedRateType === 'monthly' && diffHours < 24 * 28) {
            error('Monthly bookings require at least 28 days');
            return;
        }

        const totalPrice = calculateTotal();
        if (totalPrice <= 0) {
            error('Invalid booking duration or price');
            return;
        }

        setBookingLoading(true);

        try {
            // ============================================================
            // CRITICAL FIX: Send time EXACTLY as selected - NO CONVERSION
            // ============================================================
            const formatExactDateTime = (date) => {
                const d = new Date(date);
                // Get each component EXACTLY as it is - no timezone conversion
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');

                // Return in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
                // This has NO timezone information at all
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            // Get the exact time as selected - NO CONVERSION AT ALL
            const startTimeStr = formatExactDateTime(startDateTime);
            const endTimeStr = formatExactDateTime(endDateTime);

            console.log('📤 Sending EXACT times (no conversion):', {
                start: startTimeStr,
                end: endTimeStr,
                originalStart: new Date(startDateTime).toString(),
                originalEnd: new Date(endDateTime).toString()
            });

            const bookingData = {
                space_unit_id: id,
                start_time: startTimeStr,
                end_time: endTimeStr,
                total_price: totalPrice
            };

            const response = await apiClient.post('api/bookings/createbooking', bookingData, {
                timeout: 30000
            });

            if (response.data.success) {
                success(`Booking successful! Reference: ${response.data.booking.booking_ref}`, 5000);
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 2000);
            } else {
                throw new Error(response.data.message || 'Booking failed');
            }

        } catch (err) {
            console.error('Booking error:', err);

            let errorMessage = 'Failed to create booking. Please try again.';

            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                errorMessage = 'Booking is being processed. Please check "My Bookings" page to confirm your booking.';
                warning(errorMessage);
                setTimeout(() => {
                    navigate('/my-bookings');
                }, 3000);
                return;
            }

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Session expired. Please login again';
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response.status === 409) {
                    errorMessage = err.response.data.message || 'This time slot is already booked.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }

            error(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    const renderAmenities = () => {
        const amenities = space?.space_amenities || {};
        const amenityList = [];
        if (amenities.wifi) amenityList.push('WiFi');
        if (amenities.ac) amenityList.push('Air Conditioning');
        if (amenities.coffee) amenityList.push('Free Coffee');
        if (amenities.printer) amenityList.push('Printer');
        if (amenities.projector) amenityList.push('Projector');
        if (amenities.whiteboard) amenityList.push('Whiteboard');
        if (amenities.parking) amenityList.push('Parking');
        if (amenities.security) amenityList.push('24/7 Security');
        if (amenities.backup_power) amenityList.push('Backup Power');
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

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();
    const amenities = renderAmenities();
    const availableRateTypes = getAvailableRateTypes();
    const isOwner = isOwnSpace();

    if (loading) {
        return (
            <div className="MeetingRoomsDetail_loading">
                <div className="MeetingRoomsDetail_spinner"></div>
                <p>Loading meeting room details...</p>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="MeetingRoomsDetail_loading">
                <p>Unable to load meeting room details.</p>
                <button onClick={() => navigate(-1)} className="MeetingRoomsDetail_back-btn">
                    <ArrowLeft size={18} style={{ marginRight: '6px' }} />
                    Go Back
                </button>
                <button onClick={() => window.location.reload()} className="MeetingRoomsDetail_retry-btn">
                    <RefreshCw size={18} style={{ marginRight: '6px' }} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="MeetingRoomsDetail_page">
                <button className="MeetingRoomsDetail_back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} style={{ marginRight: '6px' }} />
                    Back to spaces
                </button>

                <h2 className="MeetingRoomsDetail_page-title">Space Details</h2>

                {isOwner && (
                    <div className="MeetingRoomsDetail_owner_warning" style={{
                        backgroundColor: '#fff3cd',
                        borderLeft: '4px solid #ffc107',
                        padding: '16px 20px',
                        marginBottom: '24px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <AlertTriangle size={24} style={{ color: '#856404' }} />
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
                    <div className="MeetingRoomsDetail_login_warning" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Lock size={16} />
                        Please <button onClick={() => navigate('/login')} className="login-link">login</button> to book this space
                    </div>
                )}

                {space.unit_type && (
                    <div className="MeetingRoomsDetail_unit_badge">
                        {space.unit_type.replace('_', ' ').toUpperCase()}
                    </div>
                )}

                <div className="MeetingRoomsDetail_top-grid">
                    <div className="MeetingRoomsDetail_left">
                        <h1 className="MeetingRoomsDetail_title">{space.title}</h1>

                        <p className="MeetingRoomsDetail_meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={16} /> {space.city || space.location}
                            {space.area && `, ${space.area}`}
                            {space.address && <span> - {space.address}</span>}
                        </p>

                        {space.total_capacity && (
                            <p className="MeetingRoomsDetail_meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={16} /> Capacity: {space.total_capacity} people
                            </p>
                        )}

                        <p className="MeetingRoomsDetail_meta">
                            Availability: <span className={space.is_active !== false ? "MeetingRoomsDetail_available" : "MeetingRoomsDetail_unavailable"}>
                                {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
                            </span>
                        </p>

                        {availableRateTypes.length > 1 && (
                            <div className="MeetingRoomsDetail_rate_selector">
                                <label>Select Pricing Plan:</label>
                                <div className="MeetingRoomsDetail_rate_options">
                                    {availableRateTypes.map(type => (
                                        <button
                                            key={type.key}
                                            className={`MeetingRoomsDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedRateType(type.key);
                                                info(`${type.label} pricing selected`);
                                            }}
                                        >
                                            {type.label}
                                            <span className="MeetingRoomsDetail_rate_amount">
                                                {type.rate.toLocaleString()} PKR
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="MeetingRoomsDetail_pricing">
                            <p className="MeetingRoomsDetail_price">
                                {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
                            </p>
                            {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
                                <p className="MeetingRoomsDetail_note" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Lightbulb size={14} /> Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
                                </p>
                            )}
                            {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
                                <p className="MeetingRoomsDetail_note" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Lightbulb size={14} /> Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
                                </p>
                            )}
                        </div>

                        {/* Date & Time Selection Section */}
                        <div className="MeetingRoomsDetail_datetime_section" style={{ opacity: isOwner ? 0.6 : 1 }}>
                            <h3 className="MeetingRoomsDetail_section_title">Select Date & Time</h3>

                            {/* Show booking summary */}
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
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> <strong>{bookedDates.length}</strong> dates already booked
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BarChart2 size={14} /> <strong>{bookingDetails.totalBookings || 0}</strong> total bookings
                                    </span>
                                    <span style={{ color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Zap size={12} /> Booked dates are disabled in calendar
                                    </span>
                                </div>
                            )}

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
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle size={14} /> All dates are available for booking!
                                    </span>
                                </div>
                            )}

                            <div className="MeetingRoomsDetail_datetime_grid">
                                {selectedRateType === 'hourly' ? (
                                    <>
                                        <MeetingRoomDateTimePicker
                                            type="start"
                                            label="Start Date & Time"
                                            value={startDateTime}
                                            onChange={handleStartDateTimeChange}
                                            minDate={new Date()}
                                            placeholder="Select start date and hour"
                                            rateType={selectedRateType}
                                            onWarning={warning}
                                            bookedDates={bookedDates}
                                            unitId={id}
                                        />

                                        <MeetingRoomDateTimePicker
                                            type="end"
                                            label="End Date & Time"
                                            value={endDateTime}
                                            onChange={handleEndDateTimeChange}
                                            minDate={startDateTime || new Date()}
                                            startDate={startDateTime}
                                            placeholder="Select end date and hour"
                                            rateType={selectedRateType}
                                            onWarning={warning}
                                            bookedDates={bookedDates}
                                            unitId={id}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <MeetingRoomDateTimePicker
                                            type="start"
                                            label="Start Date & Time"
                                            value={startDateTime}
                                            onChange={handleStartDateTimeChange}
                                            minDate={new Date()}
                                            placeholder="Select start date and time"
                                            rateType={selectedRateType}
                                            onWarning={warning}
                                            bookedDates={bookedDates}
                                            unitId={id}
                                        />

                                        <MeetingRoomDateTimePicker
                                            type="end"
                                            label="End Date & Time"
                                            value={endDateTime}
                                            onChange={handleEndDateTimeChange}
                                            minDate={startDateTime || new Date()}
                                            startDate={startDateTime}
                                            placeholder="Select end date and time"
                                            rateType={selectedRateType}
                                            onWarning={warning}
                                            bookedDates={bookedDates}
                                            unitId={id}
                                        />
                                    </>
                                )}
                            </div>

                            {selectedRateType === 'hourly' && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#01095A',
                                    marginTop: '8px',
                                    padding: '6px 12px',
                                    background: 'rgba(1, 9, 90, 0.05)',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}>
                                    <Clock size={14} /> Hourly bookings: minimum 1 hour, whole hours only, same-day or later allowed
                                </div>
                            )}

                            {selectedRateType === 'daily' && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#6c757d',
                                    marginTop: '8px',
                                    padding: '6px 12px',
                                    background: 'rgba(108, 117, 125, 0.05)',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}>
                                    <Calendar size={14} /> Daily bookings: minimum 24 hours (1 day)
                                </div>
                            )}
                        </div>

                        {/* Booking Summary */}
                        {startDateTime && endDateTime && !isOwner && (() => {
                            const start = new Date(startDateTime);
                            const end = new Date(endDateTime);
                            if (end <= start) return null;
                            return (
                                <div className="MeetingRoomsDetail_summary">
                                    <div className="MeetingRoomsDetail_summary-row">
                                        <span>Starting Date</span>
                                        <span>{start.toLocaleString()}</span>
                                    </div>
                                    <div className="MeetingRoomsDetail_summary-row">
                                        <span>Ending Date</span>
                                        <span>{end.toLocaleString()}</span>
                                    </div>
                                    <div className="MeetingRoomsDetail_summary-row">
                                        <span>Duration</span>
                                        <span>
                                            {selectedRateType === 'hourly' && `${calcHours()}  ${calcHours() === 1 ? 'hour' : 'hours'}`}
                                            {selectedRateType === 'daily' && `${calcDays()}   ${calcDays() === 1 ? 'night' : 'nights'}`}
                                            {selectedRateType === 'monthly' && `${Math.max(1, calcMonths())} ${calcMonths() === 1 ? 'month' : 'months'}`}
                                        </span>
                                    </div>
                                    <div className="MeetingRoomsDetail_summary-row">
                                        <span>
                                            {rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}
                                        </span>
                                        <span>PKR {total.toLocaleString()}</span>
                                    </div>
                                    <div className="MeetingRoomsDetail_summary-row MeetingRoomsDetail_summary-total">
                                        <span>Total</span>
                                        <span>PKR {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        <button
                            className="MeetingRoomsDetail_continue-btn"
                            disabled={isOwner || !startDateTime || !endDateTime || bookingLoading || !user || space.is_active === false}
                            onClick={handleBooking}
                            style={{
                                backgroundColor: isOwner ? '#6c757d' : undefined,
                                cursor: isOwner ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            {bookingLoading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Processing...
                                </>
                            ) : isOwner ? (
                                <>
                                    <FileEdit size={16} /> Edit Your Space
                                </>
                            ) : space.is_active === false ? (
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
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Pencil size={16} /> Edit Space Details
                                </button>
                            </div>
                        )}
                    </div>

                    {/* IMAGE SLIDER SECTION */}
                    <div className="MeetingRoomsDetail_right">
                        <div
                            className="MeetingRoomsDetail_gallery"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '550px',
                                margin: '0 auto',
                                minHeight: '400px',
                                maxHeight: '450px',
                                overflow: 'hidden',
                                borderRadius: '16px',
                                backgroundColor: '#f5f5f5'
                            }}
                        >
                            {images.length > 0 ? (
                                <>
                                    {imageLoading && (
                                        <div className="MeetingRoomsDetail_image_loader" style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f5f5f5',
                                            zIndex: 5,
                                            borderRadius: '16px'
                                        }}>
                                            <div className="MeetingRoomsDetail_spinner_small"></div>
                                        </div>
                                    )}

                                    <img
                                        key={currentImage}
                                        src={images[currentImage] || FALLBACK_IMAGES.main}
                                        alt={`${space.title} - Image ${currentImage + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            minHeight: '400px',
                                            maxHeight: '450px',
                                            objectFit: 'cover',
                                            objectPosition: 'center',
                                            transition: 'opacity 0.3s ease',
                                            opacity: imageLoading ? 0 : 1
                                        }}
                                        onLoad={() => setImageLoading(false)}
                                        onError={(e) => {
                                            console.warn('Image failed to load, using fallback');
                                            e.target.src = FALLBACK_IMAGES.main;
                                            setImageLoading(false);
                                        }}
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                className="MeetingRoomsDetail_img-nav MeetingRoomsDetail_prev"
                                                onClick={prevImage}
                                                style={{
                                                    position: 'absolute',
                                                    left: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 10,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    border: 'none',
                                                    color: 'white',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button
                                                className="MeetingRoomsDetail_img-nav MeetingRoomsDetail_next"
                                                onClick={nextImage}
                                                style={{
                                                    position: 'absolute',
                                                    right: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 10,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    border: 'none',
                                                    color: 'white',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                            <div className="MeetingRoomsDetail_img-counter" style={{
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
                                </>
                            ) : (
                                <div className="MeetingRoomsDetail_no-img" style={{
                                    width: '100%',
                                    minHeight: '400px',
                                    maxHeight: '450px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f5f5f5'
                                }}>
                                    <img
                                        src={FALLBACK_IMAGES.main}
                                        alt="No image available"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            minHeight: '400px',
                                            maxHeight: '450px',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="MeetingRoomsDetail_thumbnails" style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '16px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                {images.slice(0, 6).map((img, i) => (
                                    <div
                                        key={i}
                                        className={`MeetingRoomsDetail_thumb_wrapper ${i === currentImage ? 'active' : ''}`}
                                        onClick={() => goToImage(i)}
                                        style={{
                                            cursor: 'pointer',
                                            width: '70px',
                                            height: '70px',
                                            flexShrink: 0,
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: i === currentImage ? '2px solid #01095A' : '2px solid transparent'
                                        }}
                                    >
                                        <img
                                            src={img || FALLBACK_IMAGES.main}
                                            alt={`Thumbnail ${i + 1}`}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center'
                                            }}
                                            onError={(e) => {
                                                e.target.src = FALLBACK_IMAGES.main;
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="MeetingRoomsDetail_bottom">
                    <div className="MeetingRoomsDetail_section">
                        <h3 className="MeetingRoomsDetail_section-title">About this space</h3>
                        <p className="MeetingRoomsDetail_description">
                            {space.description || `A professional ${space.unit_type?.replace('_', ' ') || 'meeting room'} located in the heart of ${space.city}. Perfect for team meetings, client presentations, and workshops.`}
                        </p>
                    </div>

                    {(space.opening_time && space.closing_time) && (
                        <div className="MeetingRoomsDetail_section">
                            <h3 className="MeetingRoomsDetail_section-title">Working Hours</h3>
                            <p className="MeetingRoomsDetail_working_hours" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={16} /> {space.opening_time} - {space.closing_time}
                            </p>
                            {space.working_days && space.working_days.length > 0 && (
                                <p className="MeetingRoomsDetail_working_days" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Calendar size={16} /> {space.working_days.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {amenities.length > 0 && (
                        <div className="MeetingRoomsDetail_section">
                            <h3 className="MeetingRoomsDetail_section-title">Amenities</h3>
                            <div className="MeetingRoomsDetail_features">
                                {amenities.map((item, i) => (
                                    <span key={i} className="MeetingRoomsDetail_feature-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Check size={14} /> {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="MeetingRoomsDetail_section">
                        <h3 className="MeetingRoomsDetail_section-title">Space Information</h3>
                        <div className="MeetingRoomsDetail_space_info">
                            {space.space_name && (
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Building2 size={16} /> <strong>Space Name:</strong> {space.space_name}
                                </p>
                            )}
                            <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Pin size={16} /> <strong>Unit Type:</strong> {space.unit_type?.replace('_', ' ')}
                            </p>
                            {space.total_capacity && (
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} /> <strong>Total Capacity:</strong> {space.total_capacity} seats
                                </p>
                            )}
                            {space.address && (
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} /> <strong>Address:</strong> {space.address}
                                </p>
                            )}
                            {space.city && (
                                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Landmark size={16} /> <strong>City:</strong> {space.city}
                                </p>
                            )}
                            {isOwner && (
                                <p className="verified" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Crown size={16} /> You are the owner of this space
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MeetingRoomsDetail;