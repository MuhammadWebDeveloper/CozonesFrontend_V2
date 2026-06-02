import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../../componentstyles/sellerdashboardstyles/CancelBookingModal.css';

const CancelBookingModal = ({ isOpen, onClose, onConfirm, booking }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        setIsSubmitting(true);
        await onConfirm(reason);
        setIsSubmitting(false);
        setReason('');
        onClose();
    };

    if (!isOpen) return null;

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
                            <strong>Date:</strong> {new Date(booking?.start_time).toLocaleDateString()}
                        </p>

                        <label className="cancel-label">
                            Reason for Cancellation *
                            <textarea
                                className="cancel-textarea"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Please explain why you need to cancel this booking..."
                                rows="4"
                                required
                            />
                        </label>

                        <div className="cancel-warning">
                            ⚠️ This action cannot be undone. The customer will be notified via email.
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

export default CancelBookingModal;