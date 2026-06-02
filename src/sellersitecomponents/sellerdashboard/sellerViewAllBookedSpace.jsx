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
    Trash2
} from 'lucide-react';
import '../../componentstyles/sellerdashboardstyles/SellerViewAllBookedSpace.css';
import { bookingService } from '../utils/booking.service';

// Cancel Modal Component
const CancelBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        setIsSubmitting(true);
        try {
            await onConfirm(reason);
            setReason('');
            onClose();
        } catch (error) {
            console.error('Cancel submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="cancel-modal-overlay" onClick={onClose}>
            <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-modal-header">
                    <h3>Cancel Booking</h3>
                    <button className="cancel-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
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
                                placeholder="Please explain why you need to cancel this booking (e.g., maintenance issue, double booking, etc.)..."
                                rows="4"
                                required
                            />
                        </label>

                        <div className="cancel-warning">
                            ⚠️ This action cannot be undone. The customer will be notified via email with your cancellation reason.
                        </div>
                    </div>

                    <div className="cancel-modal-footer">
                        <button type="button" className="cancel-btn-secondary" onClick={onClose}>
                            Close
                        </button>
                        <button type="submit" className="cancel-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Delete submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="cancel-modal-overlay" onClick={onClose}>
            <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="cancel-modal-header">
                    <h3>Delete Booking Permanently</h3>
                    <button className="cancel-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
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
                            ⚠️ <strong>Warning!</strong> This action cannot be undone. This booking will be permanently deleted from the system.
                        </div>
                    </div>

                    <div className="cancel-modal-footer">
                        <button type="button" className="cancel-btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="delete-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Yes, Delete Permanently'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function SellerViewAllBookedSpace() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // State for modals
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time helper
    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Fetch owner bookings
    const fetchBookings = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login first');
                navigate('/login');
                return;
            }

            const response = await bookingService.getOwnerBookings();

            if (response.success) {
                setBookings(response.bookings);
                setFilteredBookings(response.bookings);
                if (response.count > 0) {
                    toast.success(`Loaded ${response.count} bookings`);
                }
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

    // Confirm/Approve Booking Handler
    const handleConfirmBooking = async (bookingId) => {
        if (!window.confirm('✅ Approve this booking?\n\nThe customer will receive a confirmation email with all details.')) {
            return;
        }

        setActionLoading(bookingId);

        try {
            const response = await bookingService.confirmBooking(bookingId);

            if (response.success) {
                toast.success('✅ Booking confirmed! Email sent to customer.');
                fetchBookings();
            }
        } catch (error) {
            console.error('Confirm booking error:', error);
            toast.error(error.response?.data?.message || 'Failed to confirm booking');
        } finally {
            setActionLoading(null);
        }
    };

    // Reject Booking Handler
    const handleRejectBooking = async (bookingId) => {
        if (!window.confirm('❌ Reject this booking?\n\nThe customer will be notified about the rejection.')) {
            return;
        }

        setActionLoading(bookingId);

        try {
            const response = await bookingService.rejectBooking(bookingId);

            if (response.success) {
                toast.success('❌ Booking rejected successfully');
                fetchBookings();
            }
        } catch (error) {
            console.error('Reject booking error:', error);
            toast.error(error.response?.data?.message || 'Failed to reject booking');
        } finally {
            setActionLoading(null);
        }
    };

    // Owner Cancel Booking Handler
    const handleCancelBooking = async (reason) => {
        if (!selectedBooking) {
            toast.error('No booking selected');
            return;
        }

        console.log('Cancelling booking:', {
            id: selectedBooking.id,
            reason: reason,
            bookingRef: selectedBooking.booking_ref
        });

        setActionLoading(selectedBooking.id);

        try {
            const response = await bookingService.ownerCancelBooking(
                selectedBooking.id,
                reason
            );

            console.log('Cancel response:', response);

            if (response.success) {
                toast.success('❌ Booking cancelled successfully. Customer has been notified.');
                await fetchBookings();
                setShowCancelModal(false);
                setSelectedBooking(null);
            } else {
                throw new Error(response.message || 'Cancellation failed');
            }
        } catch (error) {
            console.error('Cancel booking error:', error);
            console.error('Error response details:', error.response?.data);

            const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel booking';
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    // ✅ Delete Booking Handler
    const handleDeleteBooking = async () => {
        if (!selectedBooking) {
            toast.error('No booking selected');
            return;
        }

        console.log('Deleting booking:', {
            id: selectedBooking.id,
            bookingRef: selectedBooking.booking_ref,
            status: selectedBooking.status
        });

        setActionLoading(selectedBooking.id);

        try {
            const response = await bookingService.deleteBooking(selectedBooking.id);

            console.log('Delete response:', response);

            if (response.success) {
                toast.success('🗑️ Booking deleted permanently');
                await fetchBookings();
                setShowDeleteModal(false);
                setSelectedBooking(null);
            } else {
                throw new Error(response.message || 'Deletion failed');
            }
        } catch (error) {
            console.error('Delete booking error:', error);
            console.error('Error response details:', error.response?.data);

            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete booking';
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    // Open cancel modal
    const openCancelModal = (booking) => {
        console.log('Opening cancel modal for booking:', booking);
        setSelectedBooking(booking);
        setShowCancelModal(true);
    };

    // Open delete modal
    const openDeleteModal = (booking) => {
        console.log('Opening delete modal for booking:', booking);
        setSelectedBooking(booking);
        setShowDeleteModal(true);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // Filter and search
    useEffect(() => {
        let filtered = bookings;

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(booking => booking.status === selectedStatus);
        }

        if (searchTerm) {
            filtered = filtered.filter(booking =>
                booking.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.unit?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.booking_ref?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredBookings(filtered);
    }, [selectedStatus, searchTerm, bookings]);

    // Get status badge style
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return { bg: 'badge-pending', text: 'Pending', icon: Clock };
            case 'confirmed':
                return { bg: 'badge-confirmed', text: 'Confirmed', icon: CheckCircle };
            case 'rejected':
                return { bg: 'badge-rejected', text: 'Rejected', icon: XCircle };
            case 'cancelled_by_owner':
                return { bg: 'badge-cancelled', text: 'Cancelled', icon: XCircle };
            default:
                return { bg: 'badge-pending', text: status, icon: Clock };
        }
    };

    // Check if booking can be deleted
    const canDelete = (status) => {
        return true;
        // return ['rejected', 'cancelled_by_owner', 'cancelled_by_user', 'completed', 'no_show'].includes(status);
    };

    // Calculate statistics
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        rejected: bookings.filter(b => b.status === 'rejected').length,
        cancelled: bookings.filter(b => b.status === 'cancelled_by_owner').length
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

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card stat-card-total">
                        <div>
                            <p className="stat-label">Total Bookings</p>
                            <p className="stat-value">{stats.total}</p>
                        </div>
                        <Calendar size={28} />
                    </div>

                    <div className="stat-card stat-card-pending">
                        <div>
                            <p className="stat-label">Pending</p>
                            <p className="stat-value">{stats.pending}</p>
                        </div>
                        <Clock size={28} />
                    </div>

                    <div className="stat-card stat-card-confirmed">
                        <div>
                            <p className="stat-label">Confirmed</p>
                            <p className="stat-value">{stats.confirmed}</p>
                        </div>
                        <CheckCircle size={28} />
                    </div>

                    <div className="stat-card stat-card-rejected">
                        <div>
                            <p className="stat-label">Rejected</p>
                            <p className="stat-value">{stats.rejected}</p>
                        </div>
                        <XCircle size={28} />
                    </div>

                    <div className="stat-card stat-card-cancelled">
                        <div>
                            <p className="stat-label">Cancelled</p>
                            <p className="stat-value">{stats.cancelled}</p>
                        </div>
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

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled_by_owner">Cancelled</option>
                    </select>

                    <button onClick={fetchBookings} className="refresh-button">
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                {/* Bookings List */}
                <div className="bookings-list">
                    {filteredBookings.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <h3>No bookings found</h3>
                            <p>
                                {searchTerm || selectedStatus !== 'all'
                                    ? "Try adjusting your filters"
                                    : "You don't have any bookings yet"}
                            </p>
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
                                                    <p className="info-subtext">
                                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="info-row">
                                                <User size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Customer</p>
                                                    <p className="info-text">{booking.buyer?.full_name || 'N/A'}</p>
                                                    <p className="info-subtext">{booking.buyer?.email || 'N/A'}</p>
                                                    {booking.buyer?.phone && (
                                                        <p className="info-subtext">{booking.buyer.phone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="info-column">
                                            <div className="info-row">
                                                <CreditCard size={16} className="info-icon" />
                                                <div>
                                                    <p className="info-label">Total Price</p>
                                                    <p className="price-text">
                                                        PKR {parseFloat(booking.total_price || 0).toLocaleString()}
                                                    </p>
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

                                    {/* Action Buttons - For pending bookings */}
                                    {isPending && !isPastBooking && (
                                        <div className="card-actions">
                                            <button
                                                onClick={() => handleConfirmBooking(booking.id)}
                                                disabled={isLoading}
                                                className="btn-approve"
                                            >
                                                {isLoading ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <>
                                                        <Check size={16} />
                                                        Approve Booking
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRejectBooking(booking.id)}
                                                disabled={isLoading}
                                                className="btn-reject"
                                            >
                                                {isLoading ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <>
                                                        <X size={16} />
                                                        Reject Booking
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Cancel Button - For confirmed bookings (future only) */}
                                    {isConfirmed && !isPastBooking && (
                                        <div className="card-actions">
                                            <button
                                                onClick={() => openCancelModal(booking)}
                                                disabled={isLoading}
                                                className="btn-cancel"
                                            >
                                                {isLoading ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <>
                                                        <X size={16} />
                                                        Cancel Booking
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* ✅ Delete Button - For cancelled/rejected/completed bookings */}
                                    {showDelete && (
                                        <div className="card-actions">
                                            <button
                                                onClick={() => openDeleteModal(booking)}
                                                disabled={isLoading}
                                                className="btn-delete"
                                            >
                                                {isLoading ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <>
                                                        <Trash2 size={16} />
                                                        Delete Permanently
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Footer */}
                                    {booking.booking_ref && (
                                        <div className="card-footer">
                                            <p className="ref-text">
                                                Booking Reference: <span className="ref-value">{booking.booking_ref}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Cancel Modal */}
            <CancelBookingModal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                }}
                onConfirm={handleCancelBooking}
                booking={selectedBooking}
            />

            {/* Delete Modal */}
            <DeleteBookingModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedBooking(null);
                }}
                onConfirm={handleDeleteBooking}
                booking={selectedBooking}
            />
        </div>
    );
}

export default SellerViewAllBookedSpace;