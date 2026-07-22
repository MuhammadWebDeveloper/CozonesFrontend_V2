import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/sellerdashboardstyles/AddUnit.css';
import BaseUrl from '../../utils/AppConstants';
import {
    ChevronLeft,
    Plus,
    X,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    Timer,
    Calendar,
    CalendarDays,
    Monitor,
    Armchair,
    DoorClosed,
    Presentation
} from 'lucide-react';

// ============================================
// IMAGE COMPRESSION UTILITIES
// ============================================

/**
 * Compress base64 image to reduce size
 * @param {string} base64String - The base64 image string
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 600)
 * @param {number} quality - Image quality 0-1 (default: 0.7)
 * @param {string} format - Image format 'jpeg' or 'webp' (default: 'jpeg')
 * @returns {Promise<string>} - Compressed base64 string
 */
const compressBase64Image = (
    base64String,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7,
    format = 'jpeg'
) => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions while maintaining aspect ratio
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to desired format with quality
                    const compressed = canvas.toDataURL(`image/${format}`, quality);
                    resolve(compressed);
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Compress multiple base64 images
 */
const compressMultipleBase64Images = async (
    base64Strings,
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7
) => {
    const compressedImages = [];
    for (const image of base64Strings) {
        if (image && image.startsWith('data:image')) {
            const compressed = await compressBase64Image(image, maxWidth, maxHeight, quality);
            compressedImages.push(compressed);
        } else {
            compressedImages.push(image);
        }
    }
    return compressedImages;
};

/**
 * Get image size in MB
 */
const getImageSizeInMB = (base64String) => {
    if (!base64String) return 0;
    const sizeInBytes = base64String.length * 0.75;
    return sizeInBytes / (1024 * 1024);
};

/**
 * Check if image needs compression
 */
const needsCompression = (base64String, maxSizeMB = 1) => {
    if (!base64String) return false;
    return getImageSizeInMB(base64String) > maxSizeMB;
};

