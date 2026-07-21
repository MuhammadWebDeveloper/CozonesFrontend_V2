// MeetingRoomDateTimePicker.jsx - Fixed version
// Changes in this version:
// 1. Removed the old "isHourlyOnly" time-only branch that skipped the calendar.
//    Hourly bookings now use the same calendar UI as daily/monthly, so users
//    can pick BOTH a date and an hour (same day or a different day).
// 2. Time input step is 3600 (1 hour) for hourly rate bookings, and any
//    manually typed/pasted minute value is snapped down to :00 for hourly.
// 3. isDateDisabled no longer blocks the *same day* as the start date for
//    hourly bookings (it only blocks earlier days). Daily/monthly bookings
//    still require a strictly later day, since they're day-based.
// 4. handleTimeChange no longer silently no-ops when selectedDate is null
//    (this was the root cause of "the time doesn't select").

import React, { useState, useEffect, useRef } from 'react';
import '../componentstyles/utilstyle/DateTimePicker.css';
import { 
    Calendar, 
    Clock, 
    ChevronLeft, 
    ChevronRight, 
    Lock, 
    Check, 
    X,
    AlertCircle,
    CalendarDays,
    CheckCircle,
    XCircle
} from 'lucide-react';

const MeetingRoomDateTimePicker = ({
    value,
    onChange,
    minDate,
    placeholder,
    label,
    type = 'start',
    startDate = null,
    rateType = 'daily',
    onWarning = null,
    bookedDates = [],
    unitId = null
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const pickerRef = useRef(null);

    // Sync with value prop
    useEffect(() => {
        if (value) {
            const date = typeof value === 'string' ? new Date(value) : value;
            if (date instanceof Date && !isNaN(date)) {
                setSelectedDate(date);
                setSelectedTime(formatTime(date));
            }
        } else {
            setSelectedDate(null);
            setSelectedTime('09:00');
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Jump to start date month when end picker opens
    useEffect(() => {
        if (isOpen && type === 'end' && startDate) {
            const sd = typeof startDate === 'string' ? new Date(startDate) : startDate;
            if (sd instanceof Date && !isNaN(sd)) setCurrentMonth(sd);
        } else if (isOpen) {
            setCurrentMonth(new Date());
        }
    }, [isOpen, startDate, type]);

    const formatTime = (date) => {
        if (!date) return '09:00';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (!(d instanceof Date) || isNaN(d)) return '09:00';
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Force whole-hour strings ("HH:00") for hourly rate bookings
    const normalizeTimeForRate = (timeStr) => {
        if (rateType !== 'hourly') return timeStr;
        const [h] = timeStr.split(':').map(Number);
        return `${String(h).padStart(2, '0')}:00`;
    };

    const formatDisplayDate = () => {
        if (!value) return '';
        const d = typeof value === 'string' ? new Date(value) : value;
        if (!(d instanceof Date) || isNaN(d)) return '';
        return d.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const dayKey = (d) => {
        if (!d) return null;
        const dt = d instanceof Date ? d : new Date(d);
        if (isNaN(dt)) return null;
        return Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const isSameDay = (a, b) => {
        const ka = dayKey(a);
        const kb = dayKey(b);
        return ka !== null && kb !== null && ka === kb;
    };

    const isDateBooked = (date) => {
        if (!date || !bookedDates || bookedDates.length === 0) return false;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        return bookedDates.includes(dateStr);
    };

    const isDateDisabled = (date) => {
        if (!date) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        // Block past dates
        if (checkDate < today) return true;

        // Block booked dates (only for daily/monthly)
        if (rateType !== 'hourly' && isDateBooked(date)) {
            return true;
        }

        // For end date, must be same day (hourly only) or after start date
        if (type === 'end' && startDate) {
            const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
            if (!(start instanceof Date) || isNaN(start)) return false;

            const startDay = new Date(start);
            startDay.setHours(0, 0, 0, 0);

            if (rateType === 'hourly') {
                // Hourly: same day as start is allowed, just not an earlier day
                if (checkDate < startDay) return true;
            } else {
                // Daily/monthly: must be a strictly later day than start
                if (checkDate <= startDay) return true;
            }
        }

        return false;
    };

    const handleDateSelect = (date) => {
        if (isDateDisabled(date)) {
            if (isDateBooked(date)) {
                onWarning?.('📅 This date is already booked. Please select another date.');
            }
            return;
        }

        setSelectedDate(date);

        let timeToUse = normalizeTimeForRate(selectedTime);
        if (timeToUse !== selectedTime) setSelectedTime(timeToUse);

        const newDateTime = new Date(date);
        const [hours, minutes] = timeToUse.split(':').map(Number);
        newDateTime.setHours(hours, minutes, 0, 0);

        // For end date, ensure minimum 1 hour when it lands on the same day as start
        if (type === 'end' && startDate && isSameDay(date, new Date(startDate))) {
            const startDT = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const diffMs = newDateTime.getTime() - startDT.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
                // Auto-set to start time + 1 hour (rounded to the hour for hourly rate)
                const defaultEnd = new Date(startDT.getTime() + 60 * 60 * 1000);
                if (rateType === 'hourly') {
                    newDateTime.setHours(defaultEnd.getHours(), 0, 0, 0);
                } else {
                    newDateTime.setHours(defaultEnd.getHours(), defaultEnd.getMinutes(), 0, 0);
                }
                setSelectedTime(formatTime(newDateTime));
                onWarning?.('⏰ End time set to 1 hour after start time (minimum)');
            }
        }

        onChange(newDateTime.toISOString());
        setIsOpen(false);
    };

    const handleTimeChange = (e) => {
        let newTime = e.target.value;

        // Snap to whole hour for hourly-rate bookings, even if the browser
        // or a pasted value tries to sneak in minutes.
        newTime = normalizeTimeForRate(newTime);
        setSelectedTime(newTime);

        // FIX: previously this whole block was gated behind `if (selectedDate)`,
        // which meant the very first time selection (before any date was picked)
        // never called onChange at all. Fall back to a sensible base date instead.
        const baseDate = selectedDate
            ? new Date(selectedDate)
            : (type === 'end' && startDate ? new Date(startDate) : new Date());

        const newDateTime = new Date(baseDate);
        const [hours, minutes] = newTime.split(':').map(Number);
        newDateTime.setHours(hours, minutes, 0, 0);

        // Validate minimum 1 hour for same-day end booking
        if (type === 'end' && startDate && isSameDay(newDateTime, new Date(startDate))) {
            const startDT = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const diffMs = newDateTime.getTime() - startDT.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
                onWarning?.('End time must be at least 1 hour after start time');
                return;
            }
        }

        setSelectedDate(newDateTime);
        onChange(newDateTime.toISOString());
    };

    const changeMonth = (inc) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + inc, 1));
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];

        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = getDaysInMonth(currentMonth);

    const getMinTime = () => {
        if (type === 'end' && startDate && selectedDate && isSameDay(selectedDate, new Date(startDate))) {
            const minT = new Date(new Date(startDate).getTime() + 60 * 60 * 1000);
            return formatTime(minT);
        }
        return '00:00';
    };

    const timeStep = rateType === 'hourly' ? 3600 : 1800;

    // ============================================================
    // CALENDAR MODE (used for hourly, daily, and monthly alike)
    // ============================================================
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
                    onClick={() => setIsOpen(!isOpen)}
                />
                <span className="datetime-picker-icon" onClick={() => setIsOpen(!isOpen)}>
                    {rateType === 'hourly' ? <Clock size={20} /> : <Calendar size={20} />}
                </span>
            </div>

            {isOpen && (
                <div className="datetime-picker-dropdown">
                    <div className="datetime-picker-header">
                        <button onClick={() => changeMonth(-1)} className="month-nav">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="current-month">
                            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                        </span>
                        <button onClick={() => changeMonth(1)} className="month-nav">
                            <ChevronRight size={20} />
                        </button>
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

                                const classes = [
                                    'calendar-day',
                                    isSelected ? 'selected' : '',
                                    isDisabled ? 'disabled' : '',
                                    isToday ? 'today' : '',
                                    isBooked ? 'booked' : '',
                                ].filter(Boolean).join(' ');

                                return (
                                    <div key={i} className="calendar-day-cell">
                                        <button
                                            className={classes}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isDisabled}
                                            title={isBooked ? '📅 Booked' : isDisabled ? 'Not Available' : 'Click to select'}
                                            style={{
                                                position: 'relative',
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {date.getDate()}
                                            {isBooked && rateType !== 'hourly' && (
                                                <span style={{
                                                    position: 'absolute',
                                                    bottom: '2px',
                                                    right: '2px',
                                                    fontSize: '8px'
                                                }}>
                                                    <Lock size={10} />
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {bookedDates && bookedDates.length > 0 && rateType !== 'hourly' && (
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '8px',
                            borderTop: '1px solid #eee',
                            fontSize: '11px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={12} /> Booked
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ⬜ Available
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🔵 Selected
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🟦 Today
                            </span>
                        </div>
                    )}

                    <div className="datetime-picker-time">
                        <label>{rateType === 'hourly' ? 'Select Hour' : 'Select Time'}</label>
                        <input
                            type="time"
                            className="time-input"
                            value={selectedTime}
                            onChange={handleTimeChange}
                            step={timeStep}
                            min={getMinTime()}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        />
                        {rateType === 'hourly' && (
                            <small style={{ color: '#6c757d', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> Whole hours only, same day or a later day allowed
                            </small>
                        )}
                        {type === 'end' && startDate && selectedDate && isSameDay(selectedDate, new Date(startDate)) && (
                            <small className="time-hint" style={{ display: 'block', color: '#01095A', fontSize: '11px', marginTop: '4px' }}>
                                <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} />
                                Min. 1 hour after start time
                            </small>
                        )}
                    </div>

                    <div className="datetime-picker-actions">
                        <button className="cancel-btn" onClick={() => setIsOpen(false)}>
                            <X size={16} style={{ marginRight: '6px' }} />
                            Cancel
                        </button>
                        <button className="confirm-btn" onClick={() => setIsOpen(false)}>
                            <Check size={16} style={{ marginRight: '6px' }} />
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoomDateTimePicker;