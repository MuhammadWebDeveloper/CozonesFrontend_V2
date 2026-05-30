// components/DateTimePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../componentstyles/utilstyle/DateTimePicker.css';

const DateTimePicker = ({ value, onChange, minDate, placeholder, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [selectedTime, setSelectedTime] = useState(value ? new Date(value) : null);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDisplayDate = () => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const isDateDisabled = (date) => {
        if (!minDate) return false;
        return date < new Date(minDate);
    };

    const handleDateSelect = (date) => {
        if (isDateDisabled(date)) return;
        setSelectedDate(date);
        const newDateTime = new Date(date);
        if (selectedTime) {
            newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        }
        onChange({ target: { value: newDateTime.toISOString() } });
    };

    const handleTimeChange = (e) => {
        const [hours, minutes] = e.target.value.split(':');
        const newTime = new Date();
        newTime.setHours(parseInt(hours), parseInt(minutes));
        setSelectedTime(newTime);

        if (selectedDate) {
            const newDateTime = new Date(selectedDate);
            newDateTime.setHours(parseInt(hours), parseInt(minutes));
            onChange({ target: { value: newDateTime.toISOString() } });
        } else if (value) {
            const existingDate = new Date(value);
            existingDate.setHours(parseInt(hours), parseInt(minutes));
            onChange({ target: { value: existingDate.toISOString() } });
        }
    };

    const changeMonth = (increment) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
    };

    const days = getDaysInMonth(currentMonth);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                    📅
                </span>
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
                            {weekdays.map(day => (
                                <div key={day} className="weekday">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-days">
                            {days.map((date, index) => (
                                <div key={index} className="calendar-day-cell">
                                    {date && (
                                        <button
                                            className={`calendar-day ${selectedDate && date.toDateString() === selectedDate.toDateString() ? 'selected' : ''} ${isDateDisabled(date) ? 'disabled' : ''}`}
                                            onClick={() => handleDateSelect(date)}
                                            disabled={isDateDisabled(date)}
                                        >
                                            {date.getDate()}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="datetime-picker-time">
                        <label>Select Time</label>
                        <input
                            type="time"
                            className="time-input"
                            value={selectedTime ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : ''}
                            onChange={handleTimeChange}
                            step="60"
                        />
                    </div>

                    <div className="datetime-picker-actions">
                        <button className="cancel-btn" onClick={() => setIsOpen(false)}>
                            Cancel
                        </button>
                        <button className="confirm-btn" onClick={() => setIsOpen(false)}>
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;