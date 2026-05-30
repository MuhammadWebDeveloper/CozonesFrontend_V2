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
    const location = useLocation(); // Add this
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRateType, setSelectedRateType] = useState('daily');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [user, setUser] = useState(null);

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
                    success('Welcome back! 👋');
                } catch (err) {
                    console.error('Error fetching user:', err);
                    // Don't show error for this as it's not critical
                }
            }
        };
        getUser();
    }, []);



    useEffect(() => {
        // Check if we have pre-filled dates from navigation state
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

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;
                    console.log('Unit Data:', unitData);

                    // Determine rate type
                    let rateType = 'daily';
                    if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0) {
                        rateType = 'hourly';
                    } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0) {
                        rateType = 'daily';
                    } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0) {
                        rateType = 'monthly';
                    }

                    // Handle images
                    let imagesArray = [];
                    if (unitData.images) {
                        if (Array.isArray(unitData.images)) {
                            imagesArray = unitData.images;
                        } else if (typeof unitData.images === 'string') {
                            try {
                                const parsed = JSON.parse(unitData.images);
                                imagesArray = Array.isArray(parsed) ? parsed : [parsed];
                            } catch (e) {
                                imagesArray = [unitData.images];
                            }
                        }
                    }

                    const transformedSpace = {
                        id: unitData.id,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Workspace",
                        description: unitData.space?.description || "A comfortable workspace with all necessary amenities",
                        location: unitData.space?.city || "Coworking Space",
                        area: unitData.space?.area,
                        address: unitData.space?.address,
                        city: unitData.space?.city,
                        rateType: rateType,
                        hourly_rate: unitData.hourly_rate ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate ? parseFloat(unitData.monthly_rate) : null,
                        total_capacity: unitData.total_capacity,
                        unit_type: unitData.unit_type,
                        images: imagesArray,
                        space: unitData.space,
                        space_amenities: unitData.space_amenities,
                        policies: unitData.policies,
                        is_active: unitData.is_active,
                        owner_id: unitData.space?.owner_id
                    };

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                    success('Space details loaded successfully! 🎉');
                } else {
                    console.error('Invalid response structure:', response.data);
                    error('Space not found or invalid data structure');
                }
            } catch (err) {
                console.error('Error fetching space:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    config: err.config
                });

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
        if (!user || !space) return false;
        return user.id === space.owner_id;
    };

    const getImages = () => {
        if (space?.images && space.images.length > 0) {
            return space.images;
        }

        const fallbackImages = {
            'open_desk': 'https://www.tripadvisor.com/Attraction_Review-g295424-d10687494-Reviews-IMG_Worlds_of_Adventure-Dubai_Emirate_of_Dubai.html',
            'dedicated_desk': 'https://www.tripadvisor.com/Attraction_Review-g295424-d10687494-Reviews-IMG_Worlds_of_Adventure-Dubai_Emirate_of_Dubai.html',
            'private_cabin': 'https://www.tripadvisor.com/Attraction_Review-g295424-d10687494-Reviews-IMG_Worlds_of_Adventure-Dubai_Emirate_of_Dubai.html',
            'meeting_room': 'https://www.tripadvisor.com/Attraction_Review-g295424-d10687494-Reviews-IMG_Worlds_of_Adventure-Dubai_Emirate_of_Dubai.html'
        };

        return [fallbackImages[space?.unit_type] || fallbackImages.open_desk];
    };

    const images = getImages();

    const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

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
            error('You cannot book your own space!');
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

            console.log(bookingData);


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

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();

    const renderAmenities = () => {
        const amenities = space?.space_amenities || {};
        const amenityList = [];

        if (amenities.wifi) amenityList.push('WiFi');
        if (amenities.ac) amenityList.push('Air Conditioning');
        if (amenities.coffee) amenityList.push('Free Coffee');
        if (amenities.printer) amenityList.push('Printer');
        if (amenities.parking) amenityList.push('Parking');
        if (amenities.security) amenityList.push('24/7 Security');
        if (amenities.backup_power) amenityList.push('Backup Power');

        return amenityList;
    };

    const getAvailableRateTypes = () => {
        const types = [];
        if (space?.hourly_rate && space.hourly_rate > 0 && space.hourly_rate !== -999)
            types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
        if (space?.daily_rate && space.daily_rate > 0 && space.daily_rate !== -999)
            types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
        if (space?.monthly_rate && space.monthly_rate > 0 && space.monthly_rate !== -999)
            types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
        return types;
    };

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

                {isOwnSpace() && (
                    <div className="SpaceDetail_owner_warning">
                        ⚠️ This is your own space. You cannot book it.
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
                            📍 {space.city}, {space.area}
                            {space.address && <span> - {space.address}</span>}
                        </p>

                        {space.total_capacity && (
                            <p className="SpaceDetail_meta">
                                👥 Capacity: {space.total_capacity} people
                            </p>
                        )}

                        <p className="SpaceDetail_meta">
                            Availability: <span className="SpaceDetail_available">
                                {space.is_active !== false ? 'Available' : 'Currently Unavailable'}
                            </span>
                        </p>

                        {getAvailableRateTypes().length > 1 && (
                            <div className="SpaceDetail_rate_selector">
                                <label>Select Pricing Plan:</label>
                                <div className="SpaceDetail_rate_options">
                                    {getAvailableRateTypes().map(type => (
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

                        {/* Date & Time Selection Section */}
                        <div className="SpaceDetail_datetime_section">
                            <h3 className="SpaceDetail_section_title">Select Date & Time</h3>
                            <div className="SpaceDetail_datetime_grid">
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={startDate}
                                    onChange={handleStartDateChange}
                                    minDate={new Date().toISOString()}
                                    placeholder="Select start date and time"
                                />
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={endDate}
                                    onChange={handleEndDateChange}
                                    minDate={startDate || new Date().toISOString()}
                                    placeholder="Select end date and time"
                                />
                            </div>
                        </div>

                        {startDate && endDate && (
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
                            disabled={!startDate || !endDate || bookingLoading || isOwnSpace() || !user}
                            onClick={handleBooking}
                        >
                            {bookingLoading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Processing...
                                </>
                            ) : (
                                'Confirm Booking'
                            )}
                        </button>
                    </div>

                    <div className="SpaceDetail_right">
                        <div className="SpaceDetail_gallery">
                            {images.length > 0 && images[0] ? (
                                <img
                                    src={images[currentImage]}
                                    alt={space.title}
                                    className="SpaceDetail_main-img"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c';
                                    }}
                                />
                            ) : (
                                <div className="SpaceDetail_no-img">No image available</div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <button className="SpaceDetail_img-nav SpaceDetail_prev" onClick={prevImage}>‹</button>
                                    <button className="SpaceDetail_img-nav SpaceDetail_next" onClick={nextImage}>›</button>
                                    <div className="SpaceDetail_img-counter">
                                        {currentImage + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="SpaceDetail_thumbnails">
                                {images.slice(0, 5).map((img, i) => (
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
                            {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
                        </p>
                    </div>

                    {space.space?.opening_time && space.space?.closing_time && (
                        <div className="SpaceDetail_section">
                            <h3 className="SpaceDetail_section-title">Working Hours</h3>
                            <p className="SpaceDetail_working_hours">
                                {space.space.opening_time} - {space.space.closing_time}
                            </p>
                            {space.space.working_days && (
                                <p className="SpaceDetail_working_days">
                                    {space.space.working_days.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {renderAmenities().length > 0 && (
                        <div className="SpaceDetail_section">
                            <h3 className="SpaceDetail_section-title">Amenities</h3>
                            <div className="SpaceDetail_features">
                                {renderAmenities().map((item, i) => (
                                    <span key={i} className="SpaceDetail_feature-tag">✓ {item}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {space.space && (
                        <div className="SpaceDetail_section">
                            <h3 className="SpaceDetail_section-title">Space Information</h3>
                            <div className="SpaceDetail_space_info">
                                <p><strong>Space Name:</strong> {space.space.name}</p>
                                <p><strong>Unit Type:</strong> {space.unit_type?.replace('_', ' ')}</p>
                                {space.total_capacity && <p><strong>Total Capacity:</strong> {space.total_capacity} seats</p>}
                                {space.space.is_verified && <p className="verified">✓ Verified Space</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SpaceDetail;