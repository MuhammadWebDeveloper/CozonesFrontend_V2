import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../componentstyles/authstyls/LoginRegister.css';
import BaseUrl from '../../utils/AppConstants';

// ⬇️ Update these import paths to wherever your logo files live in your project
import LogoWordmark from '../../assets/logo.png';
import LogoIcon from '../../assets/favicon.png';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${BaseUrl}api/auth/login`, formData);
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/');
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="Auth-container">
            <div className="Auth-layout">

                {/* ── Left: Login Card ── */}
                <div className="Auth-card">
                    <h2>Welcome back</h2>
                    <p>Login to your account</p>

                    {error && <div className="Auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
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
                            <div className="field-header">
                                <label htmlFor="password">Password</label>
                                <Link to="/forgot-password" className="forgot-password-link">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="password-field">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <span
                                    className="password-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </span>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Logging in…' : 'Login'}
                        </button>
                    </form>

                    <p>Don't have an account? <Link to="/register">Sign up</Link></p>
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

export default Login;