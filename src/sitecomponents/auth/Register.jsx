import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../componentstyles/authstyls/LoginRegister.css';
import BaseUrl from '../../utils/AppConstants';

// ⬇️ Update these import paths to wherever your logo files live in your project
import LogoWordmark from '../../assets/logo.png';
import LogoIcon from '../../assets/favicon.png';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${BaseUrl}api/auth/register`, {
                full_name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || ''
            });
            if (response.data.success) {
                const loginResponse = await axios.post(`${BaseUrl}api/auth/login`, {
                    email: formData.email,
                    password: formData.password
                });
                if (loginResponse.data.success) {
                    localStorage.setItem('token', loginResponse.data.token);
                    localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
                    navigate('/');
                    window.location.reload();
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Auth-container">
            <div className="Auth-layout">

                {/* ── Left: Register Card ── */}
                <div className="Auth-card">
                    <h2>Create Account</h2>
                    <p>Join the CoZones community</p>

                    {error && <div className="Auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="Auth-field-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                placeholder="John Smith"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="Auth-field-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="Auth-field-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-field">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="password-eye" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </span>
                            </div>
                        </div>

                        <div className="Auth-field-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-field">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    placeholder="Repeat password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                                <span className="password-eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </span>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Creating account…' : 'Sign Up'}
                        </button>
                    </form>

                    <p>Already have an account? <Link to="/login">Log in</Link></p>
                </div>

                {/* ── Right: CoZones Branding ── */}
                <div className="Auth-brand">
                    <div className="Auth-brand-icon">
                        <img src={LogoIcon} alt="CoZones icon" />
                    </div>
                    <div className="Auth-brand-wordmark">
                        <img src={LogoWordmark} alt="CoZones" />
                    </div>
                    {/* <span className="Auth-brand-tagline">Your co-working community</span> */}
                </div>

            </div>
        </div>
    );
};

export default Register;