import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../componentstyles/authstyls/LoginRegister.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:4343/api/auth/register', {
                full_name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone || '' 
            });

            if (response.data.success) {
                // Auto login after registration
                const loginResponse = await axios.post('http://localhost:4343/api/auth/login', {
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
            <div className="Auth-card">
                <h2>Create Account</h2>
                <p>Join the CoZones community</p>
                {error && <div className="Auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
                    <button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
                </form>
                <p>Already have an account? <Link to="/login">Log in</Link></p>
            </div>
        </div>
    );
};

export default Register;