// components/Toast.jsx
import React, { useEffect } from 'react';
import '../componentstyles/utilstyle/Toast.css';

const Toast = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            default:
                return '📌';
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">{getIcon()}</span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
};

export default Toast;