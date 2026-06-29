// DateTimePicker.jsx - Updated with Booked Dates Support
import React, { useState, useEffect, useRef } from 'react';
import '../componentstyles/utilstyle/DateTimePicker.css';

const DateTimePicker = ({
    value,
    onChange,
    minDate,
    placeholder,
    label,
    type = 'start',
    startDate = null,
    rateType = 'daily',
    onWarning = null,
    isHourlyOnly = false,
    bookedDates = [],        // ✅ NEW: Array of booked date strings (YYYY-MM-DD)
    unitId = null            // ✅ NEW: For debugging
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [selectedTime, setSelectedTime] = useState(value ? new Date(value) : null);
    const [timeString, setTimeString] = useState('');
    const pickerRef = useRef(null);

    const showWarning = (msg) => {
        if (onWarning) onWarning(msg);
    };

    const formatDisplayDate = () => {
        if (!value) return '';
        if (isHourlyOnly) {
            return formatTime(new Date(value));
        }
        return new Date(value).toLocaleString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Timezone-safe day key
    const dayKey = (d) => {
        if (!d) return null;
        const dt = (d instanceof Date) ? d : new Date(d);
        if (isNaN(dt)) return null;
        // Use UTC to avoid timezone issues
        return Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const isSameDay = (a, b) => {
        const ka = dayKey(a), kb = dayKey(b);
        return ka !== null && kb !== null && ka === kb;
    };

    // ✅ NEW: Check if a date is booked
    const isDateBooked = (date) => {
        if (!date || !bookedDates || bookedDates.length === 0) {
            return false;
        }

        // Convert date to YYYY-MM-DD format
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const isBooked = bookedDates.includes(dateStr);

        // Debug logging (remove in production)
        if (isBooked) {
            console.log(`🔒 Date ${dateStr} is BOOKED`);
        }

        return isBooked;
    };

    // Close on outside click
    useEffect(() => {
        const h = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Sync internal state when value prop changes
    useEffect(() => {
        if (value) {
            const dateValue = new Date(value);
            setSelectedDate(dateValue);
            setSelectedTime(dateValue);
            setTimeString(formatTime(dateValue));
        } else {
            setSelectedDate(null);
            setSelectedTime(null);
            setTimeString('');
        }
    }, [value]);

    // When end picker opens, jump to startDate's month
    useEffect(() => {
        if (!isOpen) return;
        if (type === 'end' && startDate) {
            const sd = new Date(startDate);
            if (!isNaN(sd)) setCurrentMonth(sd);
        } else {
            setCurrentMonth(new Date());
        }
    }, [isOpen]);

    const formatTime = (date) => {
        if (!date) return '';
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // ============================================================
    // MODIFIED: isDateDisabled - Now checks booked dates
    // ============================================================
    const isDateDisabled = (date) => {
        if (!date) return true;
        const dk = dayKey(date);
        if (dk === null) return true;

        const todayKey = dayKey(new Date());

        // 1. Block past datesfetchBookingDates 
        if (dk < todayKey) {
            console.log('❌ Past date disabled:', date.toLocaleDateString());
            return true;
        }

        // 2. 🚀 CRITICAL: Check if date is BOOKED
        if (isDateBooked(date)) {
            console.log(`🔒 BOOKED date disabled: ${date.toLocaleDateString()}`);
            return true;
        }

        // 3. For end date, ensure it's after start date
        if (type === 'end' && startDate) {
            const startDayKey = dayKey(startDate);
            if (dk <= startDayKey) {
                console.log(`📅 End date must be after start date: ${date.toLocaleDateString()}`);
                return true;
            }
        }

        // 4. For hourly rate, enable all dates
        if (rateType === 'hourly') {
            console.log('✅ HOURLY - Date ENABLED:', date.toLocaleDateString());
            return false;
        }

        // 5. For daily/monthly, additional restrictions
        if (rateType === 'daily' || rateType === 'monthly') {
            // Only allow full day bookings - no time restrictions
            console.log('✅ DAILY/MONTHLY - Date ENABLED:', date.toLocaleDateString());
            return false;
        }

        return false;
    };

    // ============================================================
    // MODIFIED: handleDateSelect - With warning for booked dates
    // ============================================================
    const handleDateSelect = (date) => {
        console.log('📅 Date selected:', date.toLocaleDateString(), 'Rate:', rateType);

        if (!date || isDateDisabled(date)) {
            console.log('❌ Date selection blocked');
            if (isDateBooked(date)) {
                showWarning('📅 This date is already booked. Please select another date.');
            }
            return;
        }

        setSelectedDate(date);
        const newDateTime = new Date(date);

        if (type === 'end' && startDate && isSameDay(date, new Date(startDate))) {
            // Same-day booking: Set to start time + 1 hour
            const startDT = new Date(startDate);
            const defaultEnd = new Date(startDT.getTime() + 60 * 60 * 1000);
            newDateTime.setHours(defaultEnd.getHours(), defaultEnd.getMinutes(), 0, 0);
            setSelectedTime(newDateTime);
            setTimeString(formatTime(newDateTime));
            onChange({ target: { value: newDateTime.toISOString() } });
            console.log('✅ Same-day booking set:', newDateTime.toLocaleString());
        } else if (type === 'end' && startDate) {
            // Different day booking
            if (selectedTime) {
                newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            } else {
                newDateTime.setHours(10, 0, 0, 0);
                setSelectedTime(newDateTime);
                setTimeString(formatTime(newDateTime));
            }
            onChange({ target: { value: newDateTime.toISOString() } });
            console.log('✅ Different day booking set:', newDateTime.toLocaleString());
        } else {
            // Start picker
            if (selectedTime) {
                newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            } else {
                newDateTime.setHours(9, 0, 0, 0);
                setSelectedTime(newDateTime);
                setTimeString(formatTime(newDateTime));
            }
            onChange({ target: { value: newDateTime.toISOString() } });
        }
    };

    // ============================================================
    // handleTimeChange - Validate minimum 1 hour
    // ============================================================
    const handleTimeChange = (e) => {
        if (!e.target.value) return;

        const [hours, minutes] = e.target.value.split(':').map(Number);
        const baseDate = selectedDate || (value ? new Date(value) : null);

        if (!baseDate) return;

        const newDateTime = new Date(baseDate);
        newDateTime.setHours(hours, minutes, 0, 0);

        const isSameDayBooking = type === 'end' && startDate &&
            isSameDay(selectedDate, new Date(startDate));

        if (isSameDayBooking && rateType === 'hourly') {
            const startDT = new Date(startDate);
            const diffMs = newDateTime.getTime() - startDT.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours >= 1) {
                setTimeString(e.target.value);
                setSelectedTime(newDateTime);
                onChange({ target: { value: newDateTime.toISOString() } });
                console.log('✅ Time updated:', newDateTime.toLocaleString());
            } else {
                showWarning('End time must be at least 1 hour after start time');
                return;
            }
        } else {
            setTimeString(e.target.value);
            setSelectedTime(newDateTime);
            onChange({ target: { value: newDateTime.toISOString() } });
        }
    };

    const changeMonth = (inc) =>
        setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() + inc, 1));

    const getMinTime = () => {
        if (type === 'end' && startDate && selectedDate &&
            isSameDay(selectedDate, new Date(startDate)) && rateType === 'hourly') {
            const minT = new Date(new Date(startDate).getTime() + 60 * 60 * 1000);
            return formatTime(minT);
        }
        return undefined;
    };

    const getMaxTime = () => {
        if (rateType === 'hourly') {
            return '23:59';
        }
        return undefined;
    };

    const getDaysInMonth = (date) => {
        const y = date.getFullYear(), m = date.getMonth();
        const days = [];
        for (let i = 0; i < new Date(y, m, 1).getDay(); i++) days.push(null);
        for (let i = 1; i <= new Date(y, m + 1, 0).getDate(); i++) days.push(new Date(y, m, i));
        return days;
    };

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = getDaysInMonth(currentMonth);

    // ============================================================
    // HOUR-ONLY MODE
    // ============================================================
    if (isHourlyOnly) {
        return (
            <div className="datetime-picker" ref={pickerRef}>
                <label className="datetime-picker-label">{label}</label>
                <div className="datetime-picker-input-wrapper">
                    <input
                        type="text"
                        className="datetime-picker-input"
                        value={formatDisplayDate()}
                        placeholder={placeholder}
                        readOnly
                        onClick={() => setIsOpen(p => !p)}
                    />
                    <span className="datetime-picker-icon" onClick={() => setIsOpen(p => !p)}>🕐</span>
                </div>

                {isOpen && (
                    <div className="datetime-picker-dropdown" style={{ width: '300px', padding: '20px' }}>
                        <div className="datetime-picker-time">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                                {type === 'start' ? 'Select Start Time' : 'Select End Time'}
                            </label>
                            <input
                                type="time"
                                className="time-input"
                                value={timeString}
                                onChange={handleTimeChange}
                                step="1800"
                                min={getMinTime()}
                                max={getMaxTime()}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '16px',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    outline: 'none'
                                }}
                            />
                            {type === 'end' && startDate && (
                                <small style={{
                                    display: 'block',
                                    marginTop: '8px',
                                    color: '#01095A',
                                    fontSize: '12px'
                                }}>
                                    ⏰ Min. 1 hour after start time
                                </small>
                            )}
                        </div>
                        <div className="datetime-picker-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                            <button className="cancel-btn" onClick={() => setIsOpen(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={() => setIsOpen(false)}>Confirm</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ============================================================
    // FULL CALENDAR MODE (Daily/Monthly) - WITH BOOKED DATES SUPPORT
    // ============================================================

    // ✅ NEW: Render legend
    const renderLegend = () => {
        if (!bookedDates || bookedDates.length === 0) return null;

        return (
            <div style={{
                display: 'flex',
                gap: '16px',
                padding: '8px 4px',
                marginTop: '8px',
                borderTop: '1px solid #eee',
                fontSize: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: '#ffebee',
                        border: '1px solid #c62828'
                    }}></span>
                    <span>Booked (unavailable)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: 'white',
                        border: '1px solid #ddd'
                    }}></span>
                    <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: '#01095A'
                    }}></span>
                    <span>Selected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: '2px solid #01095A',
                        background: 'white'
                    }}></span>
                    <span>Today</span>
                </div>
            </div>
        );
    };

    return (
        <div className="datetime-picker" ref={pickerRef}>
            <label className="datetime-picker-label">{label}</label>
            <div className="datetime-picker-input-wrapper">
                <input
                    type="text"
                    className="datetime-picker-input"
                    value={formatDisplayDate()}
                    placeholder={placeholder}
                    readOnly
                    onClick={() => setIsOpen(p => !p)}
                />
                <span className="datetime-picker-icon" onClick={() => setIsOpen(p => !p)}>📅</span>
            </div>

            {isOpen && (
                <div className="datetime-picker-dropdown">
                    <div className="datetime-picker-header">
                        <button onClick={() => changeMonth(-1)} className="month-nav">←</button>
                        <span className="current-month">
                            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                        </span>
                        <button onClick={() => changeMonth(1)} className="month-nav">→</button>
                    </div>

                    <div className="datetime-picker-calendar">
                        <div className="calendar-weekdays">
                            {weekdays.map(d => <div key={d} className="weekday">{d}</div>)}
                        </div>
                        <div className="calendar-days">
                            {days.map((date, i) => {
                                if (!date) return <div key={i} className="calendar-day-cell" />;

                                const isDisabled = isDateDisabled(date);
                                const isSelected = selectedDate && isSameDay(date, selectedDate);
                                const isToday = dayKey(date) === dayKey(new Date());
                                const isBooked = isDateBooked(date);

                                // Log each date (only when debugging)
                                // console.log(`📅 ${date.toLocaleDateString()}: ${isBooked ? 'BOOKED' : 'AVAILABLE'}`);

                                const classes = [
                                    'calendar-day',
                                    isSelected ? 'selected' : '',
                                    isDisabled ? 'disabled' : '',
                                    isToday ? 'today' : '',
                                    isBooked ? 'booked' : '',  // ✅ NEW: Add booked class
                                ].filter(Boolean).join(' ');

                                return (
                                    <div key={i} className="calendar-day-cell">
                                        <button
                                            className={classes}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isDisabled}
                                            title={isBooked ? '📅 Booked - Not Available' : isDisabled ? 'Not Available' : 'Click to select'}
                                            style={{
                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                position: 'relative'
                                            }}
                                        >
                                            {date.getDate()}
                                            {isToday && <span style={{ fontSize: '8px', marginLeft: '2px' }}>•</span>}

                                            {/* ✅ NEW: Add a small indicator for booked dates */}
                                            {isBooked && (
                                                <span style={{
                                                    position: 'absolute',
                                                    bottom: '2px',
                                                    right: '2px',
                                                    fontSize: '8px',
                                                    opacity: 0.7
                                                }}>
                                                    🔒
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ✅ NEW: Render legend */}
                    {renderLegend()}

                    <div className="datetime-picker-time">
                        <label>Select Time</label>
                        <input
                            type="time"
                            className="time-input"
                            value={timeString}
                            onChange={handleTimeChange}
                            step="1800"
                            min={getMinTime()}
                            max={getMaxTime()}
                        />
                        {type === 'end' && startDate && selectedDate &&
                            isSameDay(selectedDate, new Date(startDate)) && (
                                <small className="time-hint">
                                    ⏰ Min. 1 hour after start time ({getMinTime() || 'N/A'})
                                </small>
                            )}
                    </div>

                    <div className="datetime-picker-actions">
                        <button className="cancel-btn" onClick={() => setIsOpen(false)}>Cancel</button>
                        <button className="confirm-btn" onClick={() => setIsOpen(false)}>Confirm</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;