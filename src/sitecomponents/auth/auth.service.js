// src/services/auth.service.js
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

const API_URL = `${BaseUrl}api/auth`;

// ✅ ADD THIS FUNCTION - Get auth token
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Reusable logout function with backend blacklisting
export const logout = async () => {
    const token = getAuthToken(); // Now this works!

    // Call backend to blacklist the token
    if (token) {
        try {
            await axios.post(`${API_URL}/logout`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Token blacklisted on server');
        } catch (error) {
            console.error('⚠️ Backend logout failed:', error);
        }
    }

    // Clear all local data (always do this)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Clear cookies if any
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
};

// Helper to check if user is logged in
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Helper to get current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};