// ============================================
// MAIN COMPONENT
// ============================================

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
    const [imageUploading, setImageUploading] = useState(false);
    const [compressingImages, setCompressingImages] = useState(false); // New state

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
        return ['daily'];
        // return ['daily', 'monthly'];
    };

    const getPricingLabel = (type) => {
        const labels = {
            hourly: { icon: Timer, title: 'Hourly Rate', description: 'Best for short-term bookings and meeting rooms', unit: '/hour (PKR)' },
            daily: { icon: Calendar, title: 'Daily Rate', description: 'Perfect for daily workspace rentals', unit: '/day (PKR)' },
            monthly: { icon: CalendarDays, title: 'Monthly Rate', description: 'Best value for long-term commitments', unit: '/month (PKR)' }
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

    // ============================================
    // UPDATED: Image Upload with Compression
    // ============================================
    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);

        // CHECK CURRENT IMAGE COUNT
        const currentImageCount = formData.images.length;
        const remainingSlots = 5 - currentImageCount;

        // Check if already have 5 images
        if (currentImageCount >= 5) {
            setMessage({ type: 'error', text: 'Maximum 5 images allowed. Please remove some images before adding more.' });
            e.target.value = '';
            return;
        }

        // Limit new files to remaining slots
        if (files.length > remainingSlots) {
            setMessage({ type: 'error', text: `You can only add ${remainingSlots} more image(s). Maximum 5 images total.` });
            e.target.value = '';
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
            e.target.value = '';
            return;
        }

        setImageUploading(true);
        setCompressingImages(true);

        try {
            // Step 1: Convert files to base64
            const imagePromises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                });
            });

            let images = await Promise.all(imagePromises);
            const validImages = images.filter(img => img !== null);

            if (validImages.length === 0) {
                setMessage({ type: 'error', text: 'Failed to read images. Please try again.' });
                e.target.value = '';
                setImageUploading(false);
                setCompressingImages(false);
                return;
            }

            // Step 2: Check sizes and compress if needed
            console.log('📊 Original images count:', validImages.length);

            const compressedImages = [];
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;

            for (const img of validImages) {
                const originalSize = getImageSizeInMB(img);
                totalOriginalSize += originalSize;

                let finalImage = img;
                // Compress if > 1MB
                if (needsCompression(img, 1)) {
                    console.log(`🔄 Compressing image (${originalSize.toFixed(2)}MB)...`);
                    finalImage = await compressBase64Image(img, 800, 600, 0.7);
                    const newSize = getImageSizeInMB(finalImage);
                    totalCompressedSize += newSize;
                    console.log(`✅ Compressed to ${newSize.toFixed(2)}MB (${((1 - newSize / originalSize) * 100).toFixed(0)}% reduction)`);
                } else {
                    totalCompressedSize += originalSize;
                    console.log(`✅ Image already optimized (${originalSize.toFixed(2)}MB)`);
                }
                compressedImages.push(finalImage);
            }

            console.log(`📊 Total: ${totalOriginalSize.toFixed(2)}MB → ${totalCompressedSize.toFixed(2)}MB (${((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(0)}% reduction)`);

            // Double-check we won't exceed 5 images
            const newTotal = formData.images.length + compressedImages.length;
            if (newTotal > 5) {
                setMessage({ type: 'error', text: 'Cannot exceed maximum of 5 images. Please remove some images first.' });
                e.target.value = '';
                setImageUploading(false);
                setCompressingImages(false);
                return;
            }

            // Add compressed images
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...compressedImages]
            }));

            setMessage({
                type: 'success',
                text: `${compressedImages.length} image(s) uploaded & optimized! (${newTotal}/5 images, ${totalCompressedSize.toFixed(2)}MB total)`
            });

            setTimeout(() => setMessage({ type: '', text: '' }), 4000);

        } catch (error) {
            console.error('Image upload/compression error:', error);
            setMessage({ type: 'error', text: 'Failed to process images. Please try again with smaller images.' });
        } finally {
            setImageUploading(false);
            setCompressingImages(false);
            e.target.value = '';
        }
    };

    const removeImage = (index) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            const remainingCount = newImages.length;
            // Calculate total size
            let totalSize = 0;
            newImages.forEach(img => {
                totalSize += getImageSizeInMB(img);
            });
            setMessage({
                type: 'info',
                text: `Image removed. ${remainingCount}/5 images remaining (${totalSize.toFixed(2)}MB total)`
            });
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

            console.log('📦 Submitting data with compressed images:', {
                imageCount: submitData.images.length,
                totalSize: submitData.images.reduce((acc, img) => acc + getImageSizeInMB(img), 0).toFixed(2) + 'MB'
            });

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

                await fetchExistingUnits();
                resetForm();

                setMessage({ type: 'success', text: 'Unit added successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: response.data.message || 'Failed to add unit' });
            }
        } catch (error) {
            console.error('Failed to add unit:', error);

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
        { value: 'open_desk', label: 'Open Desk', icon: Monitor, description: 'Shared workspace in open area' },
        { value: 'dedicated_desk', label: 'Dedicated Desk', icon: Armchair, description: 'Your own reserved desk' },
        { value: 'private_cabin', label: 'Private Cabin', icon: DoorClosed, description: 'Lockable private office' },
        { value: 'meeting_room', label: 'Meeting Room', icon: Presentation, description: 'Conference room for meetings' }
    ];

    const getPricingMessage = () => {
        const unitType = formData.unit_type;
        if (!unitType) return 'Please select a unit type first to see available pricing options';

        if (unitType === 'meeting_room') {
            return 'Meeting rooms can only be booked hourly or daily. Monthly plans are not available for meeting rooms.';
        }

        return 'Choose your preferred pricing plan. Only one plan will be active for this unit.';
    };

    const SuccessModal = () => {
        if (!showSuccessModal) return null;

        return (
            <div className="au__modal-overlay" onClick={() => setShowSuccessModal(false)}>
                <div className="au__modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="au__modal-icon"><CheckCircle size={40} /></div>
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

    return (
        <div className="au__container">
            <SuccessModal />

            <div className="au__header">
                <button onClick={() => navigate(`/space/${spaceId}`)} className="au__back-button">
                    <ChevronLeft size={20} />
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
                            const UnitIcon = type.icon;
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
                                    <div className="au__unit-icon"><UnitIcon /></div>
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
                        <p className="au__section-hint" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Lightbulb size={14} /> {getPricingMessage()}
                        </p>

                        <div className="au__pricing-plans">
                            {getAvailablePricingOptions().map(pricingType => {
                                const pricing = getPricingLabel(pricingType);
                                const isActive = activePricing === pricingType;
                                const PricingIcon = pricing.icon;

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
                                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <PricingIcon size={18} /> {pricing.title}
                                            </h3>
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
                    <p className="au__section-hint">
                        Upload up to 5 images (Maximum {formData.images.length}/5 uploaded)
                        {compressingImages && ' 🔄 Compressing images...'}
                    </p>
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

                                <Plus size={40} />
                                <p>{imageUploading ? 'Uploading...' : formData.images.length >= 5 ? 'Maximum 5 images reached' : 'Click or drag to upload images'}</p>

                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <p>
                                    {compressingImages ? '🔄 Compressing images...' :
                                        imageUploading ? 'Uploading...' :
                                            formData.images.length >= 5 ? 'Maximum 5 images reached' :
                                                'Click or drag to upload images'}
                                </p>

                                <span>PNG, JPG, WEBP up to 5MB each (Max 5 images)</span>
                                {compressingImages && <span style={{ color: '#01095A', fontWeight: 'bold' }}>⚡ Auto-compressing for optimal upload</span>}
                            </div>
                        </label>
                    </div>

                    {formData.images.length > 0 && (
                        <div className="au__image-preview">
                            <h3>
                                Uploaded Images ({formData.images.length}/5)
                                {formData.images.length > 0 && (
                                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                                        (Total: {formData.images.reduce((acc, img) => acc + getImageSizeInMB(img), 0).toFixed(2)}MB)
                                    </span>
                                )}
                            </h3>
                            <div className="au__image-grid">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="au__image-item">
                                        <img src={img} alt={`Preview ${index + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="au__remove-image"
                                        >
                                            <X size={16} />
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
                    <div className={`au__message au__message-${message.type}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {message.text}
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