import React, { useState, useEffect, useRef } from 'react';
import '../componentstyles/utilstyle/DateTimePicker.css';

const DateTimePicker = ({
    value,
    onChange,
    placeholder,
    label,
    type = 'start',
    startDate = null,
    rateType = 'daily',
    onWarning = null,
    bookedSlots = [],        // array of {start, end} ISO strings
    bookedDates = [],        // kept for daily/monthly (fully blocked days)
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [selectedTime, setSelectedTime] = useState(value ? new Date(value) : null);
    const [timeString, setTimeString] = useState(value ? formatTime(new Date(value)) : '');
    const pickerRef = useRef(null);

    function formatTime(date) {
        if (!date) return '';
        return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    }

    const formatDisplayDate = () => {
        if (!value) return '';
        return new Date(value).toLocaleString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short',
            day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const dayKey = (d) => {
        const dt = d instanceof Date ? d : new Date(d);
        if (isNaN(dt)) return null;
        return Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const isSameDay = (a, b) => {
        const ka = dayKey(a), kb = dayKey(b);
        return ka !== null && kb !== null && ka === kb;
    };

    const toDateStr = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    };

    // For daily/monthly: is this entire day blocked?
    const isDayFullyBlocked = (date) => {
        const str = toDateStr(date);
        return bookedDates.includes(str);
    };

    // For hourly: get all booked slots that overlap with the given date
    const getSlotsForDate = (date) => {
        if (!date) return [];
        return bookedSlots.filter(slot => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            return isSameDay(slotStart, date) || isSameDay(slotEnd, date) ||
                   (slotStart < date && slotEnd > new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59));
        });
    };

    // Check if a specific hour on a date is already booked
    const isHourBooked = (date, hour) => {
        if (!date) return false;
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(date);
        slotEnd.setHours(hour, 59, 59, 999);
        return bookedSlots.some(slot => {
            const bStart = new Date(slot.start);
            const bEnd = new Date(slot.end);
            return bStart < slotEnd && bEnd > slotStart;
        });
    };

    // Check if a proposed time range overlaps any existing booking
    const doesTimeOverlapBookings = (startDt, endDt) => {
        return bookedSlots.some(slot => {
            const bStart = new Date(slot.start);
            const bEnd = new Date(slot.end);
            return bStart < endDt && bEnd > startDt;
        });
    };

    useEffect(() => {
        const h = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

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

    useEffect(() => {
        if (!isOpen) return;
        if (type === 'end' && startDate) {
            const sd = new Date(startDate);
            if (!isNaN(sd)) setCurrentMonth(sd);
        } else {
            setCurrentMonth(new Date());
        }
    }, [isOpen]);

    const isDateDisabled = (date) => {
        if (!date) return true;
        const dk = dayKey(date);
        const todayKey = dayKey(new Date());
        if (dk < todayKey) return true;

        if (rateType === 'hourly') {
            // For hourly: only disable if ALL hours of the day are booked
            // (a partial day should still be selectable)
            const allHoursBooked = Array.from({length: 24}, (_, h) => h)
                .every(h => isHourBooked(date, h));
            return allHoursBooked;
        }

        // For daily/monthly: disable fully blocked days
        if (isDayFullyBlocked(date)) return true;

        // For end date: must be after start
        if (type === 'end' && startDate) {
            const startDayKey = dayKey(startDate);
            if (rateType === 'daily' || rateType === 'monthly') {
                if (dk <= startDayKey) return true;
            }
            // For hourly, same day is allowed (different time)
        }

        return false;
    };

    const handleDateSelect = (date) => {
        if (!date || isDateDisabled(date)) {
            if (onWarning) onWarning('This date is unavailable. Please select another date.');
            return;
        }
        setSelectedDate(date);

        // Build a datetime with existing or default time
        const newDateTime = new Date(date);
        const baseTime = selectedTime || new Date();

        if (rateType === 'hourly') {
            // For hourly, keep the selected time or default to opening hour
            if (type === 'start') {
                newDateTime.setHours(baseTime.getHours() || 9, 0, 0, 0);
            } else {
                // End: default to start time + 1 hour
                if (startDate) {
                    const startDt = new Date(startDate);
                    if (isSameDay(date, startDt)) {
                        // Same day — default end = start + 1 hour
                        newDateTime.setHours(startDt.getHours() + 1, startDt.getMinutes(), 0, 0);
                    } else {
                        newDateTime.setHours(10, 0, 0, 0);
                    }
                }
            }
        } else {
            if (selectedTime) {
                newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            } else {
                newDateTime.setHours(type === 'start' ? 9 : 10, 0, 0, 0);
            }
        }

        setSelectedTime(newDateTime);
        setTimeString(formatTime(newDateTime));
        onChange({ target: { value: newDateTime.toISOString() } });
    };

    const handleTimeChange = (e) => {
        if (!e.target.value) return;
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const baseDate = selectedDate || (value ? new Date(value) : null);
        if (!baseDate) return;

        const newDateTime = new Date(baseDate);
        newDateTime.setHours(hours, minutes, 0, 0);

        // Validate: end must be after start
        if (type === 'end' && startDate) {
            const startDt = new Date(startDate);
            if (newDateTime <= startDt) {
                if (onWarning) onWarning('End time must be after start time.');
                return;
            }
            // Validate minimum 1 hour for hourly
            if (rateType === 'hourly') {
                const diffHours = (newDateTime - startDt) / (1000 * 60 * 60);
                if (diffHours < 1) {
                    if (onWarning) onWarning('Minimum booking duration is 1 hour.');
                    return;
                }
            }
        }

        // Check if the proposed time overlaps any existing booking
        if (rateType === 'hourly' && startDate && type === 'end') {
            const startDt = new Date(startDate);
            if (doesTimeOverlapBookings(startDt, newDateTime)) {
                if (onWarning) onWarning('This time range overlaps an existing booking. Please select a different time.');
                return;
            }
        }
        if (rateType === 'hourly' && type === 'start' && value) {
            const endDt = new Date(value);
            const proposedStart = newDateTime;
            if (doesTimeOverlapBookings(proposedStart, endDt)) {
                if (onWarning) onWarning('This start time overlaps an existing booking.');
                return;
            }
        }

        setTimeString(e.target.value);
        setSelectedTime(newDateTime);
        onChange({ target: { value: newDateTime.toISOString() } });
    };

    const changeMonth = (inc) =>
        setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() + inc, 1));

    const getMinTime = () => {
        if (type === 'end' && startDate) {
            if (isSameDay(selectedDate, new Date(startDate))) {
                const minT = new Date(new Date(startDate).getTime() + 60 * 60 * 1000);
                return formatTime(minT);
            }
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

    // Render the booked hours timeline for the selected date (hourly mode only)
    const renderHourlyTimeline = () => {
        if (rateType !== 'hourly' || !selectedDate) return null;
        const slotsToday = getSlotsForDate(selectedDate);
        if (slotsToday.length === 0) return (
            <div style={{ fontSize: '12px', color: 'var(--text-success, #2e7d32)', margin: '8px 0', padding: '6px 10px', background: 'var(--bg-success, #e8f5e9)', borderRadius: '6px' }}>
                ✓ All hours available on this date
            </div>
        );

        return (
            <div style={{ margin: '8px 0' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Booked hours on {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {Array.from({ length: 24 }, (_, h) => {
                        const booked = isHourBooked(selectedDate, h);
                        return (
                            <span key={h} style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                background: booked ? 'var(--bg-danger, #ffebee)' : 'var(--surface-1, #f5f5f5)',
                                color: booked ? 'var(--text-danger, #c62828)' : 'var(--text-secondary)',
                                border: `1px solid ${booked ? 'var(--border-danger, #ef9a9a)' : 'var(--border, #ddd)'}`,
                                fontFamily: 'monospace',
                            }}>
                                {String(h).padStart(2,'0')}
                            </span>
                        );
                    })}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Red = booked · Select your time below to avoid these hours
                </div>
            </div>
        );
    };

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = getDaysInMonth(currentMonth);

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
                                // For hourly: partially booked days get a dot indicator
                                const hasPartialBooking = rateType === 'hourly' &&
                                    getSlotsForDate(date).length > 0 && !isDisabled;

                                const classes = [
                                    'calendar-day',
                                    isSelected ? 'selected' : '',
                                    isDisabled ? 'disabled' : '',
                                    isToday ? 'today' : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <div key={i} className="calendar-day-cell">
                                        <button
                                            className={classes}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isDisabled}
                                            title={
                                                isDisabled ? 'Not available' :
                                                hasPartialBooking ? 'Partially booked — some hours taken' :
                                                'Available'
                                            }
                                            style={{ cursor: isDisabled ? 'not-allowed' : 'pointer', position: 'relative' }}
                                        >
                                            {date.getDate()}
                                            {hasPartialBooking && (
                                                <span style={{
                                                    position: 'absolute', bottom: '2px', left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    width: '4px', height: '4px', borderRadius: '50%',
                                                    background: '#f59e0b', display: 'block'
                                                }} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '12px', padding: '6px 4px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span>⬜ Available</span>
                        {rateType === 'hourly' && <span>🟡 Partially booked</span>}
                        <span>⬛ Unavailable</span>
                        <span style={{ background: '#01095A', color: '#fff', borderRadius: '3px', padding: '0 4px' }}>Selected</span>
                    </div>

                    {/* Hourly: show which hours on the selected date are taken */}
                    {renderHourlyTimeline()}

                    <div className="datetime-picker-time">
                        <label>
                            {rateType === 'hourly' ? 'Select time' : 'Select time'}
                            {type === 'end' && startDate && isSameDay(selectedDate, new Date(startDate)) && (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                    (min. 1 hour after start)
                                </span>
                            )}
                        </label>
                        <input
                            type="time"
                            className="time-input"
                            value={timeString}
                            onChange={handleTimeChange}
                            step="1800"
                            min={getMinTime()}
                        />
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