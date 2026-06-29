// DedicatedDeskDetail.jsx - Updated with Booking Dates Integration
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DateTimePicker from './DateTimePicker';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import '../componentstyles/utilstyle/dedicatedDesksDetailed.css';
import BaseUrl from './AppConstants';

const DedicatedDeskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [imageLoading, setImageLoading] = useState(true);
    const [images, setImages] = useState([]);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    
    // ✅ NEW: States for booking dates
    const [bookedDates, setBookedDates] = useState([]);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [loadingBookings, setLoadingBookings] = useState(false);

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

    // Get current user info
    useEffect(() => {
        const getUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await apiClient.get('api/auth/profile');
                    setUser(response.data.user);
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
        };
        getUser();
    }, []);

    // Check for pre-filled dates from "Book Again"
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

    // ✅ NEW: Fetch booking dates function
    const fetchBookingDates = async () => {
        if (!id) return;

        try {
            setLoadingBookings(true);
            console.log('📅 Fetching booking dates for unit:', id);

            const response = await apiClient.get(`api/spaces/unit/${id}/calendar-dates`);

            if (response.data?.success) {
                const data = response.data.data;
                setBookedDates(data.bookedDates || []);
                setBookingDetails(data.details || null);

                console.log('✅ Booked dates loaded:', data.bookedDates.length, 'dates');
                console.log('📅 Booked dates:', data.bookedDates);

                if (data.bookedDates.length > 0) {
                    info(`📅 ${data.bookedDates.length} dates are already booked`);
                }
            }
        } catch (err) {
            console.error('❌ Error fetching booking dates:', err);
            setBookedDates([]);
            setBookingDetails(null);
        } finally {
            setLoadingBookings(false);
        }
    };

    // Helper function to extract image URL from various formats
    const extractImageUrl = (img) => {
        if (!img) return null;

        if (typeof img === 'object' && img.image_base64) {
            let base64 = img.image_base64;
            if (typeof base64 === 'string' && base64.startsWith('data:application/octet-stream')) {
                base64 = base64.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            return base64;
        }

        if (typeof img === 'string') {
            if (img.startsWith('data:application/octet-stream')) {
                return img.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            if (!img.startsWith('data:image') && !img.startsWith('http') && img.length > 100) {
                if (/^[A-Za-z0-9+/=]+$/.test(img.substring(0, 100))) {
                    return `data:image/jpeg;base64,${img}`;
                }
            }
            return img;
        }

        return null;
    };

    // Fetch images using the existing endpoint
    const fetchUnitImages = async (unitId) => {
        try {
            const response = await apiClient.get(`api/spaces/unit/${unitId}/images`);

            if (response.data?.success && response.data?.images?.length > 0) {
                const parsedImages = response.data.images
                    .filter(img => img !== null && img !== '')
                    .map(img => extractImageUrl(img))
                    .filter(img => img !== null);

                return parsedImages;
            }
            return [];
        } catch (err) {
            console.error('Error fetching unit images:', err);
            return [];
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);

                const response = await apiClient.get(`api/spaces/unit/${id}`);

                if (!response.data?.success || !response.data?.unit) {
                    error('Space not found');
                    return;
                }

                const unitData = response.data.unit;

                // Fetch images separately using the images endpoint
                const unitImages = await fetchUnitImages(id);

                // Determine rate type
                let rateType = 'daily';
                if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999) {
                    rateType = 'hourly';
                } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999) {
                    rateType = 'daily';
                } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999) {
                    rateType = 'monthly';
                }

                const finalImages = unitImages.length > 0 ? unitImages : ['https://picsum.photos/id/20/800/500'];

                const transformedSpace = {
                    id: unitData.id,
                    name: unitData.name,
                    title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Workspace",
                    description: unitData.space_description || "A premium workspace in a professional coworking space",
                    location: unitData.city || "Coworking Space",
                    area: unitData.area,
                    address: unitData.address,
                    city: unitData.city,
                    rateType: rateType,
                    hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                    daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                    monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,
                    total_capacity: unitData.total_capacity,
                    unit_type: unitData.unit_type,
                    images: finalImages,
                    opening_time: unitData.opening_time,
                    closing_time: unitData.closing_time,
                    working_days: unitData.working_days,
                    has_wifi: unitData.has_wifi,
                    has_ac: unitData.has_ac,
                    has_coffee: unitData.has_coffee,
                    has_printer: unitData.has_printer,
                    has_parking: unitData.has_parking,
                    has_security: unitData.has_security,
                    has_backup_power: unitData.has_backup_power,
                    space_name: unitData.space_name,
                    space_description: unitData.space_description,
                    is_active: unitData.is_active,
                    owner_id: unitData.owner_id,
                    created_at: unitData.created_at,
                    updated_at: unitData.updated_at
                };

                setSpace(transformedSpace);
                setImages(finalImages);
                setSelectedRateType(rateType);
                setCurrentImage(0);
                setImageLoading(false);

                // ✅ Fetch booking dates after space is loaded
                await fetchBookingDates();

                success('Space details loaded successfully! 🎉');

            } catch (err) {
                console.error('Error fetching space details:', err);

                if (err.response?.status === 404) {
                    error('Space not found. It may have been removed.');
                } else if (err.code === 'ECONNABORTED') {
                    error('Request timeout. Please check your connection.');
                } else {
                    error('Failed to load space details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAllData();
        }
    }, [id]);

    const isOwnSpace = () => {
        if (!user || !space) return false;
        return String(user.id) === String(space.owner_id);
    };

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

        if (isLeftSwipe) {
            nextImage();
        }
        if (isRightSwipe) {
            prevImage();
        }
        setTouchStart(0);
        setTouchEnd(0);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextImage, prevImage]);

    // FIXED: Use startDateTime and endDateTime for calculations
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

    const handleBooking = async () => {
        if (!user) {
            warning('Please login to book this space');
            setTimeout(() => {
                navigate('/login', { state: { from: `/dedicated-desk/${id}` } });
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
        const amenities = [];
        if (space?.has_wifi) amenities.push('WiFi');
        if (space?.has_ac) amenities.push('Air Conditioning');
        if (space?.has_coffee) amenities.push('Free Coffee');
        if (space?.has_printer) amenities.push('Printer');
        if (space?.has_parking) amenities.push('Parking');
        if (space?.has_security) amenities.push('24/7 Security');
        if (space?.has_backup_power) amenities.push('Backup Power');
        return amenities;
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

    // Add CSS animations
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .image-circle-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e0e0e0;
                border-top: 3px solid #01095A;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            .thumbnail-circle-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e0e0e0;
                border-top: 2px solid #01095A;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    if (loading) {
        return (
            <div className="DedicatedDeskDetail_loading">
                <div className="DedicatedDeskDetail_spinner"></div>
                <p>Loading space details...</p>
            </div>
        );
    }

    if (!space) {
        return (
            <div className="DedicatedDeskDetail_loading">
                <p>Unable to load space details.</p>
                <button onClick={() => navigate(-1)} className="DedicatedDeskDetail_back-btn">Go Back</button>
                <button onClick={() => window.location.reload()} className="DedicatedDeskDetail_retry-btn">Retry</button>
            </div>
        );
    }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="DedicatedDeskDetail_page">
                <button className="DedicatedDeskDetail_back-btn" onClick={() => navigate(-1)}>
                    Back to spaces
                </button>

                <h2 className="DedicatedDeskDetail_page-title">Space Details</h2>

                {isOwner && (
                    <div className="DedicatedDeskDetail_owner_warning">
                        ⚠️ This is your own space. You cannot book it.
                    </div>
                )}

                {!user && (
                    <div className="DedicatedDeskDetail_login_warning">
                        🔐 Please <button onClick={() => navigate('/login')} className="login-link">login</button> to book this space
                    </div>
                )}

                {space.unit_type && (
                    <div className="DedicatedDeskDetail_unit_badge">
                        {space.unit_type.replace('_', ' ').toUpperCase()}
                    </div>
                )}

                <div className="DedicatedDeskDetail_top-grid">
                    <div className="DedicatedDeskDetail_left">
                        <h1 className="DedicatedDeskDetail_title">{space.title}</h1>

                        <p className="DedicatedDeskDetail_meta">
                            📍 {space.city || space.location}
                            {space.area && `, ${space.area}`}
                            {space.address && <span> - {space.address}</span>}
                        </p>

                        {space.total_capacity && (
                            <p className="DedicatedDeskDetail_meta">
                                👥 Capacity: {space.total_capacity} people
                            </p>
                        )}

                        <p className="DedicatedDeskDetail_meta">
                            Availability: <span className={space.is_active ? "DedicatedDeskDetail_available" : "DedicatedDeskDetail_unavailable"}>
                                {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
                            </span>
                        </p>

                        {availableRateTypes.length > 1 && (
                            <div className="DedicatedDeskDetail_rate_selector">
                                <label>Select Pricing Plan:</label>
                                <div className="DedicatedDeskDetail_rate_options">
                                    {availableRateTypes.map(type => (
                                        <button
                                            key={type.key}
                                            className={`DedicatedDeskDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedRateType(type.key);
                                                info(`${type.label} pricing selected`);
                                            }}
                                        >
                                            {type.label}
                                            <span className="DedicatedDeskDetail_rate_amount">
                                                {type.rate.toLocaleString()} PKR
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="DedicatedDeskDetail_pricing">
                            <p className="DedicatedDeskDetail_price">
                                {rateDisplay.rate?.toLocaleString()} PKR per {rateDisplay.unit}
                            </p>
                            {selectedRateType === 'hourly' && space.daily_rate && space.daily_rate > 0 && (
                                <p className="DedicatedDeskDetail_note">
                                    💡 Daily rate available: {space.daily_rate.toLocaleString()} PKR/day
                                </p>
                            )}
                            {selectedRateType === 'daily' && space.monthly_rate && space.monthly_rate > 0 && (
                                <p className="DedicatedDeskDetail_note">
                                    💡 Monthly rate available: {space.monthly_rate.toLocaleString()} PKR/month
                                </p>
                            )}
                        </div>

                        {/* Date & Time Selection Section - FIXED */}
                        <div className="DedicatedDeskDetail_datetime_section" style={{ opacity: isOwner ? 0.6 : 1 }}>
                            <h3 className="DedicatedDeskDetail_section_title">Select Date & Time</h3>
                            
                            {/* ✅ NEW: Show booking summary */}
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

                            <div className="DedicatedDeskDetail_datetime_grid">
                                <DateTimePicker
                                    type="start"
                                    label="Start Date & Time"
                                    value={startDateTime}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        setStartDateTime(newValue);
                                        if (endDateTime && new Date(endDateTime) <= new Date(newValue)) {
                                            setEndDateTime(null);
                                            warning('End date must be after start date. Please select a new end date.');
                                        }
                                    }}
                                    minDate={new Date()}
                                    placeholder="Select start date and time"
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
                                    bookedDates={bookedDates}
                                    rateType={selectedRateType}
                                    unitId={id}
                                    onWarning={warning}
                                />
                            </div>
                        </div>

                        {startDateTime && endDateTime && !isOwner && (
                            <div className="DedicatedDeskDetail_summary">
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>Starting Date</span>
                                    <span>{new Date(startDateTime).toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>Ending Date</span>
                                    <span>{new Date(endDateTime).toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row">
                                    <span>
                                        {rateDisplay.rate?.toLocaleString()} PKR × {quantity} {getUnitLabel()}
                                    </span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                                <div className="DedicatedDeskDetail_summary-row DedicatedDeskDetail_summary-total">
                                    <span>Total</span>
                                    <span>PKR {total.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        <button
                            className="DedicatedDeskDetail_continue-btn"
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

                    {/* IMAGE SLIDER SECTION */}
                    <div className="DedicatedDeskDetail_right">
                        <div
                            className="DedicatedDeskDetail_gallery"
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
                                        <div className="image-loader-overlay" style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#f5f5f5',
                                            zIndex: 5
                                        }}>
                                            <div className="image-circle-spinner"></div>
                                        </div>
                                    )}

                                    <img
                                        key={currentImage}
                                        src={images[currentImage]}
                                        alt={`${space.title} - Image ${currentImage + 1}`}
                                        className="DedicatedDeskDetail_main-img"
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
                                            console.error('Image failed to load');
                                            e.target.src = 'https://picsum.photos/id/20/800/500';
                                            setImageLoading(false);
                                        }}
                                    />

                                    {images.length > 1 && (
                                        <>
                                            <button
                                                className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_prev"
                                                onClick={prevImage}
                                                aria-label="Previous image"
                                                style={{
                                                    position: 'absolute',
                                                    left: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 10,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '24px',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ‹
                                            </button>
                                            <button
                                                className="DedicatedDeskDetail_img-nav DedicatedDeskDetail_next"
                                                onClick={nextImage}
                                                aria-label="Next image"
                                                style={{
                                                    position: 'absolute',
                                                    right: '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    zIndex: 10,
                                                    background: 'rgba(0,0,0,0.5)',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '24px',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                ›
                                            </button>
                                            <div className="DedicatedDeskDetail_img-counter" style={{
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
                                <div className="DedicatedDeskDetail_no-img" style={{
                                    width: '100%',
                                    minHeight: '400px',
                                    maxHeight: '450px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f5f5f5'
                                }}>
                                    <div className="image-circle-spinner"></div>
                                </div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="DedicatedDeskDetail_thumbnails" style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '16px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                {images.slice(0, 6).map((img, i) => (
                                    <div
                                        key={i}
                                        className={`DedicatedDeskDetail_thumb_wrapper ${i === currentImage ? 'active' : ''}`}
                                        onClick={() => goToImage(i)}
                                        style={{
                                            cursor: 'pointer',
                                            width: '70px',
                                            height: '70px',
                                            flexShrink: 0,
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: i === currentImage ? '2px solid #01095A' : '2px solid transparent',
                                            position: 'relative',
                                            backgroundColor: '#f5f5f5'
                                        }}
                                    >
                                        {imageLoading && i === currentImage && (
                                            <div className="thumbnail-spinner-overlay" style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: '#f5f5f5',
                                                zIndex: 2
                                            }}>
                                                <div className="thumbnail-circle-spinner"></div>
                                            </div>
                                        )}
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="DedicatedDeskDetail_thumb"
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center',
                                                opacity: (imageLoading && i === currentImage) ? 0 : 1
                                            }}
                                            onError={(e) => {
                                                e.target.src = 'https://picsum.photos/id/20/400/200';
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="DedicatedDeskDetail_bottom">
                    <div className="DedicatedDeskDetail_section">
                        <h3 className="DedicatedDeskDetail_section-title">About this space</h3>
                        <p className="DedicatedDeskDetail_description">
                            {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city || space.location}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
                        </p>
                    </div>

                    {(space.opening_time && space.closing_time) && (
                        <div className="DedicatedDeskDetail_section">
                            <h3 className="DedicatedDeskDetail_section-title">Working Hours</h3>
                            <p className="DedicatedDeskDetail_working_hours">
                                ⏰ {space.opening_time} - {space.closing_time}
                            </p>
                            {space.working_days && space.working_days.length > 0 && (
                                <p className="DedicatedDeskDetail_working_days">
                                    📅 {space.working_days.join(', ')}
                                </p>
                            )}
                        </div>  
                    )}

                    {amenities.length > 0 && (
                        <div className="DedicatedDeskDetail_section">
                            <h3 className="DedicatedDeskDetail_section-title">Amenities</h3>
                            <div className="DedicatedDeskDetail_features">
                                {amenities.map((item, i) => (
                                    <span key={i} className="DedicatedDeskDetail_feature-tag">✓ {item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="DedicatedDeskDetail_section">
                        <h3 className="DedicatedDeskDetail_section-title">Space Information</h3>
                        <div className="DedicatedDeskDetail_space_info">
                            {space.space_name && <p><strong>🏢 Space Name:</strong> {space.space_name}</p>}
                            <p><strong>📌 Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
                            {space.total_capacity && <p><strong>👥 Total Capacity:</strong> {space.total_capacity} seats</p>}
                            {space.address && <p><strong>📍 Address:</strong> {space.address}</p>}
                            {space.city && <p><strong>🌆 City:</strong> {space.city}</p>}
                            {isOwner && <p className="verified">👑 You are the owner of this space</p>}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DedicatedDeskDetail;