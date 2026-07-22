import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/sellerdashboardstyles/UpdateUnit.css';
import BaseUrl from '../../utils/AppConstants';
import { 
    ArrowLeft, 
    AlertCircle, 
    CheckCircle, 
    X, 
    Plus,
    Clock,
    Calendar,
    CalendarDays,
    Image as ImageIcon,
    Upload,
    Loader2,
    Computer,
    Armchair,
    DoorClosed,
    Presentation,
    Package,
    Users,
    DollarSign,
    Tag,
    Trash2,
    Eye,
    EyeOff
} from 'lucide-react';

// ============================================
// IMAGE COMPRESSION UTILITIES
// ============================================

/**
 * Compress base64 image to reduce size
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

export default function UpdateUnit() {
    const { spaceId, unitId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [spaceName, setSpaceName] = useState('');
    const [compressingImages, setCompressingImages] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        unit_type: '',
        total_capacity: '',
        hourly_rate: '',
        daily_rate: '',
        monthly_rate: '',
        images: [],
        duration: '',
        is_active: true
    });

    const [activePricing, setActivePricing] = useState('');
    const [imagesToDelete, setImagesToDelete] = useState([]);

    const getAuthToken = () => localStorage.getItem('token');

    const unitTypes = [
        { value: 'open_desk', label: 'Open Desk', icon: Computer, description: 'Shared workspace in open area' },
        { value: 'dedicated_desk', label: 'Dedicated Desk', icon: Armchair, description: 'Your own reserved desk' },
        { value: 'private_cabin', label: 'Private Cabin', icon: DoorClosed, description: 'Lockable private office' },
        { value: 'meeting_room', label: 'Meeting Room', icon: Presentation, description: 'Conference room for meetings' }
    ];

    useEffect(() => {
        const loadUnitData = async () => {
            setLoading(true);
            try {
                let unit = null;

                if (location.state?.unit) {
                    unit = location.state.unit;
                } else {
                    const token = getAuthToken();
                    const spacesResponse = await axios.get(`${BaseUrl}api/spaces/owner/my-spaces`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (spacesResponse.data.success) {
                        const space = spacesResponse.data.spaces.find(s => s.id === spaceId);
                        if (space) setSpaceName(space.name);
                    }

                    setError('Unit data not available. Please go back and try again.');
                    setLoading(false);
                    return;
                }

                if (unit) {
                    setSpaceName(unit.space_name || '');

                    setFormData({
                        name: unit.name || '',
                        unit_type: unit.unit_type || '',
                        total_capacity: unit.total_capacity || '',
                        hourly_rate: unit.hourly_rate || '',
                        daily_rate: unit.daily_rate || '',
                        monthly_rate: unit.monthly_rate || '',
                        images: unit.images || [],
                        duration: unit.duration || '',
                        is_active: unit.is_active !== undefined ? unit.is_active : true
                    });

                    if (unit.hourly_rate && unit.hourly_rate > 0 && unit.hourly_rate !== -999) {
                        setActivePricing('hourly');
                    } else if (unit.daily_rate && unit.daily_rate > 0 && unit.daily_rate !== -999) {
                        setActivePricing('daily');
                    } else if (unit.monthly_rate && unit.monthly_rate > 0 && unit.monthly_rate !== -999) {
                        setActivePricing('monthly');
                    }
                } else {
                    setError('Unit not found');
                    setTimeout(() => navigate(`/space/${spaceId}`), 2000);
                }
            } catch (err) {
                console.error('Error loading unit:', err);
                setError(err.response?.data?.message || 'Failed to load unit details');
            } finally {
                setLoading(false);
            }
        };

        loadUnitData();
    }, [spaceId, unitId, location.state, navigate]);

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
            hourly_rate: type === 'hourly' ? prev.hourly_rate : '',
            daily_rate: type === 'daily' ? prev.daily_rate : '',
            monthly_rate: type === 'monthly' ? prev.monthly_rate : ''
        }));
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };



    // ============================================
    // UPDATED: Handle File Change with Compression
    // ============================================

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setCompressingImages(true);

        try {
            // Step 1: Convert files to base64
            const base64Array = await Promise.all(files.map(fileToBase64));
            const validImages = base64Array.filter(img => img !== null);

            if (validImages.length === 0) {
                setError('Failed to read images. Please try again.');
                fileInputRef.current.value = '';
                setCompressingImages(false);
                return;
            }

            // Step 2: Compress images if needed
            console.log('📊 Processing images for update...');
            const compressedImages = [];
            let totalOriginalSize = 0;
            let totalCompressedSize = 0;

            for (const img of validImages) {
                const originalSize = getImageSizeInMB(img);
                totalOriginalSize += originalSize;

                let finalImage = img;
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

            // Add compressed images
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...compressedImages]
            }));

            setSuccess(`${compressedImages.length} image(s) uploaded & optimized! (${totalCompressedSize.toFixed(2)}MB total)`);
            setTimeout(() => setSuccess(null), 3000);

        } catch (err) {
            console.error('Error processing images:', err);
            setError('Failed to process images. Please try again with smaller images.');
        } finally {
            setCompressingImages(false);
            fileInputRef.current.value = '';
        }
    };

    const removeImage = (index, imageUrl) => {
        if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/uploads'))) {
            setImagesToDelete(prev => [...prev, imageUrl]);
        }

        

        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));

        // Calculate remaining size
        const remainingImages = formData.images.filter((_, i) => i !== index);
        let totalSize = 0;
        remainingImages.forEach(img => {
            totalSize += getImageSizeInMB(img);
        });
        setSuccess(`Image removed. ${remainingImages.length} images remaining (${totalSize.toFixed(2)}MB total)`);
        setTimeout(() => setSuccess(null), 2000);
    };

    const validateForm = () => {
        if (!formData.unit_type) {
            setError('Please select a unit type');
            return false;
        }
        if (!formData.total_capacity || formData.total_capacity < 1) {
            setError('Please enter a valid total capacity (minimum 1)');
            return false;
        }
        if (!activePricing) {
            setError('Please select a pricing plan (Hourly, Daily, or Monthly)');
            return false;
        }
        if (activePricing === 'hourly' && (!formData.hourly_rate || formData.hourly_rate <= 0)) {
            setError('Please enter a valid hourly rate');
            return false;
        }
        if (activePricing === 'daily' && (!formData.daily_rate || formData.daily_rate <= 0)) {
            setError('Please enter a valid daily rate');
            return false;
        }
        if (activePricing === 'monthly' && (!formData.monthly_rate || formData.monthly_rate <= 0)) {
            setError('Please enter a valid monthly rate');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const token = getAuthToken();

            if (imagesToDelete.length > 0) {
                try {
                    await axios.post(
                        `${BaseUrl}api/spaces/${spaceId}/units/${unitId}/delete-images`,
                        { images: imagesToDelete },
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                } catch (err) {
                    console.warn('Failed to delete some images:', err);
                }
            }

            // Calculate total image size for logging
            const totalSize = formData.images.reduce((acc, img) => acc + getImageSizeInMB(img), 0);
            console.log(`📦 Submitting update with ${formData.images.length} images (${totalSize.toFixed(2)}MB total)`);

            const submitData = {
                name: formData.name,
                unit_type: formData.unit_type,
                total_capacity: parseInt(formData.total_capacity),
                hourly_rate: activePricing === 'hourly' ? parseFloat(formData.hourly_rate) : -999,
                daily_rate: activePricing === 'daily' ? parseFloat(formData.daily_rate) : -999,
                monthly_rate: activePricing === 'monthly' ? parseFloat(formData.monthly_rate) : -999,
                images: JSON.stringify(formData.images),
                duration: formData.duration || null,
                is_active: formData.is_active
            };

            const response = await axios.put(
                `${BaseUrl}api/spaces/${spaceId}/units/${unitId}`,
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess('Unit updated successfully!');
                setTimeout(() => navigate(`/space/${spaceId}`), 1500);
            } else {
                setError(response.data.message || 'Failed to update unit');
            }
        } catch (err) {
            console.error('Error updating unit:', err);
            setError(err.response?.data?.message || 'An error occurred while updating the unit');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            navigate(`/space/${spaceId}`);
        }
    };

    const getUnitTypeIcon = (type) => {
        const found = unitTypes.find(t => t.value === type);
        return found ? found.icon : Package;
    };

    if (loading) {
        return (
            <div className="uu__main">
                <div className="uu__loading">
                    <div className="uu__loader"></div>
                    <p>Loading unit details...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="uu__main">
            <div className="uu__container">
                {/* Header */}
                <div className="uu__header">
                    <div className="uu__header-left">
                        <button className="uu__back-btn" onClick={handleCancel}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="uu__title">Update Unit</h1>
                            <p className="uu__subtitle">
                                Editing unit in <strong>{spaceName || 'your space'}</strong>
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="uu__form">
                    {/* Alerts */}
                    {error && (
                        <div className="uu__alert uu__alert-error">
                            <div className="uu__alert-icon">
                                <AlertCircle size={20} />
                            </div>
                            <div className="uu__alert-content">
                                <strong>Error:</strong> {error}
                            </div>
                            <button type="button" className="uu__alert-close" onClick={() => setError(null)}>
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {success && (
                        <div className="uu__alert uu__alert-success">
                            <div className="uu__alert-icon">
                                <CheckCircle size={20} />
                            </div>
                            <div className="uu__alert-content">
                                <strong>Success!</strong> {success}
                            </div>
                        </div>
                    )}

                    <div className="uu__form-grid">
                        {/* Left Column */}
                        <div className="uu__form-column">
                            {/* Unit Type Display */}
                            <div className="uu__section">
                                <h2 className="uu__section-title">Unit Type</h2>
                                <div className="uu__unit-type-display">
                                    <span className="uu__unit-icon">
                                        {React.createElement(getUnitTypeIcon(formData.unit_type), { size: 24 })}
                                    </span>
                                    <div>
                                        <h3>{unitTypes.find(t => t.value === formData.unit_type)?.label || formData.unit_type}</h3>
                                        <p>{unitTypes.find(t => t.value === formData.unit_type)?.description}</p>
                                    </div>
                                </div>
                                <p className="uu__helper-text">Unit type cannot be changed after creation</p>
                            </div>

                            {/* Basic Information */}
                            <div className="uu__section">
                                <h2 className="uu__section-title">Basic Information</h2>

                                <div className="uu__form-group">
                                    <label className="uu__label">Unit Name (Optional)</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Premium Desk 101"
                                        className="uu__input"
                                    />
                                </div>

                                <div className="uu__form-group">
                                    <label className="uu__label">
                                        Total Capacity <span className="uu__required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="total_capacity"
                                        value={formData.total_capacity}
                                        onChange={handleInputChange}
                                        placeholder="Number of people"
                                        className="uu__input"
                                        min="1"
                                    />
                                </div>

                                <div className="uu__form-group">
                                    <label className="uu__label">Duration (Optional)</label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Monthly, Yearly, 2 hours minimum"
                                        className="uu__input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="uu__form-column">
                            {/* Pricing Section */}
                            <div className="uu__section">
                                <h2 className="uu__section-title">Pricing Plan</h2>
                                <p className="uu__section-hint">Select which pricing plan should be active for this unit</p>

                                <div className="uu__pricing-options">
                                    {/* Hourly Plan */}
                                    <div
                                        className={`uu__pricing-card ${activePricing === 'hourly' ? 'uu__pricing-card-active' : ''}`}
                                        onClick={() => handlePricingChange('hourly')}
                                    >
                                        <div className="uu__pricing-radio">
                                            <div className={`uu__radio-custom ${activePricing === 'hourly' ? 'uu__radio-custom-active' : ''}`}>
                                                {activePricing === 'hourly' && <div className="uu__radio-dot"></div>}
                                            </div>
                                        </div>
                                        <div className="uu__pricing-content">
                                            <h3><Clock size={18} style={{ marginRight: '8px', display: 'inline' }} /> Hourly Rate</h3>
                                            <p>Best for short-term bookings</p>
                                            <div className="uu__pricing-input">
                                                <input
                                                    type="number"
                                                    name="hourly_rate"
                                                    value={formData.hourly_rate}
                                                    onChange={handleInputChange}
                                                    className="uu__input"
                                                    placeholder="Enter hourly rate"
                                                    step="1"
                                                    min="0"
                                                    disabled={activePricing !== 'hourly'}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="uu__per">/hour (PKR)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Daily Plan */}
                                    <div
                                        className={`uu__pricing-card ${activePricing === 'daily' ? 'uu__pricing-card-active' : ''}`}
                                        onClick={() => handlePricingChange('daily')}
                                    >
                                        <div className="uu__pricing-radio">
                                            <div className={`uu__radio-custom ${activePricing === 'daily' ? 'uu__radio-custom-active' : ''}`}>
                                                {activePricing === 'daily' && <div className="uu__radio-dot"></div>}
                                            </div>
                                        </div>
                                        <div className="uu__pricing-content">
                                            <h3><Calendar size={18} style={{ marginRight: '8px', display: 'inline' }} /> Daily Rate</h3>
                                            <p>Perfect for daily workspace rentals</p>
                                            <div className="uu__pricing-input">
                                                <input
                                                    type="number"
                                                    name="daily_rate"
                                                    value={formData.daily_rate}
                                                    onChange={handleInputChange}
                                                    className="uu__input"
                                                    placeholder="Enter daily rate"
                                                    step="1"
                                                    min="0"
                                                    disabled={activePricing !== 'daily'}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="uu__per">/day (PKR)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Monthly Plan */}
                                    <div
                                        className={`uu__pricing-card ${activePricing === 'monthly' ? 'uu__pricing-card-active' : ''}`}
                                        onClick={() => handlePricingChange('monthly')}
                                    >
                                        <div className="uu__pricing-radio">
                                            <div className={`uu__radio-custom ${activePricing === 'monthly' ? 'uu__radio-custom-active' : ''}`}>
                                                {activePricing === 'monthly' && <div className="uu__radio-dot"></div>}
                                            </div>
                                        </div>
                                        <div className="uu__pricing-content">
                                            <h3><CalendarDays size={18} style={{ marginRight: '8px', display: 'inline' }} /> Monthly Rate</h3>
                                            <p>Best value for long-term commitments</p>
                                            <div className="uu__pricing-input">
                                                <input
                                                    type="number"
                                                    name="monthly_rate"
                                                    value={formData.monthly_rate}
                                                    onChange={handleInputChange}
                                                    className="uu__input"
                                                    placeholder="Enter monthly rate"
                                                    step="1"
                                                    min="0"
                                                    disabled={activePricing !== 'monthly'}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="uu__per">/month (PKR)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Images Section — with compression */}
                            <div className="uu__section">
                                <h2 className="uu__section-title">Images</h2>
                                <p className="uu__section-hint">
                                    Upload images from your device (JPG, PNG, WebP)
                                    {compressingImages && ' 🔄 Compressing...'}
                                </p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    style={{ display: 'none' }}
                                />

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="uu__add-image-btn"
                                    disabled={compressingImages}
                                >

                                    <Plus size={16} style={{ marginRight: '8px' }} />
                                    {formData.images.length > 0 ? 'Add More Images' : 'Upload Images'}

                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    {compressingImages ? 'Compressing...' : formData.images.length > 0 ? 'Add More Images' : 'Upload Images'}

                                </button>

                                {compressingImages && (
                                    <div className="uu__compression-status" style={{ marginTop: '8px', color: '#01095A', fontSize: '13px' }}>
                                        ⚡ Optimizing images for upload...
                                    </div>
                                )}

                                {formData.images.length > 0 && (
                                    <div className="uu__preview-section">
                                        <h3>
                                            Images ({formData.images.length})
                                            <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                                                (Total: {formData.images.reduce((acc, img) => acc + getImageSizeInMB(img), 0).toFixed(2)}MB)
                                            </span>
                                        </h3>
                                        <div className="uu__preview-grid">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="uu__preview-item">
                                                    <img src={img} alt={`Preview ${idx + 1}`} />
                                                    <button
                                                        type="button"
                                                        className="uu__preview-remove"
                                                        onClick={() => removeImage(idx, img)}
                                                        title="Remove image"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Toggle */}
                            <div className="uu__section">
                                <h2 className="uu__section-title">Status</h2>
                                <div className="uu__status-toggle">
                                    <label className="uu__toggle-switch">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                        />
                                        <span className="uu__toggle-slider"></span>
                                    </label>
                                    <div className="uu__status-text">
                                        <strong>
                                            {formData.is_active ? (
                                                <>
                                                    <Eye size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <EyeOff size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                                    Inactive
                                                </>
                                            )}
                                        </strong>
                                        <p>{formData.is_active ? 'Unit is visible and available for booking' : 'Unit is hidden from customers'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="uu__actions">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="uu__btn uu__btn-secondary"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="uu__btn uu__btn-primary"
                            disabled={submitting || compressingImages}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                                    Updating...
                                </>
                            ) : (
                                'Update Unit'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}