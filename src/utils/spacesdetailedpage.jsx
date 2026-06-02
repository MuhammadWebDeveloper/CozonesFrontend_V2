import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../componentstyles/utilstyle/SpaceDetail.css';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import DateTimePicker from './DateTimePicker';
import BaseUrl from './AppConstants';

const SpaceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);

    // Image navigation functions
    const nextImage = () => {
        if (space?.images && space.images.length > 0) {
            setCurrentImage((prev) => (prev + 1) % space.images.length);
        }
    };

    const prevImage = () => {
        if (space?.images && space.images.length > 0) {
            setCurrentImage((prev) => (prev - 1 + space.images.length) % space.images.length);
        }
    };

    // Axios instance
    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 30000,
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
                    console.log('Current user:', response.data.user);
                    success('Welcome back! 👋');
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
        };
        getUser();
    }, []);

    useEffect(() => {
        const { state } = location;
        if (state?.prefillStartDate && state?.prefillEndDate) {
            setStartDate(state.prefillStartDate);
            setEndDate(state.prefillEndDate);
            if (state.fromBookAgain) {
                info('📅 Previous booking dates loaded. You can modify them or select new dates to book again.');
            }
        }
    }, [location]);

    useEffect(() => {
        const fetchSpace = async () => {
            try {
                setLoading(true);
                console.log('Fetching space with ID:', id);

                const response = await apiClient.get(`api/spaces/unit/${id}`);
                console.log('API Response:', response.data);
                // Add this right after setting the transformedSpace, before setSpace:

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;
                    console.log('Unit Data:', unitData);

                    // Determine rate type based on available rates
                    let rateType = 'daily';
                    const hasHourly = unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0 && unitData.hourly_rate !== -999;
                    const hasDaily = unitData.daily_rate && parseFloat(unitData.daily_rate) > 0 && unitData.daily_rate !== -999;
                    const hasMonthly = unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0 && unitData.monthly_rate !== -999;

                    if (hasHourly) rateType = 'hourly';
                    else if (hasDaily) rateType = 'daily';
                    else if (hasMonthly) rateType = 'monthly';

                    // Handle images - images are objects with image_base64
                    let imagesArray = [];
                    if (unitData.images && Array.isArray(unitData.images)) {
                        imagesArray = unitData.images
                            .filter(img => img.image_base64)
                            .map(img => img.image_base64);
                    }

                    // If no images, use fallback based on unit type
                    if (imagesArray.length === 0) {
                        const fallbackImages = {
                            'open_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'dedicated_desk': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'private_cabin': 'https://images.unsplash.com/photo-1497366216548-37526070297c',
                            'meeting_room': 'https://images.unsplash.com/photo-1497366216548-37526070297c'
                        };
                        imagesArray = [fallbackImages[unitData.unit_type] || fallbackImages.open_desk];
                    }

                    // Get owner_id - check both possible locations
                    // Some APIs have owner_id directly, others have it in space object
                    let ownerId = null;
                    if (unitData.owner_id) {
                        ownerId = unitData.owner_id;
                    } else if (unitData.space?.owner_id) {
                        ownerId = unitData.space.owner_id;
                    } else if (unitData.space_owner_id) {
                        ownerId = unitData.space_owner_id;
                    }

                    console.log('Owner ID found:', ownerId);

                    const transformedSpace = {
                        // IDs
                        id: unitData.id,
                        space_id: unitData.space_id,

                        // Basic Info - directly from unitData
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Workspace",
                        description: unitData.space_description || "A comfortable workspace with all necessary amenities",
                        unit_type: unitData.unit_type,
                        total_capacity: unitData.total_capacity,
                        is_active: unitData.is_active !== false,

                        // Location Info - directly from unitData
                        city: unitData.city || 'City not specified',
                        area: unitData.area,
                        address: unitData.address || 'Address not specified',
                        latitude: unitData.latitude,
                        longitude: unitData.longitude,

                        // Working Hours - directly from unitData
                        opening_time: unitData.opening_time,
                        closing_time: unitData.closing_time,
                        working_days: unitData.working_days || [],

                        // Space names - directly from unitData
                        space_name: unitData.space_name,
                        space_description: unitData.space_description,

                        // Rates
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate && unitData.hourly_rate !== -999 ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate && unitData.daily_rate !== -999 ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate && unitData.monthly_rate !== -999 ? parseFloat(unitData.monthly_rate) : null,

                        // Amenities - directly from unitData
                        has_wifi: unitData.has_wifi || false,
                        has_ac: unitData.has_ac || false,
                        has_coffee: unitData.has_coffee || false,
                        has_printer: unitData.has_printer || false,
                        has_parking: unitData.has_parking || false,
                        has_security: unitData.has_security || false,
                        has_backup_power: unitData.has_backup_power || false,

                        // Images
                        images: imagesArray,
                        owner_id: ownerId
                    };

                    console.log('Transformed Space:', transformedSpace);
                    console.log('Owner ID in transformed space:', transformedSpace.owner_id);

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    success('Space details loaded successfully! 🎉');
                } else {
                    console.error('Invalid response structure:', response.data);
                    error('Space not found or invalid data structure');
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
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSpace();
        } else {
            error('No space ID provided');
            setLoading(false);
        }
    }, [id]);

    const isOwnSpace = () => {
        if (!user || !space) {
            console.log('isOwnSpace check failed - missing user or space');
            return false;
        }
        const isOwner = user.id === space.owner_id;
        console.log('isOwnSpace check:', { userId: user.id, ownerId: space.owner_id, isOwner });
        return isOwner;
    };

    const getRateDisplay = () => {
        if (!space) return { rate: 0, unit: 'day', value: 0 };

        switch (selectedRateType) {
            case 'hourly':
                return { rate: space.hourly_rate, unit: 'hour', value: space.hourly_rate || 0 };
            case 'daily':
                return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
            case 'monthly':
                return { rate: space.monthly_rate, unit: 'month', value: space.monthly_rate || 0 };
            default:
                return { rate: space.daily_rate, unit: 'day', value: space.daily_rate || 0 };
        }
    };

    const calcHours = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    };

    const calcDays = () => {
        if (!startDate || !endDate) return 0;
        const diff = new Date(endDate) - new Date(startDate);
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const calcMonths = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return Math.max(0, monthDiff);
    };

    const calculateTotal = () => {
        if (!startDate || !endDate) return 0;

        switch (selectedRateType) {
            case 'hourly':
                return calcHours() * (space?.hourly_rate || 0);
            case 'daily':
                return calcDays() * (space?.daily_rate || 0);
            case 'monthly':
                return calcMonths() * (space?.monthly_rate || 0);
            default:
                return calcDays() * (space?.daily_rate || 0);
        }
    };

    const getQuantity = () => {
        if (!startDate || !endDate) return 0;

        switch (selectedRateType) {
            case 'hourly':
                return calcHours();
            case 'daily':
                return calcDays();
            case 'monthly':
                return calcMonths();
            default:
                return calcDays();
        }
    };

    const getUnitLabel = () => {
        const qty = getQuantity();
        switch (selectedRateType) {
            case 'hourly':
                return qty === 1 ? 'hour' : 'hours';
            case 'daily':
                return qty === 1 ? 'night' : 'nights';
            case 'monthly':
                return qty === 1 ? 'month' : 'months';
            default:
                return qty === 1 ? 'night' : 'nights';
        }
    };

    const handleBooking = async () => {
        if (!user) {
            warning('Please login to book this space');
            setTimeout(() => {
                navigate('/login', { state: { from: `/space/${id}` } });
            }, 1500);
            return;
        }

        if (isOwnSpace()) {
            error('❌ You cannot book your own space! As the owner, you can edit your space instead.');
            return;
        }

        if (!startDate || !endDate) {
            warning('Please select both start and end dates');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

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
                start_time: new Date(startDate).toISOString(),
                end_time: new Date(endDate).toISOString(),
                total_price: totalPrice
            };

            console.log('Booking data:', bookingData);

            const response = await apiClient.post('api/bookings/createbooking', bookingData);

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

            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Session expired. Please login again';
                    setTimeout(() => navigate('/login'), 2000);
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }

            error(errorMessage);
        } finally {
            setBookingLoading(false);
        }
    };

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);

        if (endDate && new Date(endDate) <= new Date(newStartDate)) {
            warning('End date should be after start date');
            setEndDate('');
        }
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);

        if (startDate && new Date(newEndDate) <= new Date(startDate)) {
            warning('End date must be after start date');
            setEndDate('');
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

    if (loading) return (
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

                {/* Owner Warning - Prominent and Clear */}
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

                        {/* Date & Time Selection Section - Disabled for owner */}
                        <div className="SpaceDetail_datetime_section" style={{ opacity: isOwner ? 0.6 : 1 }}>
                            <h3 className="SpaceDetail_section_title">Select Date & Time</h3>
                            <div className="SpaceDetail_datetime_grid">
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    minDate={new Date().toISOString()}
                                    placeholder="Select start date and time"
                                    disabled={isOwner}
                                />
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    minDate={startDate || new Date().toISOString()}
                                    placeholder="Select end date and time"
                                    disabled={isOwner}
                                />
                            </div>
                        </div>

                        {startDate && endDate && !isOwner && (
                            <div className="SpaceDetail_summary">
                                <div className="SpaceDetail_summary-row">
                                    <span>Starting Date</span>
                                    <span>{new Date(startDate).toLocaleString()}</span>
                                </div>
                                <div className="SpaceDetail_summary-row">
                                    <span>Ending Date</span>
                                    <span>{new Date(endDate).toLocaleString()}</span>
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
                            disabled={isOwner || !startDate || !endDate || bookingLoading || !user || !space.is_active}
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

                        {/* Owner action buttons */}
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
                        <div className="SpaceDetail_gallery">
                            {space.images && space.images.length > 0 ? (
                                <img
                                    src={space.images[currentImage]}
                                    alt={space.title}
                                    className="SpaceDetail_main-img"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c';
                                    }}
                                />
                            ) : (
                                <div className="SpaceDetail_no-img">No image available</div>
                            )}

                            {space.images && space.images.length > 1 && (
                                <>
                                    <button className="SpaceDetail_img-nav SpaceDetail_prev" onClick={prevImage}>‹</button>
                                    <button className="SpaceDetail_img-nav SpaceDetail_next" onClick={nextImage}>›</button>
                                    <div className="SpaceDetail_img-counter">
                                        {currentImage + 1} / {space.images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {space.images && space.images.length > 1 && (
                            <div className="SpaceDetail_thumbnails">
                                {space.images.slice(0, 5).map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt={`view-${i}`}
                                        className={`SpaceDetail_thumb ${i === currentImage ? 'active' : ''}`}
                                        onClick={() => setCurrentImage(i)}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c';
                                        }}
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

                    {/* Working Hours Section */}
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

                    {/* Amenities Section */}
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

                    {/* Space Information Section */}
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