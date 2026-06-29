import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './UseTost';
import ToastContainer from './Tostercontainer';
import '../componentstyles/utilstyle/MyBookings.css';
import BaseUrl from './AppConstants.jsx';
import ChatButton from '../chat-frontend/components/ChatButton.jsx';

// ─── Dispute Modal ────────────────────────────────────────────────────────────
const DisputeModal = ({ isOpen, onClose, onConfirm, existingDispute }) => {
    const [reason, setReason] = useState(existingDispute?.reason || '');
    const [description, setDescription] = useState(existingDispute?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsSubmitting(true);
        try {
            await onConfirm(reason, description);
            setReason('');
            setDescription('');
            onClose();
        } catch (err) {
            console.error('Dispute error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ {existingDispute ? 'View Dispute' : 'Raise a Dispute'}</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {existingDispute && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: existingDispute.status === 'resolved' ? '#d1fae5' : '#fef3c7',
                            borderRadius: '8px',
                            color: existingDispute.status === 'resolved' ? '#065f46' : '#92400e'
                        }}>
                            <strong>Status: {existingDispute.status.charAt(0).toUpperCase() + existingDispute.status.slice(1)}</strong>
                            {existingDispute.resolution && <div style={{ marginTop: '8px' }}>Resolution: {existingDispute.resolution}</div>}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3e0', borderRadius: '8px', color: '#92400e', fontSize: '14px' }}>
                        {existingDispute ? 'Dispute details for this booking.' : 'Only confirmed bookings are eligible for a dispute. Admin will review and respond via email.'}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                            Reason *
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Payment issue, property damage..."
                            required
                            disabled={!!existingDispute}
                            style={{
                                width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5',
                                borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
                                ...(existingDispute ? { background: '#f3f4f6', cursor: 'not-allowed' } : {})
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>
                            Additional Details {!existingDispute && '(optional)'}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={existingDispute ? "Dispute description" : "Describe the issue in detail..."}
                            rows="4"
                            disabled={!!existingDispute}
                            style={{
                                width: '100%', padding: '10px 12px', border: '1.5px solid #e5e5e5',
                                borderRadius: '8px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box',
                                ...(existingDispute ? { background: '#f3f4f6', cursor: 'not-allowed' } : {})
                            }}
                        />
                    </div>

                    {!existingDispute && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                            ⚠️ Once submitted, your dispute cannot be withdrawn. Admin will contact both parties.
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>{existingDispute ? 'Close' : 'Cancel'}</button>
                    {!existingDispute && (
                        <button
                            className="btn-danger"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !reason.trim()}
                            style={{ backgroundColor: '#dc2626' }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MyBookings = () => {
    const navigate = useNavigate();
    const { toasts, removeToast, success, error, warning } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleteAllLoading, setDeleteAllLoading] = useState(false);
    const [forceDelete, setForceDelete] = useState(false);
    const [stats, setStats] = useState({ total: 0, confirmed: 0, cancelled: 0, completed: 0, disputed: 0 });

    const apiClient = axios.create({ baseURL: BaseUrl, timeout: 30000, headers: { 'Content-Type': 'application/json' } });
    apiClient.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    });

    const extractImageUrl = (images) => {
        if (!images || !Array.isArray(images) || images.length === 0) return getFallbackImage();
        const firstImage = images[0];
        if (typeof firstImage === 'object' && firstImage.image_base64) {
            let img = firstImage.image_base64;
            if (typeof img === 'string' && img.startsWith('data:application/octet-stream'))
                img = img.replace('data:application/octet-stream', 'data:image/jpeg');
            return img;
        }
        if (typeof firstImage === 'string') {
            if (firstImage.startsWith('http') || firstImage.startsWith('data:image')) return firstImage;
            if (firstImage.startsWith('/')) return `${BaseUrl}${firstImage}`;
            return firstImage;
        }
        return getFallbackImage();
    };

    const getFallbackImage = () => 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop';

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('api/bookings/my-bookings');
            if (response.data.success) {
                // ✅ FIX: Normalize dispute data - only keep if it has a status
                const normalizedBookings = response.data.bookings.map(booking => ({
                    ...booking,
                    dispute: booking.dispute?.status ? booking.dispute : null
                }));

                console.log('📊 Bookings with disputes:', normalizedBookings.filter(b => b.dispute));
                setBookings(normalizedBookings);
                calculateStats(normalizedBookings);
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

    const calculateStats = (list) => {
        setStats({
            total: list.length,
            confirmed: list.filter(b => b.status === 'confirmed' && !b.dispute).length,
            cancelled: list.filter(b => b.status === 'cancelled').length,
            completed: list.filter(b => b.status === 'completed').length,
            disputed: list.filter(b => b.dispute && b.dispute.status !== 'resolved').length,
        });
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
            error(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancellingId(null);
        }
    };

    const handleCreateDispute = async (reason, description) => {
        if (!selectedBooking) return;
        try {
            const response = await apiClient.post(
                `api/bookings/${selectedBooking.id}/dispute`,
                { reason, description }
            );
            if (response.data.success) {
                success('⚠️ Dispute submitted. Admin has been notified.');
                setShowDisputeModal(false);
                setSelectedBooking(null);
                fetchBookings();
            } else {
                error(response.data.message || 'Failed to submit dispute');
            }
        } catch (err) {
            error(err.response?.data?.message || 'Failed to submit dispute');
        }
    };

    const deleteAllBookings = async () => {
        setDeleteAllLoading(true);
        try {
            const url = forceDelete ? `api/bookings/delete-all?force=true` : `api/bookings/delete-all`;
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

    const handleDisputeClick = (booking, e) => {
        e.stopPropagation();
        setSelectedBooking(booking);
        setShowDisputeModal(true);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'confirmed': return { class: 'status-confirmed', text: 'Confirmed', icon: '✓' };
            case 'pending': return { class: 'status-pending', text: 'Pending', icon: '⏳' };
            case 'cancelled': return { class: 'status-cancelled', text: 'Cancelled', icon: '✗' };
            case 'completed': return { class: 'status-completed', text: 'Completed', icon: '✔' };
            default: return { class: 'status-default', text: status, icon: '📌' };
        }
    };

    const getDisputeStatusInfo = (dispute) => {
        if (!dispute) return null;
        switch (dispute.status) {
            case 'pending': return { class: 'dispute-pending', text: 'Dispute Pending', icon: '⏳' };
            case 'resolved': return { class: 'dispute-resolved', text: 'Dispute Resolved', icon: '✅' };
            default: return { class: 'dispute-default', text: 'Dispute', icon: '⚠️' };
        }
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSimple = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDuration = (start, end) => {
        if (!start || !end) return 'N/A';
        const diffHours = Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60);
        if (diffHours < 24) return `${Math.round(diffHours)}h`;
        const days = Math.floor(diffHours / 24);
        const hours = Math.round(diffHours % 24);
        return hours === 0 ? `${days}d` : `${days}d ${hours}h`;
    };

    const getFilteredBookings = () => {
        if (filter === 'all') return bookings;
        if (filter === 'disputed') return bookings.filter(b => b.dispute && b.dispute.status !== 'resolved');
        return bookings.filter(b => b.status === filter);
    };

    const canCancel = (booking) => {
        if (!booking) return false;
        const hasActiveDispute = booking.dispute && booking.dispute.status === 'pending';
        return booking?.status === 'confirmed' &&
            !hasActiveDispute &&
            new Date(booking.start_time) > new Date();
    };

    const canDispute = (booking) => {
        if (!booking) return false;
        const hasActiveDispute = booking.dispute && booking.dispute.status === 'pending';
        return booking?.status === 'confirmed' && !hasActiveDispute;
    };

    const canBookAgain = (booking) => booking.status === 'cancelled' || booking.status === 'completed';
    const hasActiveBookings = () => bookings.some(b => b.status === 'confirmed' && new Date(b.start_time) > new Date());

    useEffect(() => { fetchBookings(); }, []);

    const filteredBookings = getFilteredBookings();

    return (
        <>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <div className="mybookings-wrapper">
                <div className="mybookings-container">
                    {/* Header */}
                    <div className="bookings-header">
                        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
                        <h1 className="page-title">My Bookings</h1>
                        <div className="header-spacer"></div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">📊</div>
                            <div className="stat-content"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Bookings</span></div>
                        </div>
                        <div className="stat-card confirmed">
                            <div className="stat-icon">✓</div>
                            <div className="stat-content"><span className="stat-value">{stats.confirmed}</span><span className="stat-label">Confirmed</span></div>
                        </div>
                        <div className="stat-card cancelled">
                            <div className="stat-icon">✗</div>
                            <div className="stat-content"><span className="stat-value">{stats.cancelled}</span><span className="stat-label">Cancelled</span></div>
                        </div>
                        <div className="stat-card completed">
                            <div className="stat-icon">✔</div>
                            <div className="stat-content"><span className="stat-value">{stats.completed}</span><span className="stat-label">Completed</span></div>
                        </div>
                        {stats.disputed > 0 && (
                            <div className="stat-card disputed">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-content"><span className="stat-value">{stats.disputed}</span><span className="stat-label">Disputed</span></div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {bookings.length > 0 && (
                            <button className="delete-all-btn" onClick={() => setShowDeleteAllModal(true)}>
                                Delete All Bookings
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        {['all', 'confirmed', 'disputed', 'cancelled', 'completed'].map((f) => (
                            <button
                                key={f}
                                className={`filter-tab ${filter === f ? 'active' : ''} ${f === 'disputed' && stats.disputed > 0 ? 'has-disputes' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? stats.total : stats[f] ?? 0})
                            </button>
                        ))}
                    </div>

                    {/* Bookings List */}
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h3>No bookings found</h3>
                            <p>You haven't made any bookings yet.</p>
                            <button className="browse-button" onClick={() => navigate('/')}>🏠 Browse Spaces</button>
                        </div>
                    ) : (
                        <div className="bookings-list">
                            {filteredBookings.map((booking) => {
                                const statusInfo = getStatusInfo(booking.status);
                                const disputeInfo = booking.dispute ? getDisputeStatusInfo(booking.dispute) : null;
                                const unitImage = extractImageUrl(booking.unit?.images);
                                const isDisputePending = booking.dispute && booking.dispute.status === 'pending';
                                const isDisputeResolved = booking.dispute && booking.dispute.status === 'resolved';

                                return (
                                    <div
                                        key={booking.id}
                                        className={`booking-item ${booking.dispute ? 'has-dispute' : ''}`}
                                        onClick={() => handleBookAgain(booking)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="booking-image">
                                            <img src={unitImage} alt={booking.unit?.name || 'Space'} onError={(e) => { e.target.src = getFallbackImage(); }} />
                                            <span className="booking-duration">{getDuration(booking.start_time, booking.end_time)}</span>
                                            {canBookAgain(booking) && (
                                                <div className="book-again-overlay"><span>Click to book again 🔄</span></div>
                                            )}
                                            {/* ✅ FIX: Only show if dispute has a status */}
                                            {booking.dispute?.status && (
                                                <div className={`dispute-badge ${booking.dispute.status}`}>
                                                    ⚠️ {booking.dispute.status.charAt(0).toUpperCase() + booking.dispute.status.slice(1)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="booking-content">
                                            <div className="booking-main">
                                                <div className="booking-info-header">
                                                    <h3 className="booking-name">
                                                        {booking.unit?.name || booking.unit?.unit_type?.replace('_', ' ')}
                                                    </h3>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <span className={`status-badge ${statusInfo.class}`}>
                                                            {statusInfo.icon} {statusInfo.text}
                                                        </span>
                                                        {/* ✅ FIX: Only show if dispute has a status */}
                                                        {booking.dispute?.status && disputeInfo && (
                                                            <span className={`dispute-badge-small ${booking.dispute.status}`}>
                                                                {disputeInfo.icon} {disputeInfo.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="booking-details-grid">
                                                    <div className="detail-item"><span>📍</span><span>{booking.space?.name}, {booking.space?.city}</span></div>
                                                    <div className="detail-item"><span>#</span><span>{booking.booking_ref}</span></div>
                                                    <div className="detail-item"><span>📅</span><span>{formatDateSimple(booking.start_time)} - {formatDateSimple(booking.end_time)}</span></div>
                                                    <div className="detail-item"><span>💰</span><span className="price">PKR {parseFloat(booking.total_price).toLocaleString()}</span></div>
                                                </div>
                                                {/* ✅ FIX: Only show if dispute has a status */}
                                                {booking.dispute?.status && (
                                                    <div className="dispute-info">
                                                        <span className="dispute-reason">📝 {booking.dispute.reason || 'No reason provided'}</span>
                                                        {booking.dispute.status === 'pending' && (
                                                            <span className="dispute-pending-text">⏳ Awaiting admin review...</span>
                                                        )}
                                                        {booking.dispute.status === 'resolved' && booking.dispute.resolution && (
                                                            <span className="dispute-resolution">✅ Resolution: {booking.dispute.resolution}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="booking-actions">
                                                <button className="btn-view" onClick={(e) => handleViewDetails(booking, e)}>
                                                    👁️ Details
                                                </button>

                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <ChatButton bookingId={booking.id} label="Message Owner" variant="outline" />
                                                </div>

                                                {canCancel(booking) && (
                                                    <button className="btn-cancel" onClick={(e) => handleCancelClick(booking, e)}>
                                                        🗑️ Cancel
                                                    </button>
                                                )}

                                                {canDispute(booking) && (
                                                    <button
                                                        className="btn-dispute"
                                                        onClick={(e) => handleDisputeClick(booking, e)}
                                                    >
                                                        ⚠️ Raise Dispute
                                                    </button>
                                                )}

                                                {isDisputePending && (
                                                    <button
                                                        className="btn-dispute-pending"
                                                        onClick={(e) => handleViewDetails(booking, e)}
                                                    >
                                                        👁️ View Dispute
                                                    </button>
                                                )}

                                                {isDisputeResolved && (
                                                    <button
                                                        className="btn-dispute-resolved"
                                                        onClick={(e) => handleViewDetails(booking, e)}
                                                    >
                                                        ✅ View Resolution
                                                    </button>
                                                )}

                                                {canBookAgain(booking) && (
                                                    <button className="btn-book-again" onClick={(e) => { e.stopPropagation(); handleBookAgain(booking); }}>
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

                    {/* Delete All Modal */}
                    {showDeleteAllModal && (
                        <div className="modal-overlay" onClick={() => setShowDeleteAllModal(false)}>
                            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>Delete All Bookings</h3>
                                    <button className="modal-close" onClick={() => setShowDeleteAllModal(false)}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                                        {/* ⚠️ <strong>Warning!</strong> This action cannot be undone. */}
                                    </div>
                                    <p>Are you sure you want to delete <strong>all {bookings.length} booking(s)</strong>?</p>
                                    {hasActiveBookings() && (
                                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
                                            <p style={{ margin: 0, color: '#d97706' }}>⚠️ You have <strong>{stats.confirmed}</strong> active/upcoming booking(s).</p>
                                            <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)} style={{ marginRight: '8px' }} />
                                                <span>Automatically cancel and delete active bookings</span>
                                            </label>
                                        </div>
                                    )}
                                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        <strong>Summary:</strong>
                                        <div style={{ marginTop: '8px' }}>
                                            <div>• Total: <strong>{stats.total}</strong></div>
                                            <div>• Confirmed: <strong>{stats.confirmed}</strong></div>
                                            <div>• Disputed: <strong>{stats.disputed}</strong></div>
                                            <div>• Cancelled: <strong>{stats.cancelled}</strong></div>
                                            <div>• Completed: <strong>{stats.completed}</strong></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => { setShowDeleteAllModal(false); setForceDelete(false); }}>Cancel</button>
                                    <button className="btn-danger" onClick={deleteAllBookings} disabled={deleteAllLoading} style={{ backgroundColor: '#dc2626' }}>
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
                                        <div className="summary-row"><span>Space:</span><strong>{selectedBooking.unit?.name}</strong></div>
                                        <div className="summary-row"><span>Date:</span><strong>{formatDate(selectedBooking.start_time)}</strong></div>
                                        <div className="summary-row"><span>Total:</span><strong>PKR {parseFloat(selectedBooking.total_price).toLocaleString()}</strong></div>
                                    </div>
                                    {/* <div className="warning-message">⚠️ This action cannot be undone.</div> */}
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => setShowCancelModal(false)}>Keep Booking</button>
                                    <button className="btn-danger" onClick={() => cancelBooking(selectedBooking.id)} disabled={cancellingId === selectedBooking.id}>
                                        {cancellingId === selectedBooking.id ? 'Cancelling...' : 'Yes, Cancel'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Modal */}
                    {selectedBooking && !showCancelModal && !showDeleteAllModal && !showDisputeModal && (
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

                                    {/* Dispute Section in Details */}
                                    {selectedBooking.dispute?.status && (
                                        <div className="details-section dispute-details">
                                            <h4>⚠️ Dispute Information</h4>
                                            <div className="details-grid">
                                                <div><strong>Status:</strong> {selectedBooking.dispute.status.charAt(0).toUpperCase() + selectedBooking.dispute.status.slice(1)}</div>
                                                <div><strong>Reason:</strong> {selectedBooking.dispute.reason}</div>
                                                <div><strong>Description:</strong> {selectedBooking.dispute.description || 'No additional details provided'}</div>
                                                {selectedBooking.dispute.resolution && (
                                                    <div><strong>Resolution:</strong> {selectedBooking.dispute.resolution}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ChatButton bookingId={selectedBooking.id} label=" Message Owner" variant="primary" />
                                    </div>

                                    {canDispute(selectedBooking) && (
                                        <button
                                            className="btn-danger"
                                            style={{ backgroundColor: '#dc2626' }}
                                            onClick={() => { setShowDisputeModal(true); }}
                                        >
                                            ⚠️ Raise Dispute
                                        </button>
                                    )}

                                    {selectedBooking.dispute?.status === 'pending' && (
                                        <button
                                            className="btn-dispute-pending"
                                            disabled
                                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                        >
                                            ⏳ Dispute Pending
                                        </button>
                                    )}

                                    {canBookAgain(selectedBooking) && (
                                        <button className="btn-book-again-modal" onClick={() => { setSelectedBooking(null); handleBookAgain(selectedBooking); }}>
                                            🔄 Book This Space Again
                                        </button>
                                    )}
                                    <button className="btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dispute Modal */}
            <DisputeModal
                isOpen={showDisputeModal}
                onClose={() => {
                    setShowDisputeModal(false);
                }}
                onConfirm={handleCreateDispute}
                existingDispute={selectedBooking?.dispute}
            />
        </>
    );
};

export default MyBookings;