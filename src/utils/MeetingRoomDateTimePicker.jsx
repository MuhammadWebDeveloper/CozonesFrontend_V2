// MeetingRoomDateTimePicker.jsx - COMPLETELY FIXED WITH LOCAL TIME

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
    const [pickerDate, setPickerDate] = useState(null);
    const pickerRef = useRef(null);

    // Sync with value prop
    useEffect(() => {
        if (value) {
            const date = typeof value === 'string' ? new Date(value) : value;
            if (date instanceof Date && !isNaN(date)) {
                setSelectedDate(date);
                setPickerDate(date);
                setSelectedTime(formatTime(date));
            }
        } else {
            setSelectedDate(null);
            setPickerDate(null);
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

    // ============================================================
    // NEW: Format date as local string WITHOUT timezone conversion
    // ============================================================
    const formatLocalDateTime = (date) => {
        if (!date) return '';
        const d = typeof date === 'string' ? new Date(date) : date;
        if (!(d instanceof Date) || isNaN(d)) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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

        if (checkDate < today) return true;

        if (rateType !== 'hourly' && isDateBooked(date)) {
            return true;
        }

        if (type === 'end' && startDate) {
            const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
            if (!(start instanceof Date) || isNaN(start)) return false;

            const startDay = new Date(start);
            startDay.setHours(0, 0, 0, 0);

            if (rateType === 'hourly') {
                if (checkDate < startDay) return true;
            } else {
                if (checkDate <= startDay) return true;
            }
        }

        return false;
    };

    // ============ FIXED: handleDateSelect - Uses LOCAL TIME ============
    const handleDateSelect = (date) => {
        if (isDateDisabled(date)) {
            if (isDateBooked(date)) {
                onWarning?.('📅 This date is already booked. Please select another date.');
            }
            return;
        }

        setPickerDate(date);
        setSelectedDate(date);

        let currentTime = selectedTime;

        if (rateType === 'hourly') {
            currentTime = normalizeTimeForRate(currentTime);
            if (currentTime !== selectedTime) {
                setSelectedTime(currentTime);
            }
        }

        const newDateTime = new Date(date);
        const [hours, minutes] = currentTime.split(':').map(Number);
        newDateTime.setHours(hours, minutes, 0, 0);

        if (type === 'end' && startDate && isSameDay(date, new Date(startDate))) {
            const startDT = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const diffMs = newDateTime.getTime() - startDT.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
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

        setSelectedDate(newDateTime);
        setPickerDate(newDateTime);

        // ============================================================
        // FIX: Use local format instead of toISOString()
        // ============================================================
        onChange(formatLocalDateTime(newDateTime));
        setIsOpen(false);
    };

    // ============ FIXED: handleTimeChange - Uses LOCAL TIME ============
    const handleTimeChange = (e) => {
        let newTime = e.target.value;

        if (rateType === 'hourly') {
            newTime = normalizeTimeForRate(newTime);
        }

        setSelectedTime(newTime);

        let baseDate = pickerDate || selectedDate;

        if (!baseDate) {
            baseDate = type === 'end' && startDate ? new Date(startDate) : new Date();
        }

        const newDateTime = new Date(baseDate);
        const [hours, minutes] = newTime.split(':').map(Number);
        newDateTime.setHours(hours, minutes, 0, 0);

        if (type === 'end' && startDate && isSameDay(newDateTime, new Date(startDate))) {
            const startDT = typeof startDate === 'string' ? new Date(startDate) : startDate;
            const diffMs = newDateTime.getTime() - startDT.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            if (diffHours < 1) {
                onWarning?.('⏰ End time must be at least 1 hour after start time');
                return;
            }
        }

        setSelectedDate(newDateTime);
        setPickerDate(newDateTime);

        // ============================================================
        // FIX: Use local format instead of toISOString()
        // ============================================================
        onChange(formatLocalDateTime(newDateTime));
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
                        <label>{rateType === 'hourly' ? 'Select Time' : 'Select Time'}</label>
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
                        {/* {rateType === 'hourly' && (

                            <small style={{ color: '#6c757d', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} /> Whole hours only, same day or a later day allowed
</small>
                            <small style={{ color: '#6c757d', fontSize: '11px', display: 'block' }}>
                                ⏰ Hourly bookings - whole hours only

                            </small>
                        )} */}




                        {rateType === 'hourly' && (
                            <>
                                <small style={{ color: '#6c757d', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> Whole hours only, same day or a later day allowed
                                </small>
                                <small style={{ color: '#6c757d', fontSize: '11px', display: 'block' }}>
                                    ⏰ Hourly bookings - whole hours only
                                </small>
                            </>
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