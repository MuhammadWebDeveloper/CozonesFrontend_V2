import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../componentstyles/authstyls/LoginRegister.css';
import BaseUrl from './AppConstants';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const resetToken = params.get('token');
        if (resetToken) {
            setToken(resetToken);
        } else {
            setError('Invalid reset link');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await axios.post(`${BaseUrl}api/auth/reset-password`, {
                token,
                newPassword
            });

            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token && error) {
        return (
            <div className="Auth-container">
                <div className="Auth-card">
                    <h2>Invalid Link</h2>
                    <p>This password reset link is invalid or expired.</p>
                    <Link to="/forgot-password" className="reset-link">
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="Auth-container">
            <div className="Auth-card">
                <h2>Create New Password</h2>
                <p>Enter your new password below</p>

                {error && <div className="Auth-error">{error}</div>}
                {success && <div className="Auth-success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <span
                            className="password-eye"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </span>
                    </div>

                    <div className="password-field">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <span
                            className="password-eye"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </span>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p>
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;