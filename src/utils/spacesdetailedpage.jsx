import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../componentstyles/utilstyle/SpaceDetail.css';

const SpaceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [space, setSpace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [activeTab, setActiveTab] = useState('start');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedRateType, setSelectedRateType] = useState('daily');

    // Axios instance
    const apiClient = axios.create({
        baseURL: 'http://localhost:4343/',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    useEffect(() => {
        const fetchSpace = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`api/spaces/unit/${id}`);

                if (response.data?.success && response.data?.unit) {
                    const unitData = response.data.unit;

                    // Determine which rate type is available
                    let rateType = 'daily';
                    let rateValue = 0;

                    if (unitData.hourly_rate && parseFloat(unitData.hourly_rate) > 0) {
                        rateType = 'hourly';
                        rateValue = parseFloat(unitData.hourly_rate);
                    } else if (unitData.daily_rate && parseFloat(unitData.daily_rate) > 0) {
                        rateType = 'daily';
                        rateValue = parseFloat(unitData.daily_rate);
                    } else if (unitData.monthly_rate && parseFloat(unitData.monthly_rate) > 0) {
                        rateType = 'monthly';
                        rateValue = parseFloat(unitData.monthly_rate);
                    }

                    // Handle images - they are already Base64 strings
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

                    // Transform the unit data
                    const transformedSpace = {
                        id: unitData.id,
                        title: unitData.name || unitData.unit_type?.replace('_', ' ') || "Workspace",
                        description: unitData.space?.description || "A comfortable workspace with all necessary amenities",
                        location: unitData.space?.city || "Coworking Space",
                        area: unitData.space?.area,
                        address: unitData.space?.address,
                        city: unitData.space?.city,
                        // Rate information
                        rateType: rateType,
                        rateValue: rateValue,
                        hourly_rate: unitData.hourly_rate ? parseFloat(unitData.hourly_rate) : null,
                        daily_rate: unitData.daily_rate ? parseFloat(unitData.daily_rate) : null,
                        monthly_rate: unitData.monthly_rate ? parseFloat(unitData.monthly_rate) : null,
                        total_capacity: unitData.total_capacity,
                        unit_type: unitData.unit_type,
                        images: imagesArray, // Store Base64 images directly
                        space: unitData.space,
                        space_amenities: unitData.space_amenities,
                        policies: unitData.policies,
                        is_active: unitData.is_active,
                        created_at: unitData.created_at,
                        updated_at: unitData.updated_at
                    };

                    setSpace(transformedSpace);
                    setSelectedRateType(rateType);
                } else {
                    setError('Space not found');
                }
            } catch (err) {
                console.error('Error fetching space:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpace();
    }, [id]);

    // Get images array - handles Base64 strings directly
    const getImages = () => {
        if (space?.images && space.images.length > 0) {
            // Return Base64 strings directly - they are ready to use
            return space.images;
        }

        // Fallback images if no images available
        if (space?.unit_type === 'open_desk') {
            return ['https://images.unsplash.com/photo-1497366216548-37526070297c'];
        }
        if (space?.unit_type === 'dedicated_desk') {
            return ['https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c'];
        }
        if (space?.unit_type === 'private_cabin') {
            return ['https://images.unsplash.com/photo-1497366216548-37526070297c'];
        }
        if (space?.unit_type === 'meeting_room') {
            return ['https://images.unsplash.com/photo-1497366754035-f2001d9f5d8c'];
        }

        return ['https://images.unsplash.com/photo-1497366216548-37526070297c'];
    };

    const images = getImages();

    const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

    // Calculate based on rate type
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

    // Get current rate display
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

    // Calculate total based on selected rate type
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

    const rateDisplay = getRateDisplay();
    const quantity = getQuantity();
    const total = calculateTotal();

    // Helper to render amenities
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

    // Get available rate types
    const getAvailableRateTypes = () => {
        const types = [];
        if (space?.hourly_rate && space.hourly_rate > 0 && space.hourly_rate !== -999) types.push({ key: 'hourly', label: 'Hourly', rate: space.hourly_rate });
        if (space?.daily_rate && space.daily_rate > 0 && space.daily_rate !== -999) types.push({ key: 'daily', label: 'Daily', rate: space.daily_rate });
        if (space?.monthly_rate && space.monthly_rate > 0 && space.monthly_rate !== -999) types.push({ key: 'monthly', label: 'Monthly', rate: space.monthly_rate });
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
            <p>Space not found.</p>
            <button onClick={() => navigate(-1)} className="SpaceDetail_back-btn">Go Back</button>
        </div>
    );

    return (
        <div className="SpaceDetail_page">
            <button className="SpaceDetail_back-btn" onClick={() => navigate(-1)}>
                Back to spaces
            </button>

            <h2 className="SpaceDetail_page-title">Space Details</h2>

            {/* Unit Type Badge */}
            {space.unit_type && (
                <div className="SpaceDetail_unit_badge">
                    {space.unit_type.replace('_', ' ').toUpperCase()}
                </div>
            )}

            <div className="SpaceDetail_top-grid">
                {/* LEFT — Booking */}
                <div className="SpaceDetail_left">
                    <h1 className="SpaceDetail_title">{space.title}</h1>

                    {/* Location Info */}
                    <p className="SpaceDetail_meta">
                        📍 {space.city}, {space.area}
                        {space.address && <span> - {space.address}</span>}
                    </p>

                    {/* Capacity Info */}
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

                    {/* Rate Type Selector - Only show if multiple rate types available */}
                    {getAvailableRateTypes().length > 1 && (
                        <div className="SpaceDetail_rate_selector">
                            <label>Select Pricing Plan:</label>
                            <div className="SpaceDetail_rate_options">
                                {getAvailableRateTypes().map(type => (
                                    <button
                                        key={type.key}
                                        className={`SpaceDetail_rate_option ${selectedRateType === type.key ? 'active' : ''}`}
                                        onClick={() => setSelectedRateType(type.key)}
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

                    {/* Pricing Info - Single Rate Display */}
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

                    {/* Date Tabs */}
                    <div className="SpaceDetail_tabs">
                        <button
                            className={`SpaceDetail_tab ${activeTab === 'start' ? 'active' : ''}`}
                            onClick={() => setActiveTab('start')}
                        >
                            Starting Date
                        </button>
                        <button
                            className={`SpaceDetail_tab ${activeTab === 'end' ? 'active' : ''}`}
                            onClick={() => setActiveTab('end')}
                        >
                            Ending Date
                        </button>
                    </div>

                    {/* Date Input */}
                    <div className="SpaceDetail_date-input-wrap">
                        {activeTab === 'start' ? (
                            <input
                                type="date"
                                className="SpaceDetail_date-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        ) : (
                            <input
                                type="date"
                                className="SpaceDetail_date-input"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Summary Card */}
                    {startDate && endDate && (
                        <div className="SpaceDetail_summary">
                            <div className="SpaceDetail_summary-row">
                                <span>Starting Date</span>
                                <span>{formatDate(startDate)}</span>
                            </div>
                            <div className="SpaceDetail_summary-row">
                                <span>Ending Date</span>
                                <span>{formatDate(endDate)}</span>
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
                        disabled={!startDate || !endDate}
                    >
                        Continue to Booking
                    </button>
                </div>

                {/* RIGHT — Image Gallery */}
                <div className="SpaceDetail_right">
                    <div className="SpaceDetail_gallery">
                        {images.length > 0 && images[0] ? (
                            <img
                                src={images[currentImage]}
                                alt={space.title}
                                className="SpaceDetail_main-img"
                                onError={(e) => {
                                    // Fallback if image fails to load
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

            {/* Bottom — Description & Features */}
            <div className="SpaceDetail_bottom">
                <div className="SpaceDetail_section">
                    <h3 className="SpaceDetail_section-title">About this space</h3>
                    <p className="SpaceDetail_description">
                        {space.description || `A premium ${space.unit_type?.replace('_', ' ') || 'workspace'} located in the heart of ${space.city}. Perfect for professionals, freelancers, and teams looking for a productive environment.`}
                    </p>
                </div>

                {/* Working Hours */}
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

                {/* Amenities */}
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

                {/* Space Info */}
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
    );
};

export default SpaceDetail;