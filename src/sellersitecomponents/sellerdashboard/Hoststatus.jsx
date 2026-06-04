import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import BaseUrl from '../../utils/AppConstants';
import '../../componentstyles/sellerdashboardstyles/hostrequeststatus.css';

const RequestStatus = () => {
    const { requestId } = useParams(); // Get requestId from URL params (can be undefined)
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [allRequests, setAllRequests] = useState([]); // For list view if needed

    useEffect(() => {
        if (requestId && requestId !== 'undefined') {
            // Scenario 1: We have a specific request ID
            fetchSpecificRequest(requestId);
        } else {
            // Scenario 2: No ID provided - try to get latest request
            fetchLatestRequest();
        }
    }, [requestId]);

    // Fetch a specific request by ID
    const fetchSpecificRequest = async (id) => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to view your request');
                navigate('/login');
                return;
            }

            const response = await axios.get(`${BaseUrl}api/host-requests/status/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setRequest(response.data.request);
            } else {
                setError(response.data.message || 'Failed to fetch request');
            }
        } catch (error) {
            console.error('Error fetching request:', error);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch the latest request for the user (when no ID provided)
    const fetchLatestRequest = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login to view your request');
                navigate('/login');
                return;
            }

            // First, get all requests to find the latest
            const response = await axios.get(`${BaseUrl}api/host-requests/my-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success && response.data.requests.length > 0) {
                // Get the most recent request
                const latestRequest = response.data.requests[0];
                // Now fetch its full details
                await fetchSpecificRequest(latestRequest.id);
            } else {
                // No requests found
                setError('You haven\'t submitted any host requests yet.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching latest request:', error);
            handleError(error);
            setLoading(false);
        }
    };

    // Handle different error types
    const handleError = (error) => {
        if (error.response?.status === 401) {
            setError('Session expired. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
        } else if (error.response?.status === 403) {
            setError('You do not have permission to view this request');
        } else if (error.response?.status === 404) {
            setError('Host request not found');
        } else {
            setError('Failed to load request. Please try again.');
        }
    };

    // Fetch all user requests (for the list view)
    const fetchAllRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BaseUrl}api/host-requests/my-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data.success) {
                setAllRequests(response.data.requests);
            }
        } catch (error) {
            console.error('Error fetching all requests:', error);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                class: 'status-pending',
                text: 'Pending Review',
                icon: '⏳',
                description: 'Your request is being reviewed by admin'
            },
            approved: {
                class: 'status-approved',
                text: 'Approved',
                icon: '✅',
                description: 'Congratulations! Your request has been approved'
            },
            rejected: {
                class: 'status-rejected',
                text: 'Rejected',
                icon: '❌',
                description: 'Your request has been rejected'
            }
        };
        const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
        return (
            <span className={`status-badge ${config.class}`}>
                {config.icon} {config.text}
            </span>
        );
    };

    const getStatusProgress = (status) => {
        const steps = [
            { name: 'Request Submitted', key: 'submitted' },
            { name: 'Admin Review', key: 'review' },
            { name: 'Final Decision', key: 'decision' }
        ];

        let currentStep = 0;
        if (status === 'pending') currentStep = 1;
        if (status === 'approved' || status === 'rejected') currentStep = 2;

        return { steps, currentStep };
    };

    const refreshRequest = () => {
        if (requestId && requestId !== 'undefined') {
            fetchSpecificRequest(requestId);
        } else {
            fetchLatestRequest();
        }
    };

    const goBack = () => {
        navigate('/My-Profile'); // Go to list page instead of back
    };

    const viewAllRequests = () => {
        // navigate('/my-host-requests');
    };

    // Loading state
    if (loading) {
        return (
            <div className="status-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading request status...</p>
                </div>
            </div>
        );
    }

    // Error state with action buttons
    if (error) {
        return (
            <div className="status-container">
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <h3>Error Loading Request</h3>
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={refreshRequest} className="retry-btn">
                            Try Again
                        </button>
                        {/* <button onClick={viewAllRequests} className="view-all-btn">
                            View All Requests
                        </button> */}
                        {/* <button onClick={() => navigate('/become-host')} className="submit-new-btn">
                            Submit New Request
                        </button> */}
                    </div>
                </div>
            </div>
        );
    }

    // No request found
    if (!request) {
        return (
            <div className="status-container">
                <div className="error-state">
                    <span className="empty-icon">📝</span>
                    <h3>No Host Requests Found</h3>
                    <p>You haven't submitted any host requests yet.</p>
                    <div className="error-actions">
                        <button onClick={() => navigate('/become-host')} className="submit-new-btn">
                            Become a Host
                        </button>
                        {/* <button onClick={viewAllRequests} className="view-all-btn">
                            View All Requests
                        </button> */}
                    </div>
                </div>
            </div>
        );
    }

    // Main render - request found
    return (
        <div className="status-container">
            <div className="status-card">
                <div className="status-header">
                    <div>
                        <h2>Host Request Status</h2>
                        <p className="subtitle">Track your host application progress</p>
                    </div>
                    <div className="header-actions">
                        <button onClick={refreshRequest} className="refresh-btn" title="Refresh">
                            🔄
                        </button>
                        {/* <button onClick={viewAllRequests} className="list-btn" title="View All Requests">
                            📋 All Requests
                        </button> */}
                        <button onClick={goBack} className="back-button" title="Go Back">
                            ← Back
                        </button>
                    </div>
                </div>

                {/* Request Overview */}
                <div className="request-overview">
                    <div className="overview-header">
                        <div className="request-id-section">
                            <span className="request-label">Request ID</span>
                            <span className="request-id-value">#{request.id}</span>
                        </div>
                        {getStatusBadge(request.status)}
                    </div>

                    {request.status_description && (
                        <div className={`status-description status-${request.status}`}>
                            <p>{request.status_description}</p>
                        </div>
                    )}
                </div>

                {/* User Information (from JOIN) */}
                {request.user_name && request.user_email && (
                    <div className="user-info-section">
                        <h3>Applicant Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <strong>Name:</strong>
                                <span>{request.user_name}</span>
                            </div>
                            <div className="detail-item">
                                <strong>Email:</strong>
                                <span>{request.user_email}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Timeline */}
                <div className="progress-section">
                    <h3>Application Progress</h3>
                    <div className="progress-timeline">
                        {getStatusProgress(request.status).steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`timeline-step ${idx <= getStatusProgress(request.status).currentStep ? 'completed' : ''
                                    } ${request.status === 'rejected' && idx === 2 ? 'rejected' : ''}`}
                            >
                                <div className="timeline-dot">
                                    {idx <= getStatusProgress(request.status).currentStep && idx !== 2 && '✓'}
                                    {request.status === 'rejected' && idx === 2 && '✗'}
                                </div>
                                <div className="timeline-content">
                                    <div className="timeline-label">{step.name}</div>
                                    {idx === 0 && request.created_at && (
                                        <div className="timeline-date">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                    {idx === 2 && request.updated_at && request.status !== 'pending' && (
                                        <div className="timeline-date">
                                            {new Date(request.updated_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Request Details */}
                <div className="request-details-section">
                    <h3>Request Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <strong>CNIC Number:</strong>
                            <span>{request.cnic_number}</span>
                        </div>
                        <div className="detail-item">
                            <strong>Phone Number:</strong>
                            <span>{request.phone_number}</span>
                        </div>
                        <div className="detail-item">
                            <strong>Submitted:</strong>
                            <span>{new Date(request.created_at).toLocaleString()}</span>
                        </div>
                        {request.updated_at && request.status !== 'pending' && (
                            <div className="detail-item">
                                <strong>Last Updated:</strong>
                                <span>{new Date(request.updated_at).toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {request.additional_info && (
                        <div className="additional-info">
                            <strong>Additional Information:</strong>
                            <p>{request.additional_info}</p>
                        </div>
                    )}
                </div>

                {/* Admin Feedback */}
                {request.admin_comment && (
                    <div className={`admin-feedback ${request.status}`}>
                        <h3>Admin Feedback</h3>
                        <div className="feedback-content">
                            <p>{request.admin_comment}</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="action-buttons">
                    {request.status === 'rejected' && (
                        <button
                            onClick={() => navigate('/become-host')}
                            className="resubmit-btn"
                        >
                            Submit New Request
                        </button>
                    )}
                    {request.status === 'approved' && (
                        <button
                            onClick={() => navigate('/seller-dashboard')}
                            className="dashboard-btn"
                        >
                            Go to Dashboard
                        </button>
                    )}
                    {/* <button onClick={viewAllRequests} className="secondary-btn">
                        View All Requests
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default RequestStatus;