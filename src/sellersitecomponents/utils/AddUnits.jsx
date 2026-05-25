import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/sellerdashboardstyles/AddUnit.css';

export default function AddUnit() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [spaceName, setSpaceName] = useState('');
    const [existingUnitTypes, setExistingUnitTypes] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activePricing, setActivePricing] = useState(''); // 'hourly', 'daily', 'monthly'

    const [formData, setFormData] = useState({
        unit_type: '',
        name: '',
        total_capacity: '',
        hourly_rate: '',
        daily_rate: '',
        monthly_rate: '',
        images: [],
        duration: '',
        is_active: true,
        active_pricing_type: ''
    });

    const getAuthToken = () => localStorage.getItem('token');

    useEffect(() => {
        fetchSpaceDetails();
        fetchExistingUnits();
    }, [spaceId]);

    const fetchSpaceDetails = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`http://localhost:4343/api/spaces/owner/my-spaces`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                const space = response.data.spaces.find(s => s.id === spaceId);
                if (space) {
                    setSpaceName(space.name);
                }
            }
        } catch (error) {
            console.error('Failed to fetch space:', error);
        }
    };

    // Fetch existing units to check for duplicates
    const fetchExistingUnits = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`http://localhost:4343/api/spaces/${spaceId}/units`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success && response.data.units) {
                const existingTypes = response.data.units.map(unit => unit.unit_type);
                setExistingUnitTypes(existingTypes);
            }
        } catch (error) {
            console.error('Failed to fetch existing units:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePricingChange = (type) => {
        setActivePricing(type);
        setFormData(prev => ({
            ...prev,
            active_pricing_type: type,
            // Clear other pricing fields when switching
            hourly_rate: type === 'hourly' ? prev.hourly_rate : '',
            daily_rate: type === 'daily' ? prev.daily_rate : '',
            monthly_rate: type === 'monthly' ? prev.monthly_rate : ''
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imagePromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
            });
        });

        Promise.all(imagePromises).then(images => {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...images]
            }));
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    // Check if unit type already exists
    const isUnitTypeDuplicate = () => {
        if (existingUnitTypes.includes(formData.unit_type)) {
            setMessage({
                type: 'error',
                text: `A "${formData.unit_type.replace('_', ' ')}" already exists in this space. Each unit type can only be created once.`
            });
            return true;
        }
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validation
        if (!formData.unit_type) {
            setMessage({ type: 'error', text: 'Please select a unit type' });
            setLoading(false);
            return;
        }

        // Check for duplicate unit type
        if (isUnitTypeDuplicate()) {
            setLoading(false);
            return;
        }

        if (!formData.total_capacity) {
            setMessage({ type: 'error', text: 'Please enter total capacity' });
            setLoading(false);
            return;
        }

        // Validate pricing selection
        if (!activePricing) {
            setMessage({ type: 'error', text: 'Please select a pricing plan (Hourly, Daily, or Monthly)' });
            setLoading(false);
            return;
        }

        if (activePricing === 'hourly' && (!formData.hourly_rate || formData.hourly_rate <= 0)) {
            setMessage({ type: 'error', text: 'Please enter a valid hourly rate (greater than 0)' });
            setLoading(false);
            return;
        }

        if (activePricing === 'daily' && (!formData.daily_rate || formData.daily_rate <= 0)) {
            setMessage({ type: 'error', text: 'Please enter a valid daily rate (greater than 0)' });
            setLoading(false);
            return;
        }

        if (activePricing === 'monthly' && (!formData.monthly_rate || formData.monthly_rate <= 0)) {
            setMessage({ type: 'error', text: 'Please enter a valid monthly rate (greater than 0)' });
            setLoading(false);
            return;
        }

        try {
            const token = getAuthToken();

            // Prepare data for submission
            const submitData = {
                unit_type: formData.unit_type,
                name: formData.name,
                total_capacity: parseInt(formData.total_capacity),
                images: formData.images,
                duration: formData.duration || null,
                is_active: formData.is_active,
                active_pricing_type: activePricing,
                // Only send the selected pricing value, others will be set to -999 in backend
                hourly_rate: activePricing === 'hourly' ? parseFloat(formData.hourly_rate) : null,
                daily_rate: activePricing === 'daily' ? parseFloat(formData.daily_rate) : null,
                monthly_rate: activePricing === 'monthly' ? parseFloat(formData.monthly_rate) : null
            };

            const response = await axios.post(
                `http://localhost:4343/api/spaces/${spaceId}/addunits`,
                submitData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Unit added successfully!' });
                setTimeout(() => {
                    navigate(`/space/${spaceId}`);
                }, 2000);
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Failed to add unit' });
            }
        } catch (error) {
            console.error('Failed to add unit:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Server error. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const unitTypes = [
        { value: 'open_desk', label: 'Open Desk', icon: '🖥️', description: 'Shared workspace in open area' },
        { value: 'dedicated_desk', label: 'Dedicated Desk', icon: '💺', description: 'Your own reserved desk' },
        { value: 'private_cabin', label: 'Private Cabin', icon: '🚪', description: 'Lockable private office' },
        { value: 'meeting_room', label: 'Meeting Room', icon: '📊', description: 'Conference room for meetings' }
    ];

    // Check if a unit type is disabled (already exists)
    const isUnitTypeDisabled = (typeValue) => {
        return existingUnitTypes.includes(typeValue);
    };

    return (
        <div className="au__container">
            <div className="au__header">
                <button onClick={() => navigate(`/space/${spaceId}`)} className="au__back-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Back to Space
                </button>
                <div className="au__header-title">
                    <h1>Add New Unit</h1>
                    <p>to {spaceName || 'your space'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="au__form">
                {/* Unit Type Selection */}
                <div className="au__section">
                    <h2 className="au__section-title">Select Unit Type</h2>
                    <p className="au__section-hint">Each unit type can only be created once per space.</p>
                    <div className="au__unit-types">
                        {unitTypes.map(type => {
                            const isDisabled = isUnitTypeDisabled(type.value);
                            return (
                                <label
                                    key={type.value}
                                    className={`au__unit-card ${formData.unit_type === type.value ? 'au__unit-card-active' : ''} ${isDisabled ? 'au__unit-card-disabled' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="unit_type"
                                        value={type.value}
                                        checked={formData.unit_type === type.value}
                                        onChange={handleInputChange}
                                        className="au__radio"
                                        disabled={isDisabled}
                                    />
                                    <div className="au__unit-icon">{type.icon}</div>
                                    <div className="au__unit-info">
                                        <h3>{type.label}</h3>
                                        <p>{type.description}</p>
                                        {isDisabled && <span className="au__disabled-badge">Already Added</span>}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Basic Information */}
                <div className="au__section">
                    <h2 className="au__section-title">Basic Information</h2>
                    <div className="au__form-grid">
                        <div className="au__field">
                            <label className="au__label">Unit Name (Optional)</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="au__input"
                                placeholder="e.g., Premium Desk 101"
                            />
                        </div>

                        <div className="au__field">
                            <label className="au__label">Total Capacity *</label>
                            <input
                                type="number"
                                name="total_capacity"
                                value={formData.total_capacity}
                                onChange={handleInputChange}
                                className="au__input"
                                placeholder="Number of people"
                                min="1"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Plan Selection - Only ONE active */}
                <div className="au__section">
                    <h2 className="au__section-title">Select Pricing Plan</h2>
                    <p className="au__section-hint">Choose ONE pricing plan for this unit. Only the selected plan will be active. Others will be set to inactive (-999).</p>

                    <div className="au__pricing-plans">
                        {/* Hourly Plan */}
                        <div
                            className={`au__pricing-card ${activePricing === 'hourly' ? 'au__pricing-card-active' : ''}`}
                            onClick={() => handlePricingChange('hourly')}
                        >
                            <div className="au__pricing-radio">
                                <div className={`au__radio-custom ${activePricing === 'hourly' ? 'au__radio-custom-active' : ''}`}>
                                    {activePricing === 'hourly' && <div className="au__radio-dot"></div>}
                                </div>
                            </div>
                            <div className="au__pricing-content">
                                <h3>⏱️ Hourly Rate</h3>
                                <p>Best for short-term bookings and meeting rooms</p>
                                <div className="au__pricing-input">
                                    <input
                                        type="number"
                                        name="hourly_rate"
                                        value={formData.hourly_rate}
                                        onChange={handleInputChange}
                                        className="au__input"
                                        placeholder="Enter hourly rate"
                                        step="1"
                                        min="0"
                                        disabled={activePricing !== 'hourly'}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="au__per">/hour (PKR)</span>
                                </div>
                                {/* {activePricing !== 'hourly' && (
                                    // <div className="au__inactive-badge">Inactive (will be set to -9)</div>
                                )} */}
                            </div>
                        </div>

                        {/* Daily Plan */}
                        <div
                            className={`au__pricing-card ${activePricing === 'daily' ? 'au__pricing-card-active' : ''}`}
                            onClick={() => handlePricingChange('daily')}
                        >
                            <div className="au__pricing-radio">
                                <div className={`au__radio-custom ${activePricing === 'daily' ? 'au__radio-custom-active' : ''}`}>
                                    {activePricing === 'daily' && <div className="au__radio-dot"></div>}
                                </div>
                            </div>
                            <div className="au__pricing-content">
                                <h3>📅 Daily Rate</h3>
                                <p>Perfect for daily workspace rentals</p>
                                <div className="au__pricing-input">
                                    <input
                                        type="number"
                                        name="daily_rate"
                                        value={formData.daily_rate}
                                        onChange={handleInputChange}
                                        className="au__input"
                                        placeholder="Enter daily rate"
                                        step="1"
                                        min="0"
                                        disabled={activePricing !== 'daily'}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="au__per">/day (PKR)</span>
                                </div>
                                {/* {activePricing !== 'daily' && (
                                    // <div className="au__inactive-badge">Inactive (will be set to -999)</div>
                                )} */}
                            </div>
                        </div>

                        {/* Monthly Plan */}
                        <div
                            className={`au__pricing-card ${activePricing === 'monthly' ? 'au__pricing-card-active' : ''}`}
                            onClick={() => handlePricingChange('monthly')}
                        >
                            <div className="au__pricing-radio">
                                <div className={`au__radio-custom ${activePricing === 'monthly' ? 'au__radio-custom-active' : ''}`}>
                                    {activePricing === 'monthly' && <div className="au__radio-dot"></div>}
                                </div>
                            </div>
                            <div className="au__pricing-content">
                                <h3>📆 Monthly Rate</h3>
                                <p>Best value for long-term commitments</p>
                                <div className="au__pricing-input">
                                    <input
                                        type="number"
                                        name="monthly_rate"
                                        value={formData.monthly_rate}
                                        onChange={handleInputChange}
                                        className="au__input"
                                        placeholder="Enter monthly rate"
                                        step="1"
                                        min="0"
                                        disabled={activePricing !== 'monthly'}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="au__per">/month (PKR)</span>
                                </div>
                                {/* {activePricing !== 'monthly' && (
                                    // <div className="au__inactive-badge">Inactive (will be set to -999)</div>
                                )} */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images Section */}
                <div className="au__section">
                    <h2 className="au__section-title">Images</h2>
                    <div className="au__image-upload">
                        <label className="au__upload-area">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="au__file-input"
                            />
                            <div className="au__upload-content">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <p>Click or drag to upload images</p>
                                <span>PNG, JPG, JPEG up to 5MB</span>
                            </div>
                        </label>
                    </div>

                    {formData.images.length > 0 && (
                        <div className="au__image-preview">
                            <h3>Uploaded Images ({formData.images.length})</h3>
                            <div className="au__image-grid">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="au__image-item">
                                        <img src={img} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="au__remove-image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Duration & Status */}
                <div className="au__section">
                    <h2 className="au__section-title">Additional Settings</h2>
                    <div className="au__form-grid">
                        <div className="au__field">
                            <label className="au__label">Duration (Optional)</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleInputChange}
                                className="au__input"
                                placeholder="e.g., Monthly, Yearly, or specific date"
                            />
                        </div>

                        <div className="au__field au__checkbox-field">
                            <label className="au__checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="au__checkbox"
                                />
                                <span>Active Status</span>
                            </label>
                            <p className="au__checkbox-hint">Inactive units won't be visible to customers</p>
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`au__message au__message-${message.type}`}>
                        {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                    </div>
                )}

                {/* Form Actions */}
                <div className="au__actions">
                    <button
                        type="button"
                        onClick={() => navigate(`/space/${spaceId}`)}
                        className="au__btn au__btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="au__btn au__btn-primary"
                    >
                        {loading ? 'Adding Unit...' : 'Add Unit'}
                    </button>
                </div>
            </form>
        </div>
    );
}