import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/sellerdashboardstyles/UpdateSpace.css';
import BaseUrl from '../../utils/AppConstants';

export default function UpdateSpace() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // FormData matching backend expected fields (20 parameters)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        area: '',
        opening_time: '',
        closing_time: '',
        working_days: '',
        has_wifi: false,
        has_ac: false,
        has_coffee: false,
        has_printer: false,
        has_parking: false,
        has_security: false,
        has_backup_power: false,
        cancellation_policy: '',
        refund_policy: '',
        late_arrival_policy: ''
    });

    const getAuthToken = () => localStorage.getItem('token');

    // Function to fetch space data from backend
    const fetchSpaceDataFromBackend = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(
                `${BaseUrl}api/spaces/owner/my-spaces`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success && response.data.spaces) {
                const space = response.data.spaces.find(s => s.id === id);
                if (space) {
                    return space;
                } else {
                    throw new Error('Space not found');
                }
            } else {
                throw new Error('Failed to load spaces');
            }
        } catch (err) {
            console.error('Error fetching space:', err);
            throw err;
        }
    };

    // Load space data - either from state or from backend
    useEffect(() => {
        const loadSpaceData = async () => {
            setLoading(true);

            try {
                let space = null;

                // First try to get data from location state (passed from SellerSpaces)
                if (location.state?.space) {
                    space = location.state.space;
                } else {
                    // If no state, try to fetch from backend
                    space = await fetchSpaceDataFromBackend();
                }

                if (space) {
                    setFormData({
                        name: space.name || '',
                        description: space.description || '',
                        address: space.address || '',
                        city: space.city || '',
                        area: space.area || '',
                        opening_time: space.opening_time || '',
                        closing_time: space.closing_time || '',
                        working_days: space.working_days || '',
                        has_wifi: space.has_wifi || false,
                        has_ac: space.has_ac || false,
                        has_coffee: space.has_coffee || false,
                        has_printer: space.has_printer || false,
                        has_parking: space.has_parking || false,
                        has_security: space.has_security || false,
                        has_backup_power: space.has_backup_power || false,
                        cancellation_policy: space.cancellation_policy || '',
                        refund_policy: space.refund_policy || '',
                        late_arrival_policy: space.late_arrival_policy || ''
                    });
                } else {
                    setError('Space not found');
                    setTimeout(() => {
                        navigate('/seller-dashboard');
                    }, 2000);
                }
            } catch (err) {
                console.error('Error loading space:', err);
                setError(err.response?.data?.message || 'Failed to load space details');
                setTimeout(() => {
                    navigate('/seller-dashboard');
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadSpaceData();
        }
    }, [id, location.state, navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleWorkingDaysChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            working_days: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const token = getAuthToken();

            // Prepare submit data - only include fields that have values
            const submitData = {};

            if (formData.name) submitData.name = formData.name;
            if (formData.description) submitData.description = formData.description;
            if (formData.address) submitData.address = formData.address;
            if (formData.city) submitData.city = formData.city;
            if (formData.area) submitData.area = formData.area;
            if (formData.opening_time) submitData.opening_time = formData.opening_time;
            if (formData.closing_time) submitData.closing_time = formData.closing_time;
            if (formData.working_days) submitData.working_days = formData.working_days;

            // Boolean values - always send
            submitData.has_wifi = formData.has_wifi;
            submitData.has_ac = formData.has_ac;
            submitData.has_coffee = formData.has_coffee;
            submitData.has_printer = formData.has_printer;
            submitData.has_parking = formData.has_parking;
            submitData.has_security = formData.has_security;
            submitData.has_backup_power = formData.has_backup_power;

            if (formData.cancellation_policy) submitData.cancellation_policy = formData.cancellation_policy;
            if (formData.refund_policy) submitData.refund_policy = formData.refund_policy;
            if (formData.late_arrival_policy) submitData.late_arrival_policy = formData.late_arrival_policy;

            console.log('Submitting data:', submitData);

            const response = await axios.put(
                `${BaseUrl}api/spaces/updating/${id}`,
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess('Space updated successfully!');
                setTimeout(() => {
                    navigate('/seller-dashboard');
                }, 1500);
            } else {
                setError(response.data.message || 'Failed to update space');
            }
        } catch (err) {
            console.error('Error updating space:', err);
            setError(err.response?.data?.message || 'An error occurred while updating the space');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            navigate('/seller-dashboard');
        }
    };

    if (loading) {
        return (
            <div className="us__main">
                <div className="us__loading">
                    <div className="us__loader"></div>
                    <p>Loading space details...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="us__main">
            <div className="us__container">
                <div className="us__header">
                    <div className="us__header-left">
                        <button className="us__back-btn" onClick={handleCancel}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="us__title">Update Space</h1>
                            <p className="us__subtitle">Edit your space details</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="us__form">
                    {error && (
                        <div className="us__alert us__alert-error">
                            <div className="us__alert-icon">⚠️</div>
                            <div className="us__alert-content">
                                <strong>Error:</strong> {error}
                            </div>
                            <button type="button" className="us__alert-close" onClick={() => setError(null)}>×</button>
                        </div>
                    )}

                    {success && (
                        <div className="us__alert us__alert-success">
                            <div className="us__alert-icon">✓</div>
                            <div className="us__alert-content">
                                <strong>Success!</strong> {success}
                            </div>
                        </div>
                    )}

                    <div className="us__form-grid">
                        {/* Left Column */}
                        <div className="us__form-column">
                            {/* Basic Information */}
                            <div className="us__section">
                                <h2 className="us__section-title">Basic Information</h2>

                                <div className="us__form-group">
                                    <label className="us__label">Space Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="us__input"
                                        placeholder="Enter space name"
                                    />
                                </div>

                                <div className="us__form-group">
                                    <label className="us__label">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="us__textarea"
                                        rows="4"
                                        placeholder="Describe your space..."
                                    />
                                </div>

                                <div className="us__form-group">
                                    <label className="us__label">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="us__input"
                                        placeholder="Full address"
                                    />
                                </div>

                                <div className="us__location-group">
                                    <div className="us__form-group">
                                        <label className="us__label">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="us__input"
                                            placeholder="City"
                                        />
                                    </div>

                                    <div className="us__form-group">
                                        <label className="us__label">Area</label>
                                        <input
                                            type="text"
                                            name="area"
                                            value={formData.area}
                                            onChange={handleInputChange}
                                            className="us__input"
                                            placeholder="Area/District"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Operating Hours */}
                            <div className="us__section">
                                <h2 className="us__section-title">Operating Hours</h2>

                                <div className="us__hours-group">
                                    <div className="us__form-group">
                                        <label className="us__label">Opening Time</label>
                                        <input
                                            type="time"
                                            name="opening_time"
                                            value={formData.opening_time}
                                            onChange={handleInputChange}
                                            className="us__input"
                                        />
                                    </div>

                                    <div className="us__form-group">
                                        <label className="us__label">Closing Time</label>
                                        <input
                                            type="time"
                                            name="closing_time"
                                            value={formData.closing_time}
                                            onChange={handleInputChange}
                                            className="us__input"
                                        />
                                    </div>
                                </div>

                                <div className="us__form-group">
                                    <label className="us__label">Working Days</label>
                                    <select
                                        name="working_days"
                                        value={formData.working_days}
                                        onChange={handleWorkingDaysChange}
                                        className="us__select"
                                    >
                                        <option value="">Select working days</option>
                                        <option value="Monday-Friday">Monday - Friday</option>
                                        <option value="Monday-Saturday">Monday - Saturday</option>
                                        <option value="Monday-Sunday">Monday - Sunday (All Week)</option>
                                        <option value="Weekends Only">Weekends Only</option>
                                        <option value="Custom">Custom Schedule</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="us__form-column">
                            {/* Amenities */}
                            <div className="us__section">
                                <h2 className="us__section-title">Amenities</h2>

                                <div className="us__amenities-grid">
                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_wifi"
                                            checked={formData.has_wifi}
                                            onChange={handleInputChange}
                                        />
                                        <span>✓ WiFi</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_ac"
                                            checked={formData.has_ac}
                                            onChange={handleInputChange}
                                        />
                                        <span>❄️ Air Conditioning</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_coffee"
                                            checked={formData.has_coffee}
                                            onChange={handleInputChange}
                                        />
                                        <span>☕ Coffee Machine</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_printer"
                                            checked={formData.has_printer}
                                            onChange={handleInputChange}
                                        />
                                        <span>🖨️ Printer</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_parking"
                                            checked={formData.has_parking}
                                            onChange={handleInputChange}
                                        />
                                        <span>🅿️ Parking</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_security"
                                            checked={formData.has_security}
                                            onChange={handleInputChange}
                                        />
                                        <span>🔒 Security</span>
                                    </label>

                                    <label className="us__checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="has_backup_power"
                                            checked={formData.has_backup_power}
                                            onChange={handleInputChange}
                                        />
                                        <span>⚡ Backup Power</span>
                                    </label>
                                </div>
                            </div>

                            {/* Policies */}
                            <div className="us__section">
                                <h2 className="us__section-title">Policies</h2>

                                <div className="us__form-group">
                                    <label className="us__label">Cancellation Policy</label>
                                    <textarea
                                        name="cancellation_policy"
                                        value={formData.cancellation_policy}
                                        onChange={handleInputChange}
                                        className="us__textarea"
                                        rows="2"
                                        placeholder="Describe cancellation policy..."
                                    />
                                </div>

                                <div className="us__form-group">
                                    <label className="us__label">Refund Policy</label>
                                    <textarea
                                        name="refund_policy"
                                        value={formData.refund_policy}
                                        onChange={handleInputChange}
                                        className="us__textarea"
                                        rows="2"
                                        placeholder="Describe refund policy..."
                                    />
                                </div>

                                <div className="us__form-group">
                                    <label className="us__label">Late Arrival Policy</label>
                                    <textarea
                                        name="late_arrival_policy"
                                        value={formData.late_arrival_policy}
                                        onChange={handleInputChange}
                                        className="us__textarea"
                                        rows="2"
                                        placeholder="Describe late arrival policy..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="us__actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="us__btn us__btn-secondary"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="us__btn us__btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : 'Update Space'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}