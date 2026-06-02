import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    User,
    MapPin,
    X
} from 'lucide-react';
import '../../../src/componentstyles/sellerdashboardstyles/SellerCalendar.css';
import BaseUrl from '../../utils/AppConstants';

const SellerCalendar = () => {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Get auth config
    const getAuthConfig = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
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

            const response = await axios.get(
                `${BaseUrl}api/bookings/owner/requests`,
                getAuthConfig()
            );

            if (response.data.success) {
                setBookings(response.data.bookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // ✅ UPDATED: Get bookings for a specific date (checks if date falls within booking range)
    const getBookingsForDate = (date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        return bookings.filter(booking => {
            const startDate = new Date(booking.start_time);
            const endDate = new Date(booking.end_time);

            // Set both to start of day for comparison
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            // Check if the date falls within the booking range (inclusive)
            return checkDate >= startDate && checkDate <= endDate;
        });
    };

    // ✅ NEW: Get all unique dates that have bookings for the current month
    const getBookedDatesMap = () => {
        const bookedDatesMap = new Map();

        bookings.forEach(booking => {
            const startDate = new Date(booking.start_time);
            const endDate = new Date(booking.end_time);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            // Loop through each date in the booking range
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateKey = d.toISOString().split('T')[0];
                if (!bookedDatesMap.has(dateKey)) {
                    bookedDatesMap.set(dateKey, []);
                }
                bookedDatesMap.get(dateKey).push(booking);
            }
        });

        return bookedDatesMap;
    };

    // Get booking status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'confirmed': return '#22c55e';
            case 'rejected': return '#ef4444';
            case 'cancelled_by_owner': return '#6b7280';
            default: return '#3b82f6';
        }
    };

    // Get booking status text
    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'rejected': return 'Rejected';
            case 'cancelled_by_owner': return 'Cancelled';
            default: return status;
        }
    };

    // Handle date click
    const handleDateClick = (date) => {
        const bookingsForDate = getBookingsForDate(date);
        if (bookingsForDate.length > 0) {
            setSelectedDate(date);
            setSelectedBookings(bookingsForDate);
            setShowModal(true);
        }
    };

    // Calendar navigation
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get month name
    const getMonthName = (date) => {
        return date.toLocaleString('default', { month: 'long' });
    };

    const getYear = (date) => {
        return date.getFullYear();
    };

    // Get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Check if date is today
    const isToday = (date) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Check if date is in the past
    const isPastDate = (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format date range for display
    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    };

    if (loading) {
        return (
            <div className="seller-calendar-loading">
                <div className="seller-calendar-spinner"></div>
                <p>Loading calendar...</p>
            </div>
        );
    }

    return (
        <div className="seller-calendar-container">
            {/* Header */}
            <div className="seller-calendar-header">
                <div className="seller-calendar-title-section">
                    <CalendarIcon size={28} />
                    <h1>Bookings Calendar</h1>
                </div>
                <div className="seller-calendar-nav">
                    <button onClick={goToPreviousMonth} className="seller-calendar-nav-btn">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={goToToday} className="seller-calendar-today-btn">
                        Today
                    </button>
                    <button onClick={goToNextMonth} className="seller-calendar-nav-btn">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Month and Year */}
            <div className="seller-calendar-month-year">
                <h2>{getMonthName(currentDate)} {getYear(currentDate)}</h2>
            </div>

            {/* Legend */}
            <div className="seller-calendar-legend">
                <div className="seller-calendar-legend-item">
                    <span className="seller-calendar-legend-color pending"></span>
                    <span>Pending</span>
                </div>
                <div className="seller-calendar-legend-item">
                    <span className="seller-calendar-legend-color confirmed"></span>
                    <span>Confirmed</span>
                </div>
                <div className="seller-calendar-legend-item">
                    <span className="seller-calendar-legend-color rejected"></span>
                    <span>Rejected</span>
                </div>
                <div className="seller-calendar-legend-item">
                    <span className="seller-calendar-legend-color cancelled"></span>
                    <span>Cancelled</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="seller-calendar-grid">
                {/* Weekday headers */}
                {weekDays.map(day => (
                    <div key={day} className="seller-calendar-weekday">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((date, index) => {
                    if (!date) {
                        return <div key={`empty-${index}`} className="seller-calendar-day empty"></div>;
                    }

                    const bookingsForDate = getBookingsForDate(date);
                    const hasBookings = bookingsForDate.length > 0;
                    const isCurrentDate = isToday(date);
                    const isPast = isPastDate(date);

                    // Count bookings by status
                    const pendingCount = bookingsForDate.filter(b => b.status === 'pending').length;
                    const confirmedCount = bookingsForDate.filter(b => b.status === 'confirmed').length;
                    const rejectedCount = bookingsForDate.filter(b => b.status === 'rejected').length;
                    const cancelledCount = bookingsForDate.filter(b => b.status === 'cancelled_by_owner').length;

                    return (
                        <div
                            key={date.toISOString()}
                            className={`seller-calendar-day ${hasBookings ? 'has-bookings' : ''} ${isCurrentDate ? 'today' : ''} ${isPast ? 'past' : ''}`}
                            onClick={() => handleDateClick(date)}
                        >
                            <div className="seller-calendar-day-number">{date.getDate()}</div>

                            {/* Booking indicators */}
                            {hasBookings && (
                                <div className="seller-calendar-booking-indicators">
                                    {pendingCount > 0 && (
                                        <div className="seller-calendar-booking-indicator pending" title={`${pendingCount} pending`}>
                                            {pendingCount}
                                        </div>
                                    )}
                                    {confirmedCount > 0 && (
                                        <div className="seller-calendar-booking-indicator confirmed" title={`${confirmedCount} confirmed`}>
                                            {confirmedCount}
                                        </div>
                                    )}
                                    {rejectedCount > 0 && (
                                        <div className="seller-calendar-booking-indicator rejected" title={`${rejectedCount} rejected`}>
                                            {rejectedCount}
                                        </div>
                                    )}
                                    {cancelledCount > 0 && (
                                        <div className="seller-calendar-booking-indicator cancelled" title={`${cancelledCount} cancelled`}>
                                            {cancelledCount}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Booking Details Modal */}
            {showModal && (
                <div className="seller-calendar-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="seller-calendar-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="seller-calendar-modal-header">
                            <h3>
                                {selectedDate?.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h3>
                            <button className="seller-calendar-modal-close" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="seller-calendar-modal-body">
                            {selectedBookings.length === 0 ? (
                                <p className="seller-calendar-no-bookings">No bookings on this date</p>
                            ) : (
                                <div className="seller-calendar-bookings-list">
                                    {selectedBookings.map((booking) => (
                                        <div key={booking.id} className="seller-calendar-booking-item">
                                            <div className="seller-calendar-booking-header">
                                                <span
                                                    className="seller-calendar-booking-status-badge"
                                                    style={{ backgroundColor: getStatusColor(booking.status) }}
                                                >
                                                    {getStatusText(booking.status)}
                                                </span>
                                                <span className="seller-calendar-booking-ref">{booking.booking_ref}</span>
                                            </div>

                                            <div className="seller-calendar-booking-dates">
                                                <strong>📅 Booking Period:</strong> {formatDateRange(booking.start_time, booking.end_time)}
                                            </div>

                                            <div className="seller-calendar-booking-details">
                                                <div className="seller-calendar-booking-detail-row">
                                                    <Clock size={14} />
                                                    <span>
                                                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                    </span>
                                                </div>
                                                <div className="seller-calendar-booking-detail-row">
                                                    <User size={14} />
                                                    <span>{booking.buyer.full_name}</span>
                                                </div>
                                                <div className="seller-calendar-booking-detail-row">
                                                    <MapPin size={14} />
                                                    <span>{booking.unit.name} ({booking.space.name})</span>
                                                </div>
                                            </div>

                                            <div className="seller-calendar-booking-price">
                                                Total: PKR {parseFloat(booking.total_price).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="seller-calendar-modal-footer">
                            <button className="seller-calendar-modal-close-btn" onClick={() => setShowModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerCalendar;