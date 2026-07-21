// components/Toast.jsx
import React, { useEffect } from 'react';
import '../componentstyles/utilstyle/Toast.css';
import { 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Info, 
    X,
    Bell
} from 'lucide-react';

const Toast = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getIcon = () => {
        const iconProps = {
            size: 20,
            style: { flexShrink: 0 }
        };
        
        switch (type) {
            case 'success':
                return <CheckCircle {...iconProps} color="#10b981" />;
            case 'error':
                return <XCircle {...iconProps} color="#ef4444" />;
            case 'warning':
                return <AlertTriangle {...iconProps} color="#f59e0b" />;
            case 'info':
                return <Info {...iconProps} color="#3b82f6" />;
            default:
                return <Bell {...iconProps} color="#6b7280" />;
        }
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">{getIcon()}</span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>
                <X size={18} />
            </button>
        </div>
    );
};

export default Toast;