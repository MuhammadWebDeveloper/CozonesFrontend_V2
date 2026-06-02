import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope } from 'react-icons/fa';
import '../componentstyles/authstyls/LoginRegister.css';
import BaseUrl from '../../src/utils/AppConstants';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(`${BaseUrl}api/auth/forgot-password`, { email });

            if (response.data.success) {
                setSuccess('Password reset link sent to your email!');
                setEmail('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Auth-container">
            <div className="Auth-card">
                <h2>Forgot Password</h2>
                <p>Enter your email to receive reset link</p>

                {error && <div className="Auth-error">{error}</div>}
                {success && <div className="Auth-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="password-field">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <span className="input-icon">
                            <FaEnvelope size={18} />
                        </span>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p>
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;