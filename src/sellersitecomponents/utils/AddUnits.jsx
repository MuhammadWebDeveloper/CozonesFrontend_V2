import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/sellerdashboardstyles/AddUnit.css';
import BaseUrl from '../../utils/AppConstants';

export default function AddUnit() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [spaceName, setSpaceName] = useState('');
    const [existingUnits, setExistingUnits] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activePricing, setActivePricing] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [addedUnitName, setAddedUnitName] = useState('');
    const [imageUploading, setImageUploading] = useState(false); // New state

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
            const response = await axios.get(`${BaseUrl}api/spaces/owner/my-spaces`, {
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

    const fetchExistingUnits = async () => {
        try {
            const token = getAuthToken();
            const response = await axios.get(`${BaseUrl}api/spaces/${spaceId}/units`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success && response.data.units) {
                setExistingUnits(response.data.units);
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

    const getAvailablePricingOptions = () => {
        const unitType = formData.unit_type;
        if (unitType === 'meeting_room') {
            return ['hourly', 'daily'];
        }
        return ['daily', 'monthly'];
    };

    const getPricingLabel = (type) => {
        const labels = {
            hourly: { title: '⏱️ Hourly Rate', description: 'Best for short-term bookings and meeting rooms', unit: '/hour (PKR)' },
            daily: { title: '📅 Daily Rate', description: 'Perfect for daily workspace rentals', unit: '/day (PKR)' },
            monthly: { title: '📆 Monthly Rate', description: 'Best value for long-term commitments', unit: '/month (PKR)' }
        };
        return labels[type];
    };

    const handlePricingChange = (type) => {
        setActivePricing(type);
        setFormData(prev => ({
            ...prev,
            active_pricing_type: type
        }));
    };

    useEffect(() => {
        setActivePricing('');
        setFormData(prev => ({
            ...prev,
            hourly_rate: '',
            daily_rate: '',
            monthly_rate: '',
            active_pricing_type: ''
        }));
    }, [formData.unit_type]);

    // Improved image upload with compression and validation
    // Updated handleImageUpload function with 5 image limit
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);

        // CHECK CURRENT IMAGE COUNT
        const currentImageCount = formData.images.length;
        const remainingSlots = 5 - currentImageCount;

        // Check if already have 5 images
        if (currentImageCount >= 5) {
            setMessage({ type: 'error', text: 'Maximum 5 images allowed. Please remove some images before adding more.' });
            e.target.value = ''; // Clear the input
            return;
        }

        // Limit new files to remaining slots
        if (files.length > remainingSlots) {
            setMessage({ type: 'error', text: `You can only add ${remainingSlots} more image(s). Maximum 5 images total.` });
            e.target.value = ''; // Clear the input
            return;
        }

        // Validate file sizes and types
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        const invalidFiles = files.filter(file => {
            if (!validTypes.includes(file.type)) {
                setMessage({ type: 'error', text: `${file.name} is not a valid image type. Use JPG, PNG, or WEBP.` });
                return true;
            }
            if (file.size > MAX_SIZE) {
                setMessage({ type: 'error', text: `${file.name} exceeds 5MB limit.` });
                return true;
            }
            return false;
        });

        if (invalidFiles.length > 0) {
            e.target.value = ''; // Clear the input
            return;
        }

        setImageUploading(true);

        try {
            const imagePromises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                });
            });

            const images = await Promise.all(imagePromises);
            const validImages = images.filter(img => img !== null);

            if (validImages.length > 0) {
                // Double-check we won't exceed 5 images
                const newTotal = formData.images.length + validImages.length;
                if (newTotal > 5) {
                    setMessage({ type: 'error', text: 'Cannot exceed maximum of 5 images. Please remove some images first.' });
                    e.target.value = '';
                    setImageUploading(false);
                    return;
                }

                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...validImages]
                }));
                setMessage({ type: 'success', text: `${validImages.length} image(s) uploaded successfully! (${newTotal}/5 images)` });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            }
        } catch (error) {
            console.error('Image upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload images. Please try again.' });
        } finally {
            setImageUploading(false);
            e.target.value = ''; // Clear the input
        }
    };
    const removeImage = (index) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            const remainingCount = newImages.length;
            setMessage({ type: 'info', text: `Image removed. ${remainingCount}/5 images remaining.` });
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
            return {
                ...prev,
                images: newImages
            };
        });
    };

    const resetForm = () => {
        setFormData({
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
        setActivePricing('');
        setMessage({ type: '', text: '' });
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

        if (!formData.name.trim()) {
            setMessage({ type: 'error', text: 'Please enter a unit name' });
            setLoading(false);
            return;
        }

        if (!formData.total_capacity || formData.total_capacity <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid total capacity (greater than 0)' });
            setLoading(false);
            return;
        }

        if (!activePricing) {
            const availableOptions = getAvailablePricingOptions();
            const optionsText = availableOptions.map(opt => opt === 'hourly' ? 'Hourly' : opt === 'daily' ? 'Daily' : 'Monthly').join(' or ');
            setMessage({ type: 'error', text: `Please select a pricing plan (${optionsText})` });
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

            const submitData = {
                unit_type: formData.unit_type,
                name: formData.name.trim(),
                total_capacity: parseInt(formData.total_capacity),
                images: formData.images,
                duration: formData.duration || null,
                is_active: formData.is_active,
                active_pricing_type: activePricing,
                hourly_rate: activePricing === 'hourly' ? parseFloat(formData.hourly_rate) : null,
                daily_rate: activePricing === 'daily' ? parseFloat(formData.daily_rate) : null,
                monthly_rate: activePricing === 'monthly' ? parseFloat(formData.monthly_rate) : null
            };

            const response = await axios.post(
                `${BaseUrl}api/spaces/${spaceId}/addunits`,
                submitData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout for image uploads
                }
            );

            if (response.data.success) {
                const unitDisplayName = formData.name || `${formData.unit_type.replace('_', ' ')}`;
                setAddedUnitName(unitDisplayName);
                setShowSuccessModal(true);

                // Refresh existing units list
                await fetchExistingUnits();

                // Reset form after successful addition
                resetForm();

                setMessage({ type: 'success', text: 'Unit added successfully!' });

                // Auto-hide success message after 3 seconds
                setTimeout(() => {
                    setMessage({ type: '', text: '' });
                }, 3000);
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Failed to add unit' });
            }
        } catch (error) {
            console.error('Failed to add unit:', error);

            // Better error messages
            let errorMessage = 'Server error. Please try again.';
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please check your internet connection.';
            } else if (error.response?.status === 409) {
                errorMessage = 'This unit type already exists. Please choose a different type.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const getUnitTypeCount = (typeValue) => {
        return existingUnits.filter(unit => unit.unit_type === typeValue).length;
    };

    const unitTypes = [
        { value: 'open_desk', label: 'Open Desk', icon: '🖥️', description: 'Shared workspace in open area' },
        { value: 'dedicated_desk', label: 'Dedicated Desk', icon: '💺', description: 'Your own reserved desk' },
        { value: 'private_cabin', label: 'Private Cabin', icon: '🚪', description: 'Lockable private office' },
        { value: 'meeting_room', label: 'Meeting Room', icon: '📊', description: 'Conference room for meetings' }
    ];

    const getPricingMessage = () => {
        const unitType = formData.unit_type;
        if (!unitType) return 'Please select a unit type first to see available pricing options';

        if (unitType === 'meeting_room') {
            return '💡 Meeting rooms can only be booked hourly or daily. Monthly plans are not available for meeting rooms.';
        }

        return '💡 Choose your preferred pricing plan. Only one plan will be active for this unit.';
    };

    const SuccessModal = () => {
        if (!showSuccessModal) return null;

        return (
            <div className="au__modal-overlay" onClick={() => setShowSuccessModal(false)}>
                <div className="au__modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="au__modal-icon">✅</div>
                    <h3>Unit Added Successfully!</h3>
                    <p>"{addedUnitName}" has been added to your space.</p>
                    <div className="au__modal-actions">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                navigate(`/space/${spaceId}`);
                            }}
                            className="au__btn au__btn-primary"
                        >
                            View All Units
                        </button>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="au__btn au__btn-secondary"
                        >
                            Add Another Unit
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // return (
    //     <div className="au__container">
    //         <SuccessModal />

    //         <div className="au__header">
    //             <button onClick={() => navigate(`/space/${spaceId}`)} className="au__back-button">
    //                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    //                     <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    //                 </svg>
    //                 Back to Space
    //             </button>
    //             <div className="au__header-title">
    //                 <h1>Add New Unit</h1>
    //                 <p>to {spaceName || 'your space'}</p>
    //             </div>
    //         </div>

    //         {existingUnits.length > 0 && (
    //             <div className="au__stats">
    //                 <div className="au__stat-card">
    //                     <span className="au__stat-label">Total Units</span>
    //                     <span className="au__stat-value">{existingUnits.length}</span>
    //                 </div>
    //                 {unitTypes.map(type => {
    //                     const count = getUnitTypeCount(type.value);
    //                     if (count > 0) {
    //                         return (
    //                             <div key={type.value} className="au__stat-card">
    //                                 <span className="au__stat-label">{type.label}</span>
    //                                 <span className="au__stat-value">{count}</span>
    //                             </div>
    //                         );
    //                     }
    //                     return null;
    //                 })}
    //             </div>
    //         )}

    //         <form onSubmit={handleSubmit} className="au__form">
    //             <div className="au__section">
    //                 <h2 className="au__section-title">Select Unit Type</h2>
    //                 <p className="au__section-hint">You can add multiple units of the same type. Each unit will have its own capacity and pricing.</p>
    //                 <div className="au__unit-types">
    //                     {unitTypes.map(type => {
    //                         const existingCount = getUnitTypeCount(type.value);
    //                         return (
    //                             <label
    //                                 key={type.value}
    //                                 className={`au__unit-card ${formData.unit_type === type.value ? 'au__unit-card-active' : ''}`}
    //                             >
    //                                 <input
    //                                     type="radio"
    //                                     name="unit_type"
    //                                     value={type.value}
    //                                     checked={formData.unit_type === type.value}
    //                                     onChange={handleInputChange}
    //                                     className="au__radio"
    //                                 />
    //                                 <div className="au__unit-icon">{type.icon}</div>
    //                                 <div className="au__unit-info">
    //                                     <h3>{type.label}</h3>
    //                                     <p>{type.description}</p>
    //                                     {existingCount > 0 && (
    //                                         <span className="au__count-badge">{existingCount} already added</span>
    //                                     )}
    //                                 </div>
    //                             </label>
    //                         );
    //                     })}
    //                 </div>
    //             </div>






    //             {/* <div className="au__section">
    //                 <h2 className="au__section-title">Basic Information</h2>
    //                 <div className="au__form-grid">
    //                     <div className="au__field">
    //                         <label className="au__label">Unit Name *</label>
    //                         <input
    //                             type="text"
    //                             name="name"
    //                             value={formData.name}
    //                             onChange={handleInputChange}
    //                             className="au__input"
    //                             placeholder="e.g., Premium Desk 101, Cabin A, Meeting Room 1"
    //                             required
    //                         />
    //                         <p className="au__field-hint">Give this unit a unique name to identify it easily</p>
    //                     </div>

    //                     <div className="au__field">
    //                         <label className="au__label">Total Capacity *</label>
    //                         <input
    //                             type="number"
    //                             name="total_capacity"
    //                             value={formData.total_capacity}
    //                             onChange={handleInputChange}
    //                             className="au__input"
    //                             placeholder="Number of people"
    //                             min="1"
    //                             required
    //                         />
    //                     </div>
    //                 </div>
    //             </div> */}












    //             {formData.unit_type && (
    //                 <div className="au__section">
    //                     <h2 className="au__section-title">Select Pricing Plan</h2>
    //                     <p className="au__section-hint">{getPricingMessage()}</p>

    //                     <div className="au__pricing-plans">
    //                         {getAvailablePricingOptions().map(pricingType => {
    //                             const pricing = getPricingLabel(pricingType);
    //                             const isActive = activePricing === pricingType;

    //                             return (
    //                                 <div
    //                                     key={pricingType}
    //                                     className={`au__pricing-card ${isActive ? 'au__pricing-card-active' : ''}`}
    //                                     onClick={() => handlePricingChange(pricingType)}
    //                                 >
    //                                     <div className="au__pricing-radio">
    //                                         <div className={`au__radio-custom ${isActive ? 'au__radio-custom-active' : ''}`}>
    //                                             {isActive && <div className="au__radio-dot"></div>}
    //                                         </div>
    //                                     </div>
    //                                     <div className="au__pricing-content">
    //                                         <h3>{pricing.title}</h3>
    //                                         <p>{pricing.description}</p>
    //                                         <div className="au__pricing-input">
    //                                             <input
    //                                                 type="number"
    //                                                 name={`${pricingType}_rate`}
    //                                                 value={formData[`${pricingType}_rate`]}
    //                                                 onChange={handleInputChange}
    //                                                 className="au__input"
    //                                                 placeholder={`Enter ${pricingType} rate`}
    //                                                 step="100"
    //                                                 min="0"
    //                                                 disabled={!isActive}
    //                                                 onClick={(e) => e.stopPropagation()}
    //                                                 required={isActive}
    //                                             />
    //                                             <span className="au__per">{pricing.unit}</span>
    //                                         </div>
    //                                     </div>
    //                                 </div>
    //                             );
    //                         })}
    //                     </div>
    //                 </div>
    //             )}

    //             <div className="au__section">
    //                 <h2 className="au__section-title">Images</h2>
    //                 <div className="au__image-upload">
    //                     <label className="au__upload-area">
    //                         <input
    //                             type="file"
    //                             accept="image/jpeg,image/jpg,image/png,image/webp"
    //                             multiple
    //                             onChange={handleImageUpload}
    //                             className="au__file-input"
    //                             disabled={imageUploading}
    //                         />
    //                         <div className="au__upload-content">
    //                             <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
    //                                 <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
    //                             </svg>
    //                             <p>{imageUploading ? 'Uploading...' : 'Click or drag to upload images'}</p>
    //                             <span>PNG, JPG, WEBP up to 5MB each</span>
    //                         </div>
    //                     </label>
    //                 </div>

    //                 {formData.images.length > 0 && (
    //                     <div className="au__image-preview">
    //                         <h3>Uploaded Images ({formData.images.length})</h3>
    //                         <div className="au__image-grid">
    //                             {formData.images.map((img, index) => (
    //                                 <div key={index} className="au__image-item">
    //                                     <img src={img} alt={`Preview ${index + 1}`} />
    //                                     <button
    //                                         type="button"
    //                                         onClick={() => removeImage(index)}
    //                                         className="au__remove-image"
    //                                     >
    //                                         ×
    //                                     </button>
    //                                 </div>
    //                             ))}
    //                         </div>
    //                     </div>
    //                 )}
    //             </div>

    //             <div className="au__section">
    //                 <h2 className="au__section-title">Additional Settings</h2>
    //                 <div className="au__form-grid">
    //                     <div className="au__field">
    //                         <label className="au__label">Duration (Optional)</label>
    //                         <input
    //                             type="text"
    //                             name="duration"
    //                             value={formData.duration}
    //                             onChange={handleInputChange}
    //                             className="au__input"
    //                             placeholder="e.g., Monthly, Yearly, or specific date"
    //                         />
    //                     </div>

    //                     <div className="au__field au__checkbox-field">
    //                         <label className="au__checkbox-label">
    //                             <input
    //                                 type="checkbox"
    //                                 name="is_active"
    //                                 checked={formData.is_active}
    //                                 onChange={handleInputChange}
    //                                 className="au__checkbox"
    //                             />
    //                             <span>Active Status</span>
    //                         </label>
    //                         <p className="au__checkbox-hint">Inactive units won't be visible to customers</p>
    //                     </div>
    //                 </div>
    //             </div>

    //             {message.text && (
    //                 <div className={`au__message au__message-${message.type}`}>
    //                     {message.type === 'success' ? '✅' : '⚠️'} {message.text}
    //                 </div>
    //             )}

    //             <div className="au__actions">
    //                 <button
    //                     type="button"
    //                     onClick={() => navigate(`/space/${spaceId}`)}
    //                     className="au__btn au__btn-secondary"
    //                     disabled={loading}
    //                 >
    //                     Cancel
    //                 </button>
    //                 <button
    //                     type="submit"
    //                     disabled={loading || imageUploading}
    //                     className="au__btn au__btn-primary"
    //                 >
    //                     {loading ? 'Adding Unit...' : 'Add Unit'}
    //                 </button>
    //             </div>
    //         </form>
    //     </div>
    // );








    return (
        <div className="au__container">
            <SuccessModal />

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

            {existingUnits.length > 0 && (
                <div className="au__stats">
                    <div className="au__stat-card">
                        <span className="au__stat-label">Total Units</span>
                        <span className="au__stat-value">{existingUnits.length}</span>
                    </div>
                    {unitTypes.map(type => {
                        const count = getUnitTypeCount(type.value);
                        if (count > 0) {
                            return (
                                <div key={type.value} className="au__stat-card">
                                    <span className="au__stat-label">{type.label}</span>
                                    <span className="au__stat-value">{count}</span>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            <form onSubmit={handleSubmit} className="au__form">
                <div className="au__section">
                    <h2 className="au__section-title">Select Unit Type</h2>
                    <p className="au__section-hint">You can add multiple units of the same type. Each unit will have its own capacity and pricing.</p>
                    <div className="au__unit-types">
                        {unitTypes.map(type => {
                            const existingCount = getUnitTypeCount(type.value);
                            return (
                                <label
                                    key={type.value}
                                    className={`au__unit-card ${formData.unit_type === type.value ? 'au__unit-card-active' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="unit_type"
                                        value={type.value}
                                        checked={formData.unit_type === type.value}
                                        onChange={handleInputChange}
                                        className="au__radio"
                                    />
                                    <div className="au__unit-icon">{type.icon}</div>
                                    <div className="au__unit-info">
                                        <h3>{type.label}</h3>
                                        <p>{type.description}</p>
                                        {existingCount > 0 && (
                                            <span className="au__count-badge">{existingCount} already added</span>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Basic Information Section - Uncommented */}
                <div className="au__section">
                    <h2 className="au__section-title">Basic Information</h2>
                    <div className="au__form-grid">
                        <div className="au__field">
                            <label className="au__label">Unit Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="au__input"
                                placeholder="e.g., Premium Desk 101, Cabin A, Meeting Room 1"
                                required
                            />
                            <p className="au__field-hint">Give this unit a unique name to identify it easily</p>
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

                {formData.unit_type && (
                    <div className="au__section">
                        <h2 className="au__section-title">Select Pricing Plan</h2>
                        <p className="au__section-hint">{getPricingMessage()}</p>

                        <div className="au__pricing-plans">
                            {getAvailablePricingOptions().map(pricingType => {
                                const pricing = getPricingLabel(pricingType);
                                const isActive = activePricing === pricingType;

                                return (
                                    <div
                                        key={pricingType}
                                        className={`au__pricing-card ${isActive ? 'au__pricing-card-active' : ''}`}
                                        onClick={() => handlePricingChange(pricingType)}
                                    >
                                        <div className="au__pricing-radio">
                                            <div className={`au__radio-custom ${isActive ? 'au__radio-custom-active' : ''}`}>
                                                {isActive && <div className="au__radio-dot"></div>}
                                            </div>
                                        </div>
                                        <div className="au__pricing-content">
                                            <h3>{pricing.title}</h3>
                                            <p>{pricing.description}</p>
                                            <div className="au__pricing-input">
                                                <input
                                                    type="number"
                                                    name={`${pricingType}_rate`}
                                                    value={formData[`${pricingType}_rate`]}
                                                    onChange={handleInputChange}
                                                    className="au__input"
                                                    placeholder={`Enter ${pricingType} rate`}
                                                    step="100"
                                                    min="0"
                                                    disabled={!isActive}
                                                    onClick={(e) => e.stopPropagation()}
                                                    required={isActive}
                                                />
                                                <span className="au__per">{pricing.unit}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="au__section">
                    <h2 className="au__section-title">Images</h2>
                    <p className="au__section-hint">Upload up to 5 images (Maximum {formData.images.length}/5 uploaded)</p>
                    <div className="au__image-upload">
                        <label className={`au__upload-area ${formData.images.length >= 5 ? 'au__upload-area-disabled' : ''}`}>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                multiple
                                onChange={handleImageUpload}
                                className="au__file-input"
                                disabled={imageUploading || formData.images.length >= 5}
                            />
                            <div className="au__upload-content">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <p>{imageUploading ? 'Uploading...' : formData.images.length >= 5 ? 'Maximum 5 images reached' : 'Click or drag to upload images'}</p>
                                <span>PNG, JPG, WEBP up to 5MB each (Max 5 images)</span>
                            </div>
                        </label>
                    </div>

                    {formData.images.length > 0 && (
                        <div className="au__image-preview">
                            <h3>Uploaded Images ({formData.images.length}/5)</h3>
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

                {message.text && (
                    <div className={`au__message au__message-${message.type}`}>
                        {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                    </div>
                )}

                <div className="au__actions">
                    <button
                        type="button"
                        onClick={() => navigate(`/space/${spaceId}`)}
                        className="au__btn au__btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || imageUploading}
                        className="au__btn au__btn-primary"
                    >
                        {loading ? 'Adding Unit...' : 'Add Unit'}
                    </button>
                </div>
            </form>
        </div>
    );
}