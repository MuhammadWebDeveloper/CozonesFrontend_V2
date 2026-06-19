// components/DateTimePicker.jsx - COMPLETE FIX
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
    isHourlyOnly = false
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
    // CRITICAL FIX: isDateDisabled - ALWAYS return false for hourly
    // ============================================================
    const isDateDisabled = (date) => {
        if (!date) return true;
        const dk = dayKey(date);
        if (dk === null) return true;

        const todayKey = dayKey(new Date());

        // Block past dates
        if (dk < todayKey) {
            console.log('❌ Past date disabled:', date.toLocaleDateString());
            return true;
        }

        // 🚀 HOURLY: ENABLE ALL DATES from today onward
        if (rateType === 'hourly') {
            console.log('✅ HOURLY - Date ENABLED:', date.toLocaleDateString());
            return false; // THIS IS THE FIX - Enable all dates
        }

        // Only apply restrictions for daily/monthly
        if (type === 'end') {
            if (!startDate) return false;
            const startDayKey = dayKey(startDate);
            const isDisabled = dk <= startDayKey;
            console.log(`📅 DAILY - ${isDisabled ? 'DISABLED' : 'ENABLED'}:`, date.toLocaleDateString());
            return isDisabled;
        }

        return false;
    };

    // ============================================================
    // handleDateSelect - Handle date selection
    // ============================================================
    const handleDateSelect = (date) => {
        console.log('📅 Date selected:', date.toLocaleDateString(), 'Rate:', rateType);

        if (!date || isDateDisabled(date)) {
            console.log('❌ Date selection blocked');
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
    // FULL CALENDAR MODE (Daily/Monthly)
    // ============================================================
    console.log('🔵 DateTimePicker Render:', {
        type,
        rateType,
        startDate: startDate ? new Date(startDate).toLocaleDateString() : 'null',
        isOpen
    });

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

                                // Log each date
                                if (isDisabled) {
                                    console.log(`🔒 Date ${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} is DISABLED`);
                                }

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
                                            style={{
                                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {date.getDate()}
                                            {isToday && <span style={{ fontSize: '8px', marginLeft: '2px' }}>•</span>}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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