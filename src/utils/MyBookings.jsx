import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import '../componentstyles/utilstyle/MyBookings.css';
import BaseUrl from './AppConstants.jsx';
import ChatButton from '../chat-frontend/components/ChatButton.jsx';

const MyBookings = () => {
    const navigate = useNavigate();
    const { toasts, addToast, removeToast, success, error, warning, info } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const [forceDelete, setForceDelete] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0
    });

    // Axios instance
    const apiClient = axios.create({
        baseURL: BaseUrl,
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json',
        }
    });

    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Helper function to extract image URL from various formats
    const extractImageUrl = (images) => {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return getFallbackImage();
        }

        const firstImage = images[0];

        // If it's an object with image_base64
        if (typeof firstImage === 'object' && firstImage.image_base64) {
            let img = firstImage.image_base64;
            // Fix for application/octet-stream
            if (typeof img === 'string' && img.startsWith('data:application/octet-stream')) {
                img = img.replace('data:application/octet-stream', 'data:image/jpeg');
            }
            return img;
        }

        // If it's a string URL
        if (typeof firstImage === 'string') {
            if (firstImage.startsWith('http') || firstImage.startsWith('data:image')) {
                return firstImage;
            }
            if (firstImage.startsWith('/')) {
                return `${BaseUrl}${firstImage}`;
            }
            return firstImage;
        }

        return getFallbackImage();
    };

    const getFallbackImage = () => {
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop';
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('api/bookings/my-bookings');
            // console.log('Bookings response:', response.data);

            if (response.data.success) {
                setBookings(response.data.bookings);
                calculateStats(response.data.bookings);
                success('Bookings loaded successfully!');
            } else {
                error('Failed to load bookings');
            }
        } catch (err) {
            console.error('Error fetching bookings:', err);
            if (err.response?.status === 401) {
                error('Please login to view your bookings');
                navigate('/login');
            } else {
                error('Failed to load bookings. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (bookingsList) => {
        const stats = {
            total: bookingsList.length,
            confirmed: bookingsList.filter(b => b.status === 'confirmed').length,
            cancelled: bookingsList.filter(b => b.status === 'cancelled').length,
            completed: bookingsList.filter(b => b.status === 'completed').length
        };
        setStats(stats);
    };

    const cancelBooking = async (bookingId) => {
        try {
            setCancellingId(bookingId);
            const response = await apiClient.patch(`api/bookings/${bookingId}/cancel`);

            if (response.data.success) {
                success('Booking cancelled successfully!');
                fetchBookings();
                setShowCancelModal(false);
                setSelectedBooking(null);
            } else {
                error(response.data.message || 'Failed to cancel booking');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            error(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancellingId(null);
        }
    };

    const deleteAllBookings = async () => {
        setDeleteAllLoading(true);
        try {
            const url = forceDelete
                ? `api/bookings/delete-all?force=true`
                : `api/bookings/delete-all`;

            const response = await apiClient.delete(url);

            if (response.data.success) {
                success(response.data.message || 'All bookings deleted successfully!');
                fetchBookings();
                setShowDeleteAllModal(false);
                setForceDelete(false);
            } else {
                error(response.data.message || 'Failed to delete bookings');
            }
        } catch (err) {
            console.error('Error deleting all bookings:', err);

            if (err.response?.data?.activeCount) {
                warning(`You have ${err.response.data.activeCount} active booking(s). Check the box below to cancel and delete them.`);
                setForceDelete(true);
            } else {
                error(err.response?.data?.message || 'Failed to delete bookings. Please try again.');
                setShowDeleteAllModal(false);
            }
        } finally {
            setDeleteAllLoading(false);
        }
    };

    const handleBookAgain = (booking) => {
        navigate(`/spaces/${booking.space_unit_id}`);
        success('Redirecting to space booking page...');
    };

    const handleViewDetails = (booking, e) => {
        e.stopPropagation();
        setSelectedBooking(booking);
    };

    const handleCancelClick = (booking, e) => {
        e.stopPropagation();
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'confirmed':
                return { class: 'status-confirmed', text: 'Confirmed', icon: '✓' };
            case 'pending':
                return { class: 'status-pending', text: 'Pending', icon: '⏳' };
            case 'cancelled':
                return { class: 'status-cancelled', text: 'Cancelled', icon: '✗' };
            case 'completed':
                return { class: 'status-completed', text: 'Completed', icon: '✔' };
            default:
                return { class: 'status-default', text: status, icon: '📌' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatDateSimple = (dateString) => {
        if (!dateString) return 'N/A';
        const options = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffHours = Math.abs(end - start) / (1000 * 60 * 60);

        if (diffHours < 24) {
            return `${Math.round(diffHours)}h`;
        } else {
            const days = Math.floor(diffHours / 24);
            const hours = Math.round(diffHours % 24);
            if (hours === 0) {
                return `${days}d`;
            }
            return `${days}d ${hours}h`;
        }
    };

    const getFilteredBookings = () => {
        if (filter === 'all') return bookings;
        return bookings.filter(booking => booking.status === filter);
    };

    const canCancel = (booking) => {
        if (!booking || !booking.start_time) return false;
        const startTime = new Date(booking.start_time);
        const now = new Date();
        return booking.status === 'confirmed' && startTime > now;
    };

    const canBookAgain = (booking) => {
        return booking.status === 'cancelled' || booking.status === 'completed';
    };

    const hasActiveBookings = () => {
        return bookings.some(booking =>
            booking.status === 'confirmed' &&
            new Date(booking.start_time) > new Date()
        );
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = getFilteredBookings();

    // if (loading) {
    //     return (
    //         <div className="mybookings-loading">
    //             <div className="loading-spinner"></div>
    //             <p>Loading your bookings...</p>
    //         </div>
    //     );
    // }

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="mybookings-wrapper">
                <div className="mybookings-container">
                    {/* Header */}
                    <div className="bookings-header">
                        <button className="back-button" onClick={() => navigate(-1)}>
                            ← Back
                        </button>
                        <h1 className="page-title">My Bookings</h1>
                        <div className="header-spacer"></div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">📊</div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.total}</span>
                                <span className="stat-label">Total Bookings</span>
                            </div>
                        </div>
                        <div className="stat-card confirmed">
                            <div className="stat-icon">✓</div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.confirmed}</span>
                                <span className="stat-label">Confirmed</span>
                            </div>
                        </div>
                        <div className="stat-card cancelled">
                            <div className="stat-icon">✗</div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.cancelled}</span>
                                <span className="stat-label">Cancelled</span>
                            </div>
                        </div>
                        <div className="stat-card completed">
                            <div className="stat-icon">✔</div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.completed}</span>
                                <span className="stat-label">Completed</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {bookings.length > 0 && (
                            <button
                                className="delete-all-btn"
                                onClick={() => setShowDeleteAllModal(true)}
                            >
                                🗑️ Delete All Bookings
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                            onClick={() => setFilter('confirmed')}
                        >
                            Confirmed ({stats.confirmed})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
                            onClick={() => setFilter('cancelled')}
                        >
                            Cancelled ({stats.cancelled})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            Completed ({stats.completed})
                        </button>
                    </div>

                    {/* Bookings List */}
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h3>No bookings found</h3>
                            <p>You haven't made any bookings yet.</p>
                            <button className="browse-button" onClick={() => navigate('/')}>
                                🏠 Browse Spaces
                            </button>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {filteredBookings.map((booking) => {
                                const statusInfo = getStatusInfo(booking.status);
                                const unitImage = extractImageUrl(booking.unit?.images);

                                return (
                                    <div
                                        key={booking.id}
                                        className="booking-item"
                                        onClick={() => handleBookAgain(booking)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="booking-image">
                                            <img
                                                src={unitImage}
                                                alt={booking.unit?.name || 'Space'}
                                                onError={(e) => {
                                                    e.target.src = getFallbackImage();
                                                }}
                                            />
                                            <span className="booking-duration">{getDuration(booking.start_time, booking.end_time)}</span>
                                            {canBookAgain(booking) && (
                                                <div className="book-again-overlay">
                                                    <span>Click to book again 🔄</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="booking-content">
                                            <div className="booking-main">
                                                <div className="booking-info-header">
                                                    <h3 className="booking-name">
                                                        {booking.unit?.name || booking.unit?.unit_type?.replace('_', ' ')}
                                                    </h3>
                                                    <span className={`status-badge ${statusInfo.class}`}>
                                                        {statusInfo.icon} {statusInfo.text}
                                                    </span>
                                                </div>

                                                <div className="booking-details-grid">
                                                    <div className="detail-item">
                                                        <span>📍</span>
                                                        <span>{booking.space?.name}, {booking.space?.city}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span>#</span>
                                                        <span>{booking.booking_ref}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span>📅</span>
                                                        <span>{formatDateSimple(booking.start_time)} - {formatDateSimple(booking.end_time)}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span>💰</span>
                                                        <span className="price">PKR {parseFloat(booking.total_price).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="booking-actions">
                                                <button
                                                    className="btn-view"
                                                    onClick={(e) => handleViewDetails(booking, e)}
                                                >
                                                    👁️ Details
                                                </button>

                                                {/* ── Chat with Owner button ── */}
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ChatButton
                                                        bookingId={booking.id}
                                                        label="💬 Message Owner"
                                                        variant="outline"
                                                    />
                                                </div>
                                                {/* ─────────────────────────── */}

                                                {canCancel(booking) && (
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={(e) => handleCancelClick(booking, e)}
                                                    >
                                                        🗑️ Cancel
                                                    </button>
                                                )}
                                                {canBookAgain(booking) && (
                                                    <button
                                                        className="btn-book-again"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBookAgain(booking);
                                                        }}
                                                    >
                                                        🔄 Book Again
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Delete All Bookings Modal */}
                    {showDeleteAllModal && (
                        <div className="modal-overlay" onClick={() => setShowDeleteAllModal(false)}>
                            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Delete All Bookings</h3>
                                    <button className="modal-close" onClick={() => setShowDeleteAllModal(false)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div className="warning-message" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                                        ⚠️ <strong>Warning!</strong> This action cannot be undone.
                                    </div>

                                    <p>Are you sure you want to delete <strong>all {bookings.length} booking(s)</strong>?</p>

                                    {hasActiveBookings() && (
                                        <div className="active-warning" style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, color: '#d97706' }}>
                                                ⚠️ You have <strong>{stats.confirmed}</strong> active/upcoming booking(s).
                                            </p>
                                            <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={forceDelete}
                                                    onChange={(e) => setForceDelete(e.target.checked)}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span>Automatically cancel and delete active bookings</span>
                                            </label>
                                            <p style={{ fontSize: '12px', marginTop: '8px', color: '#92400e' }}>
                                                {forceDelete
                                                    ? "Active bookings will be cancelled before deletion."
                                                    : "Check this box to cancel active bookings before deletion."}
                                            </p>
                                        </div>
                                    )}

                                    <div className="delete-summary" style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        <strong>Summary:</strong>
                                        <div style={{ marginTop: '8px' }}>
                                            <div>• Total bookings: <strong>{stats.total}</strong></div>
                                            <div>• Confirmed: <strong>{stats.confirmed}</strong></div>
                                            <div>• Cancelled: <strong>{stats.cancelled}</strong></div>
                                            <div>• Completed: <strong>{stats.completed}</strong></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => {
                                        setShowDeleteAllModal(false);
                                        setForceDelete(false);
                                    }}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={deleteAllBookings}
                                        disabled={deleteAllLoading}
                                        style={{ backgroundColor: '#dc2626' }}
                                    >
                                        {deleteAllLoading ? 'Deleting...' : 'Yes, Delete All Bookings'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancel Modal */}
                    {showCancelModal && selectedBooking && (
                        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Cancel Booking</h3>
                                    <button className="modal-close" onClick={() => setShowCancelModal(false)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <p>Are you sure you want to cancel this booking?</p>
                                    <div className="cancel-summary">
                                        <div className="summary-row">
                                            <span>Space:</span>
                                            <strong>{selectedBooking.unit?.name}</strong>
                                        </div>
                                        <div className="summary-row">
                                            <span>Date:</span>
                                            <strong>{formatDate(selectedBooking.start_time)}</strong>
                                        </div>
                                        <div className="summary-row">
                                            <span>Total:</span>
                                            <strong>PKR {parseFloat(selectedBooking.total_price).toLocaleString()}</strong>
                                        </div>
                                    </div>
                                    <div className="warning-message">
                                        ⚠️ This action cannot be undone.
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>
                                        Keep Booking
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={() => cancelBooking(selectedBooking.id)}
                                        disabled={cancellingId === selectedBooking.id}
                                    >
                                        {cancellingId === selectedBooking.id ? 'Cancelling...' : 'Yes, Cancel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Modal */}
                    {selectedBooking && !showCancelModal && !showDeleteAllModal && (
                        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
                            <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Booking Details</h3>
                                    <button className="modal-close" onClick={() => setSelectedBooking(null)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div className="details-section">
                                        <h4>Booking Information</h4>
                                        <div className="details-grid">
                                            <div><strong>Reference:</strong> {selectedBooking.booking_ref}</div>
                                            <div><strong>Status:</strong> {selectedBooking.status}</div>
                                            <div><strong>Created:</strong> {formatDate(selectedBooking.created_at)}</div>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4>Space Details</h4>
                                        <div className="details-grid">
                                            <div><strong>Space:</strong> {selectedBooking.space?.name}</div>
                                            <div><strong>Unit Type:</strong> {selectedBooking.unit?.unit_type?.replace('_', ' ')}</div>
                                            <div><strong>Capacity:</strong> {selectedBooking.unit?.total_capacity} people</div>
                                            <div><strong>Address:</strong> {selectedBooking.space?.address}</div>
                                            <div><strong>City:</strong> {selectedBooking.space?.city}</div>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4>Schedule</h4>
                                        <div className="details-grid">
                                            <div><strong>Check-in:</strong> {formatDate(selectedBooking.start_time)}</div>
                                            <div><strong>Check-out:</strong> {formatDate(selectedBooking.end_time)}</div>
                                            <div><strong>Duration:</strong> {getDuration(selectedBooking.start_time, selectedBooking.end_time)}</div>
                                        </div>
                                    </div>

                                    <div className="details-section">
                                        <h4>Payment</h4>
                                        <div className="details-grid">
                                            <div><strong>Total Price:</strong> PKR {parseFloat(selectedBooking.total_price).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    {/* ── Chat from Details Modal ── */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ChatButton
                                            bookingId={selectedBooking.id}
                                            label="💬 Message Owner"
                                            variant="primary"
                                        />
                                    </div>
                                    {/* ─────────────────────────── */}
                                    {canBookAgain(selectedBooking) && (
                                        <button
                                            className="btn-book-again-modal"
                                            onClick={() => {
                                                setSelectedBooking(null);
                                                handleBookAgain(selectedBooking);
                                            }}
                                        >
                                            🔄 Book This Space Again
                                        </button>
                                    )}
                                    <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyBookings;