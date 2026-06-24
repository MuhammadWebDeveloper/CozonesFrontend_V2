import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    User,
    MapPin,
    CreditCard,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    Check,
    X,
    Trash2,
    AlertTriangle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import '../../componentstyles/sellerdashboardstyles/SellerViewAllBookedSpace.css';
import { bookingService } from '../utils/booking.service';

// ─── Cancel Modal ────────────────────────────────────────────────────────────
const CancelBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) { toast.error('Please provide a reason for cancellation'); return; }
        setIsSubmitting(true);
        try { await onConfirm(reason); setReason(''); onClose(); }
        catch (error) { console.error('Cancel submission error:', error); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="cancel-modal-overlay" onClick={onClose}>
            <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-modal-header">
                    <h3>Cancel Booking</h3>
                    <button className="cancel-modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="cancel-modal-body">
                        <p className="cancel-booking-info">
                            <strong>Customer:</strong> {booking?.buyer?.full_name}<br />
                            <strong>Unit:</strong> {booking?.unit?.name}<br />
                            <strong>Date:</strong> {booking?.start_time ? new Date(booking.start_time).toLocaleDateString() : 'N/A'}<br />
                            <strong>Amount:</strong> PKR {booking?.total_price ? parseFloat(booking.total_price).toLocaleString() : '0'}
                        </p>
                        <label className="cancel-label">
                            Reason for Cancellation *
                            <textarea
                                className="cancel-textarea"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please explain why you need to cancel this booking..."
                                rows="4"
                                required
                            />
                        </label>
                        <div className="cancel-warning">
                            ⚠️ This action cannot be undone. The customer will be notified via email.
                        </div>
                    </div>
                    <div className="cancel-modal-footer">
                        <button type="button" className="cancel-btn-secondary" onClick={onClose}>Close</button>
                        <button type="submit" className="cancel-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────
const DeleteBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try { await onConfirm(); onClose(); }
        catch (error) { console.error('Delete submission error:', error); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="cancel-modal-overlay" onClick={onClose}>
            <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-modal-header">
                    <h3>Delete Booking Permanently</h3>
                    <button className="cancel-modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="cancel-modal-body">
                        <p className="cancel-booking-info">
                            <strong>Customer:</strong> {booking?.buyer?.full_name}<br />
                            <strong>Unit:</strong> {booking?.unit?.name}<br />
                            <strong>Booking Ref:</strong> {booking?.booking_ref}<br />
                            <strong>Date:</strong> {booking?.start_time ? new Date(booking.start_time).toLocaleDateString() : 'N/A'}
                        </p>
                        <div className="delete-warning">
                            ⚠️ <strong>Warning!</strong> This action cannot be undone. This booking will be permanently deleted.
                        </div>
                    </div>
                    <div className="cancel-modal-footer">
                        <button type="button" className="cancel-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="delete-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Dispute Modal ────────────────────────────────────────────────────────────
const DisputeModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) { toast.error('Please provide a reason for the dispute'); return; }
        setIsSubmitting(true);
        try { await onConfirm(reason, description); setReason(''); setDescription(''); onClose(); }
        catch (error) { console.error('Dispute submission error:', error); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="cancel-modal-overlay" onClick={onClose}>
            <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-modal-header">
                    <h3>⚠️ Raise a Dispute</h3>
                    <button className="cancel-modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="cancel-modal-body">
                        <p className="cancel-booking-info">
                            <strong>Customer:</strong> {booking?.buyer?.full_name}<br />
                            <strong>Unit:</strong> {booking?.unit?.name}<br />
                            <strong>Booking Ref:</strong> {booking?.booking_ref}<br />
                            <strong>Amount:</strong> PKR {booking?.total_price ? parseFloat(booking.total_price).toLocaleString() : '0'}
                        </p>

                        <label className="cancel-label">
                            Reason *
                            <input
                                type="text"
                                className="cancel-textarea"
                                style={{ height: '42px', resize: 'none', padding: '10px 12px', display: 'block', width: '100%', boxSizing: 'border-box' }}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Payment not received, property damage..."
                                required
                            />
                        </label>

                        <label className="cancel-label" style={{ marginTop: '12px' }}>
                            Additional Details (optional)
                            <textarea
                                className="cancel-textarea"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue in more detail..."
                                rows="4"
                            />
                        </label>

                        <div className="cancel-warning" style={{ background: 'rgba(220,38,38,0.08)', borderLeft: '4px solid #dc2626', color: '#dc2626' }}>
                            ⚠️ Your dispute will be reviewed by admin. You will be notified via email once resolved.
                        </div>
                    </div>
                    <div className="cancel-modal-footer">
                        <button type="button" className="cancel-btn-secondary" onClick={onClose}>Close</button>
                        <button
                            type="submit"
                            className="cancel-btn-primary"
                            disabled={isSubmitting}
                            style={{ background: '#dc2626', borderColor: '#dc2626' }}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Dispute Display Component ─────────────────────────────────────────────
const DisputeDisplay = ({ disputes }) => {
    const [expanded, setExpanded] = useState(false);

    if (!disputes || disputes.length === 0) {
        return null;
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return '#f59e0b';
            case 'under_review': return '#3b82f6';
            case 'resolved': return '#22c55e';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'Open';
            case 'under_review': return 'Under Review';
            case 'resolved': return 'Resolved';
            case 'rejected': return 'Rejected';
            default: return status || 'Unknown';
        }
    };

    const displayDisputes = expanded ? disputes : disputes.slice(0, 1);
    const hasMore = disputes.length > 1;

    return (
        <div className="disputes-container" style={{
            margin: '12px 20px 0 20px',
            padding: '12px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={16} color="#dc2626" />
                <span style={{ fontWeight: '600', fontSize: '14px', color: '#991b1b' }}>
                    Disputes ({disputes.length})
                </span>
            </div>

            {displayDisputes.map((dispute, index) => (
                <div key={dispute.id || index} style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: index < displayDisputes.length - 1 ? '8px' : '0',
                    border: '1px solid #f3f4f6'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                                    {dispute.reason || 'No reason provided'}
                                </span>
                                <span style={{
                                    fontSize: '11px',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    background: getStatusColor(dispute.status) + '20',
                                    color: getStatusColor(dispute.status),
                                    fontWeight: '500',
                                    border: `1px solid ${getStatusColor(dispute.status)}30`
                                }}>
                                    {getStatusText(dispute.status)}
                                </span>
                            </div>
                            {dispute.description && (
                                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                                    {dispute.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
                                <span>Raised by: <strong style={{ color: '#374151' }}>
                                    {dispute.raised_by?.full_name || 'Unknown User'}
                                </strong></span>
                                <span>•</span>
                                <span>{dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : 'N/A'}</span>
                                {dispute.resolved_by && (
                                    <>
                                        <span>•</span>
                                        <span>Resolved by: <strong style={{ color: '#374151' }}>
                                            {dispute.resolved_by?.full_name || 'Unknown'}
                                        </strong></span>
                                    </>
                                )}
                            </div>
                            {dispute.resolution && (
                                <div style={{ marginTop: '6px', padding: '8px', background: '#f0fdf4', borderRadius: '4px', fontSize: '13px', color: '#166534' }}>
                                    <strong>Resolution:</strong> {dispute.resolution}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        padding: '4px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? 'Show Less' : `View ${disputes.length - 1} More`}
                </button>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
function SellerViewAllBookedSpace() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // const fetchBookings = async () => {
    //     try {
    //         setLoading(true);
    //         const token = localStorage.getItem('token');
    //         if (!token) { toast.error('Please login first'); navigate('/login'); return; }

    //         const response = await bookingService.getOwnerBookings();
    //         console.log('Full API Response:', response);

    //         if (response.success) {
    //             console.log('Total bookings:', response.bookings.length);

    //             // Check for bookings with disputes
    //             const bookingsWithDisputes = response.bookings.filter(b =>
    //                 b.disputes && Array.isArray(b.disputes) && b.disputes.length > 0
    //             );
    //             console.log('Bookings with disputes:', bookingsWithDisputes.length);

    //             if (bookingsWithDisputes.length > 0) {
    //                 console.log('First booking with dispute:', bookingsWithDisputes[0]);
    //                 console.log('Dispute data:', bookingsWithDisputes[0].disputes);
    //             }

    //             setBookings(response.bookings);
    //             setFilteredBookings(response.bookings);
    //             if (response.count > 0) toast.success(`Loaded ${response.count} bookings`);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching bookings:', error);
    //         if (error.response?.status === 401) {
    //             toast.error('Session expired. Please login again.');
    //             localStorage.removeItem('token');
    //             localStorage.removeItem('user');
    //             navigate('/login');
    //         } else {
    //             toast.error(error.response?.data?.message || 'Failed to load bookings');
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) { toast.error('Please login first'); navigate('/login'); return; }

            const response = await bookingService.getOwnerBookings();

            // 🔍 DEBUG: Log the complete response
            console.log('========== COMPLETE BACKEND RESPONSE ==========');
            console.log('Full Response:', JSON.stringify(response, null, 2));
            console.log('===============================================');

            // 🔍 DEBUG: Check if disputes exist in the response
            if (response.success && response.bookings) {
                console.log('📊 Total Bookings:', response.bookings.length);

                // Check each booking for disputes
                response.bookings.forEach((booking, index) => {
                    console.log(`\n📋 Booking ${index + 1}:`, {
                        id: booking.id,
                        status: booking.status,
                        hasDisputes: !!booking.disputes,
                        disputesType: typeof booking.disputes,
                        disputesLength: booking.disputes?.length || 0,
                        disputes: booking.disputes || 'No disputes'
                    });
                });

                // Find bookings with disputes
                const bookingsWithDisputes = response.bookings.filter(b =>
                    b.disputes && Array.isArray(b.disputes) && b.disputes.length > 0
                );

                console.log('\n⚠️ Bookings WITH Disputes:', bookingsWithDisputes.length);
                if (bookingsWithDisputes.length > 0) {
                    console.log('🔍 Sample dispute data:', JSON.stringify(bookingsWithDisputes[0].disputes, null, 2));
                } else {
                    console.log('❌ No bookings with disputes found in the response');
                    console.log('💡 Check if there are any disputes in the database');
                }
            }
            console.log('===============================================\n');

            if (response.success) {
                setBookings(response.bookings);
                setFilteredBookings(response.bookings);
                if (response.count > 0) toast.success(`Loaded ${response.count} bookings`);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to load bookings');
            }
        } finally {
            setLoading(false);
        }
    };
    const handleConfirmBooking = async (bookingId) => {
        if (!window.confirm('✅ Approve this booking?\n\nThe customer will receive a confirmation email.')) return;
        setActionLoading(bookingId);
        try {
            const response = await bookingService.confirmBooking(bookingId);
            if (response.success) { toast.success('✅ Booking confirmed! Email sent to customer.'); fetchBookings(); }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to confirm booking');
        } finally { setActionLoading(null); }
    };

    const handleRejectBooking = async (bookingId) => {
        if (!window.confirm('❌ Reject this booking?\n\nThe customer will be notified.')) return;
        setActionLoading(bookingId);
        try {
            const response = await bookingService.rejectBooking(bookingId);
            if (response.success) { toast.success('❌ Booking rejected successfully'); fetchBookings(); }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject booking');
        } finally { setActionLoading(null); }
    };

    const handleCancelBooking = async (reason) => {
        if (!selectedBooking) { toast.error('No booking selected'); return; }
        setActionLoading(selectedBooking.id);
        try {
            const response = await bookingService.ownerCancelBooking(selectedBooking.id, reason);
            if (response.success) {
                toast.success('❌ Booking cancelled. Customer has been notified.');
                await fetchBookings();
                setShowCancelModal(false);
                setSelectedBooking(null);
            } else { throw new Error(response.message || 'Cancellation failed'); }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to cancel booking');
        } finally { setActionLoading(null); }
    };

    const handleDeleteBooking = async () => {
        if (!selectedBooking) { toast.error('No booking selected'); return; }
        setActionLoading(selectedBooking.id);
        try {
            const response = await bookingService.deleteBooking(selectedBooking.id);
            if (response.success) {
                toast.success('🗑️ Booking deleted permanently');
                await fetchBookings();
                setShowDeleteModal(false);
                setSelectedBooking(null);
            } else { throw new Error(response.message || 'Deletion failed'); }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to delete booking');
        } finally { setActionLoading(null); }
    };

    const handleCreateDispute = async (reason, description) => {
        if (!selectedBooking) { toast.error('No booking selected'); return; }
        setActionLoading(selectedBooking.id);
        try {
            const response = await bookingService.createDispute(selectedBooking.id, reason, description);
            if (response.success) {
                toast.success('⚠️ Dispute submitted. Admin has been notified.');
                setShowDisputeModal(false);
                setSelectedBooking(null);
                await fetchBookings();
            } else { throw new Error(response.message || 'Dispute submission failed'); }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Failed to submit dispute');
        } finally { setActionLoading(null); }
    };

    const openCancelModal = (booking) => { setSelectedBooking(booking); setShowCancelModal(true); };
    const openDeleteModal = (booking) => { setSelectedBooking(booking); setShowDeleteModal(true); };
    const openDisputeModal = (booking) => { setSelectedBooking(booking); setShowDisputeModal(true); };

    useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
        let filtered = bookings;
        if (selectedStatus !== 'all') filtered = filtered.filter(b => b.status === selectedStatus);
        if (searchTerm) {
            filtered = filtered.filter(b =>
                b.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.unit?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.booking_ref?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredBookings(filtered);
    }, [selectedStatus, searchTerm, bookings]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return { bg: 'badge-pending', text: 'Pending', icon: Clock };
            case 'confirmed': return { bg: 'badge-confirmed', text: 'Confirmed', icon: CheckCircle };
            case 'rejected': return { bg: 'badge-rejected', text: 'Rejected', icon: XCircle };
            case 'cancelled_by_owner': return { bg: 'badge-cancelled', text: 'Cancelled', icon: XCircle };
            default: return { bg: 'badge-pending', text: status, icon: Clock };
        }
    };

    const canDelete = () => true;

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        rejected: bookings.filter(b => b.status === 'rejected').length,
        cancelled: bookings.filter(b => b.status === 'cancelled_by_owner').length,
    };

    if (loading) {
        return (
            <div className="seller-loading-container">
                <div className="seller-spinner"></div>
            </div>
        );
    }

    return (
        <div className="seller-bookings-wrapper">
            <div className="seller-bookings-container">
                {/* Header */}
                <div className="bookings-header">
                    <h1 className="bookings-title">My Booked Spaces</h1>
                    <p className="bookings-subtitle">View and manage all booking requests for your spaces</p>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card stat-card-total">
                        <div><p className="stat-label">Total Bookings</p><p className="stat-value">{stats.total}</p></div>
                        <Calendar size={28} />
                    </div>
                    <div className="stat-card stat-card-pending">
                        <div><p className="stat-label">Pending</p><p className="stat-value">{stats.pending}</p></div>
                        <Clock size={28} />
                    </div>
                    <div className="stat-card stat-card-confirmed">
                        <div><p className="stat-label">Confirmed</p><p className="stat-value">{stats.confirmed}</p></div>
                        <CheckCircle size={28} />
                    </div>
                    <div className="stat-card stat-card-rejected">
                        <div><p className="stat-label">Rejected</p><p className="stat-value">{stats.rejected}</p></div>
                        <XCircle size={28} />
                    </div>
                    <div className="stat-card stat-card-cancelled">
                        <div><p className="stat-label">Cancelled</p><p className="stat-value">{stats.cancelled}</p></div>
                        <XCircle size={28} />
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-container">
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by customer name, unit name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="status-select">
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled_by_owner">Cancelled</option>
                    </select>
                    <button onClick={fetchBookings} className="refresh-button">
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Bookings List */}
                <div className="bookings-list">
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <h3>No bookings found</h3>
                            <p>{searchTerm || selectedStatus !== 'all' ? 'Try adjusting your filters' : "You don't have any bookings yet"}</p>
                        </div>
                    ) : (
                        filteredBookings.map((booking) => {
                            const statusBadge = getStatusBadge(booking.status);
                            const StatusIcon = statusBadge.icon;
                            const isPending = booking.status === 'pending';
                            const isConfirmed = booking.status === 'confirmed';
                            const isPastBooking = new Date(booking.start_time) < new Date();
                            const isLoading = actionLoading === booking.id;
                            const showDelete = canDelete(booking.status);

                            // Check if booking has disputes - ensure disputes is an array and has items
                            const hasDisputes = booking.disputes &&
                                Array.isArray(booking.disputes) &&
                                booking.disputes.length > 0;

                            return (
                                <div key={booking.id} className="booking-card">
                                    {/* Card Header */}
                                    <div className="card-header">
                                        <div className="card-header-info">
                                            <h3 className="unit-name">{booking.unit?.name || 'Unknown Unit'}</h3>
                                            <p className="space-info">
                                                {booking.space?.name || 'Unknown Space'} • {booking.space?.area || 'N/A'}, {booking.space?.city || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="badge-container">
                                            <span className={`status-badge ${statusBadge.bg}`}>
                                                <StatusIcon size={12} />
                                                {statusBadge.text}
                                            </span>
                                            {hasDisputes && (
                                                <span className="status-badge" style={{
                                                    background: '#dc2626',
                                                    color: 'white',
                                                    marginLeft: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <AlertTriangle size={12} />
                                                    Dispute
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="card-body">
                                        <div className="info-column">
                                            <div className="info-row">
                                                <Calendar size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Date & Time</p>
                                                    <p className="info-text">{formatDate(booking.start_time)}</p>
                                                    <p className="info-subtext">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                                </div>
                                            </div>
                                            <div className="info-row">
                                                <User size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Customer</p>
                                                    <p className="info-text">{booking.buyer?.full_name || 'N/A'}</p>
                                                    <p className="info-subtext">{booking.buyer?.email || 'N/A'}</p>
                                                    {booking.buyer?.phone && <p className="info-subtext">{booking.buyer.phone}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="info-column">
                                            <div className="info-row">
                                                <CreditCard size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Total Price</p>
                                                    <p className="price-text">PKR {parseFloat(booking.total_price || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="info-row">
                                                <MapPin size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Location</p>
                                                    <p className="info-text">{booking.space?.address || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Show Disputes */}
                                    {hasDisputes && <DisputeDisplay disputes={booking.disputes} />}

                                    {/* Pending Actions */}
                                    {isPending && !isPastBooking && (
                                        <div className="card-actions">
                                            <button onClick={() => handleConfirmBooking(booking.id)} disabled={isLoading} className="btn-approve">
                                                {isLoading ? <div className="spinner-small"></div> : <><Check size={16} /> Approve Booking</>}
                                            </button>
                                            <button onClick={() => handleRejectBooking(booking.id)} disabled={isLoading} className="btn-reject">
                                                {isLoading ? <div className="spinner-small"></div> : <><X size={16} /> Reject Booking</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Confirmed Actions: Cancel + Dispute */}
                                    {isConfirmed && (
                                        <div className="card-actions">
                                            {!isPastBooking && (
                                                <button onClick={() => openCancelModal(booking)} disabled={isLoading} className="btn-cancel">
                                                    {isLoading ? <div className="spinner-small"></div> : <><X size={16} /> Cancel Booking</>}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openDisputeModal(booking)}
                                                disabled={isLoading}
                                                className="btn-cancel"
                                                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                                            >
                                                {isLoading ? <div className="spinner-small"></div> : <><AlertTriangle size={16} /> Raise Dispute</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Delete Button */}
                                    {showDelete && (
                                        <div className="card-actions">
                                            <button onClick={() => openDeleteModal(booking)} disabled={isLoading} className="btn-delete">
                                                {isLoading ? <div className="spinner-small"></div> : <><Trash2 size={16} /> Delete Permanently</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    {booking.booking_ref && (
                                        <div className="card-footer">
                                            <p className="ref-text">Booking Reference: <span className="ref-value">{booking.booking_ref}</span></p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modals */}
            <CancelBookingModal
                isOpen={showCancelModal}
                onClose={() => { setShowCancelModal(false); setSelectedBooking(null); }}
                onConfirm={handleCancelBooking}
                booking={selectedBooking}
            />
            <DeleteBookingModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setSelectedBooking(null); }}
                onConfirm={handleDeleteBooking}
                booking={selectedBooking}
            />
            <DisputeModal
                isOpen={showDisputeModal}
                onClose={() => { setShowDisputeModal(false); setSelectedBooking(null); }}
                onConfirm={handleCreateDispute}
                booking={selectedBooking}
            />
        </div>
    );
}

export default SellerViewAllBookedSpace;