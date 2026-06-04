import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../componentstyles/sellerdashboardstyles/HostRequestForm.css';
import BaseUrl from '../../utils/AppConstants';

const HostRequestForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(true);
    const [showRejectedWarning, setShowRejectedWarning] = useState(false);
    const [previousRequestDetails, setPreviousRequestDetails] = useState(null);

    const [formData, setFormData] = useState({
        cnic_number: '',
        phone_number: '',
        additional_info: ''
    });

    const [cnicFrontImage, setCnicFrontImage] = useState(null);
    const [cnicBackImage, setCnicBackImage] = useState(null);
    const [cnicFrontPreview, setCnicFrontPreview] = useState('');
    const [cnicBackPreview, setCnicBackPreview] = useState('');
    const [errors, setErrors] = useState({});
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [lastRequestId, setLastRequestId] = useState(null);
    const [redirectTimer, setRedirectTimer] = useState(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (redirectTimer) {
                clearTimeout(redirectTimer);
            }
        };
    }, [redirectTimer]);

    // Check if user can submit on component mount
    useEffect(() => {
        checkSubmissionEligibility();
    }, []);

    const checkSubmissionEligibility = async () => {
        try {
            setCheckingEligibility(true);
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${BaseUrl}api/host-requests/can-submit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                if (!response.data.canSubmit) {
                    // User cannot submit - redirect them
                    alert(response.data.message);
                    if (response.data.redirectTo) {
                        navigate(response.data.redirectTo);
                    }
                } else if (response.data.warning) {
                    // Previous request was rejected - show warning
                    setShowRejectedWarning(true);
                    setPreviousRequestDetails({
                        requestId: response.data.previousRequestId,
                        date: response.data.previousRejectionDate
                    });
                }
                // If canSubmit is true, just show the form
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            if (error.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/login');
            } else if (error.response?.status === 404) {
                // No requests found - this is fine, allow form
                console.log('No existing requests found');
            } else {
                alert('Unable to verify your request status. Please try again.');
            }
        } finally {
            setCheckingEligibility(false);
        }
    };

    // CNIC Number Format: 12345-1234567-1
    const formatCNIC = (value) => {
        const numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length <= 5) return numbers;
        if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cnic_number') {
            formattedValue = formatCNIC(value);
            const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
            if (formattedValue.length === 15 && !cnicRegex.test(formattedValue)) {
                setErrors(prev => ({ ...prev, cnic_number: 'Invalid CNIC format' }));
            } else {
                setErrors(prev => ({ ...prev, cnic_number: '' }));
            }
        }

        if (name === 'phone_number') {
            const phoneRegex = /^03[0-9]{9}$/;
            if (value && !phoneRegex.test(value)) {
                setErrors(prev => ({ ...prev, phone_number: 'Phone number must start with 03 and be 11 digits' }));
            } else {
                setErrors(prev => ({ ...prev, phone_number: '' }));
            }
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
        if (submitSuccess) setSubmitSuccess(false);
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, [type]: 'Only JPEG, PNG, and JPG images are allowed' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [type]: 'File size must be less than 5MB' }));
            return;
        }

        setErrors(prev => ({ ...prev, [type]: '' }));

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'front') {
                setCnicFrontImage(reader.result);
                setCnicFrontPreview(reader.result);
            } else {
                setCnicBackImage(reader.result);
                setCnicBackPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.cnic_number) {
            newErrors.cnic_number = 'CNIC number is required';
        } else if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(formData.cnic_number)) {
            newErrors.cnic_number = 'CNIC number must be in format: 12345-1234567-1';
        }

        if (!cnicFrontImage) {
            newErrors.cnic_front = 'CNIC front image is required';
        }

        if (!cnicBackImage) {
            newErrors.cnic_back = 'CNIC back image is required';
        }

        if (!formData.phone_number) {
            newErrors.phone_number = 'Phone number is required';
        } else if (!/^03[0-9]{9}$/.test(formData.phone_number)) {
            newErrors.phone_number = 'Enter a valid Pakistani phone number (03XXXXXXXXX)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to submit a request');
                navigate('/login');
                return;
            }

            // Validate images are base64 strings
            if (!cnicFrontImage || !cnicFrontImage.startsWith('data:image')) {
                throw new Error('Invalid front image format');
            }
            if (!cnicBackImage || !cnicBackImage.startsWith('data:image')) {
                throw new Error('Invalid back image format');
            }

            const response = await axios.post(
                `${BaseUrl}api/host-requests/submit`,
                {
                    cnic_number: formData.cnic_number,
                    cnic_front_image: cnicFrontImage,
                    cnic_back_image: cnicBackImage,
                    phone_number: formData.phone_number,
                    additional_info: formData.additional_info || null
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout for image uploads
                }
            );

            if (response.data.success) {
                setSubmitSuccess(true);
                setLastRequestId(response.data.request_id);

                // Reset form
                setFormData({
                    cnic_number: '',
                    phone_number: '',
                    additional_info: ''
                });
                setCnicFrontImage(null);
                setCnicBackImage(null);
                setCnicFrontPreview('');
                setCnicBackPreview('');

                // Show success message
                alert(response.data.message);

                // Set timer for redirect
                const timer = setTimeout(() => {
                    navigate(`/host-requests/status/${response.data.request_id}`);
                }, 3000);
                setRedirectTimer(timer);
            }
        } catch (error) {
            console.error('Submission error:', error);

            // Handle different error scenarios
            if (error.response?.status === 400 && error.response?.data?.existing_request_id) {
                alert(error.response.data.message);
                navigate(`/host-requests/status/${error.response.data.existing_request_id}`);
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else if (error.response?.status === 401) {
                alert('Session expired. Please login again.');
                navigate('/login');
            } else if (error.code === 'ERR_NETWORK') {
                alert('Network error. Please check your connection.');
            } else if (error.message === 'Invalid front image format' || error.message === 'Invalid back image format') {
                alert(error.message);
            } else {
                alert('Failed to submit request. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (type) => {
        if (type === 'front') {
            setCnicFrontImage(null);
            setCnicFrontPreview('');
        } else {
            setCnicBackImage(null);
            setCnicBackPreview('');
        }
    };

    const viewMyRequests = () => {
        // Clear any pending redirect timer
        if (redirectTimer) {
            clearTimeout(redirectTimer);
            setRedirectTimer(null);
        }
        navigate('/host-requests/status');
    };

    const resetForm = () => {
        if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
            setFormData({
                cnic_number: '',
                phone_number: '',
                additional_info: ''
            });
            setCnicFrontImage(null);
            setCnicBackImage(null);
            setCnicFrontPreview('');
            setCnicBackPreview('');
            setSubmitSuccess(false);
            setLastRequestId(null);
            setErrors({});
            // Clear any pending redirect
            if (redirectTimer) {
                clearTimeout(redirectTimer);
                setRedirectTimer(null);
            }
        }
    };

    // Show loading while checking eligibility
    if (checkingEligibility) {
        return (
            <div className="host-request-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Verifying your request status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="host-request-container">
            <div className="host-request-card">
                {/* Header with buttons */}
                <div className="form-header">
                    <div>
                        <h2>Become a Host</h2>
                        <p className="subtitle">Please provide the following information to become a host</p>
                    </div>
                    <div className="header-buttons">
                        <button
                            type="button"
                            onClick={viewMyRequests}
                            className="view-requests-btn"
                        >
                            📋 View My Requests
                        </button>
                    </div>
                </div>

                {/* Rejected Warning Message */}
                {showRejectedWarning && (
                    <div className="warning-message">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                            <h4>Previous Request Was Rejected</h4>
                            <p>Your previous host request was rejected. You can submit a new request with corrected information.</p>
                            {previousRequestDetails && (
                                <button
                                    onClick={() => navigate(`/host-requests/status/${previousRequestDetails.requestId}`)}
                                    className="view-rejected-btn"
                                >
                                    View Previous Request
                                </button>
                            )}
                        </div>
                        <button onClick={() => setShowRejectedWarning(false)} className="close-warning">
                            ×
                        </button>
                    </div>
                )}

                {/* Success Message */}
                {submitSuccess && (
                    <div className="success-message">
                        <span className="success-icon">✅</span>
                        <div className="success-content">
                            <h4>Request Submitted Successfully!</h4>
                            <p>Your host request has been submitted. Redirecting to status page...</p>
                            {lastRequestId && (
                                <button
                                    onClick={() => {
                                        if (redirectTimer) clearTimeout(redirectTimer);
                                        navigate(`/host-requests/status/${lastRequestId}`);
                                    }}
                                    className="track-status-btn"
                                >
                                    Track This Request Now
                                </button>
                            )}
                        </div>
                        <button onClick={() => setSubmitSuccess(false)} className="close-success">
                            ×
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* CNIC Number Field */}
                    <div className="form-group">
                        <label htmlFor="cnic_number">
                            CNIC Number <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="cnic_number"
                            name="cnic_number"
                            value={formData.cnic_number}
                            onChange={handleInputChange}
                            placeholder="12345-1234567-1"
                            maxLength="15"
                            className={errors.cnic_number ? 'error' : ''}
                        />
                        {errors.cnic_number && <span className="error-message">{errors.cnic_number}</span>}
                        <small className="hint">Format: 12345-1234567-1</small>
                    </div>

                    {/* CNIC Front Image */}
                    <div className="form-group">
                        <label>
                            CNIC Front Image <span className="required">*</span>
                        </label>
                        <div className="file-upload-container">
                            {!cnicFrontPreview ? (
                                <label className="file-upload-label">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={(e) => handleFileChange(e, 'front')}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-area">
                                        <span className="upload-icon">📸</span>
                                        <span>Click to upload CNIC front</span>
                                        <small>JPEG, PNG, JPG (max 5MB)</small>
                                    </div>
                                </label>
                            ) : (
                                <div className="image-preview">
                                    <img src={cnicFrontPreview} alt="CNIC Front" />
                                    <button type="button" onClick={() => removeImage('front')} className="remove-btn">
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.cnic_front && <span className="error-message">{errors.cnic_front}</span>}
                    </div>

                    {/* CNIC Back Image */}
                    <div className="form-group">
                        <label>
                            CNIC Back Image <span className="required">*</span>
                        </label>
                        <div className="file-upload-container">
                            {!cnicBackPreview ? (
                                <label className="file-upload-label">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={(e) => handleFileChange(e, 'back')}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="upload-area">
                                        <span className="upload-icon">📸</span>
                                        <span>Click to upload CNIC back</span>
                                        <small>JPEG, PNG, JPG (max 5MB)</small>
                                    </div>
                                </label>
                            ) : (
                                <div className="image-preview">
                                    <img src={cnicBackPreview} alt="CNIC Back" />
                                    <button type="button" onClick={() => removeImage('back')} className="remove-btn">
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.cnic_back && <span className="error-message">{errors.cnic_back}</span>}
                    </div>

                    {/* Phone Number */}
                    <div className="form-group">
                        <label htmlFor="phone_number">
                            Phone Number <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            id="phone_number"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            placeholder="03XXXXXXXXX"
                            maxLength="11"
                            className={errors.phone_number ? 'error' : ''}
                        />
                        {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
                        <small className="hint">Enter a valid Pakistani phone number (11 digits)</small>
                    </div>

                    {/* Additional Info */}
                    <div className="form-group">
                        <label htmlFor="additional_info">Additional Information (Optional)</label>
                        <textarea
                            id="additional_info"
                            name="additional_info"
                            value={formData.additional_info}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Tell us why you want to become a host, your experience, or any other relevant information..."
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="reset-btn"
                            disabled={loading}
                        >
                            Reset Form
                        </button>
                        <button type="submit" disabled={loading} className="submit-btn">
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="info-box">
                    <h4>📌 What happens after submission?</h4>
                    <ul>
                        <li>Your request will be reviewed by our admin team</li>
                        <li>You will receive updates on your request status</li>
                        <li>Typical review time: 2-3 business days</li>
                        <li>You can track your request status anytime</li>
                        <li>You will be notified via email about the decision</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HostRequestForm;