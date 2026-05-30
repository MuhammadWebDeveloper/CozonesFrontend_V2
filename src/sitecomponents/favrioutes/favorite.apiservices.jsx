// src/services/favoriteAPI.js
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

const API_BASE_URL = `${BaseUrl}api`;

// Create axios instance
const favoriteAPI = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Add token to all requests
favoriteAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ FIXED: Use unitId in URL, not in body
export const toggleFavorite = async (unitId) => {
    try {
        const response = await favoriteAPI.post(`/favorites/toggle/${unitId}`);
        return response.data;
    } catch (error) {
        console.error('Toggle favorite error:', error);
        throw error;
    }
};

// ✅ FIXED: Check favorite status for a unit
export const checkFavorite = async (unitId) => {
    try {
        const response = await favoriteAPI.get(`/favorites/check/${unitId}`);
        return response.data;
    } catch (error) {
        console.error('Check favorite error:', error);
        throw error;
    }
};

// Get user's favorites
export const getUserFavorites = async () => {
    try {
        const response = await favoriteAPI.get('/favorites/my-favorites');
        return response.data;
    } catch (error) {
        console.error('Get favorites error:', error);
        throw error;
    }
};

// Get favorite count for a unit
export const getUnitFavoriteCount = async (unitId) => {
    try {
        const response = await favoriteAPI.get(`/favorites/count/${unitId}`);
        return response.data;
    } catch (error) {
        console.error('Get favorite count error:', error);
        throw error;
    }
};

export default favoriteAPI;