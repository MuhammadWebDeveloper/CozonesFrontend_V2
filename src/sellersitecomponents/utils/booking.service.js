// src/services/booking.service.js
import axios from 'axios';
import BaseUrl from '../../utils/AppConstants';

const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const bookingService = {
    // Get all owner bookings
    getOwnerBookings: async () => {
        const response = await axios.get(
            `${BaseUrl}api/bookings/owner/requests`,
            getAuthConfig()
        );
        return response.data;
    },

    // Confirm/Approve booking
    confirmBooking: async (bookingId) => {
        const response = await axios.patch(
            `${BaseUrl}api/bookings/${bookingId}/confirm`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    // Reject booking
    rejectBooking: async (bookingId) => {
        const response = await axios.patch(
            `${BaseUrl}api/bookings/${bookingId}/reject`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    // ✅ Complete Booking (New)
    completeBooking: async (bookingId) => {
        const response = await axios.patch(
            `${BaseUrl}api/bookings/${bookingId}/complete`,
            {},
            getAuthConfig()
        );
        return response.data;
    },

    // ✅ Owner Cancel Booking
    ownerCancelBooking: async (bookingId, reason) => {
        const response = await axios.patch(
            `${BaseUrl}api/bookings/${bookingId}/owner-cancel`,
            { reason },
            getAuthConfig()
        );
        return response.data;
    },

    // Delete Booking
    deleteBooking: async (bookingId) => {
        const response = await axios.delete(
            `${BaseUrl}api/bookings/${bookingId}/delete`,
            getAuthConfig()
        );
        return response.data;
    },

    // Create Dispute
    createDispute: async (bookingId, reason, description) => {
        const response = await axios.post(
            `${BaseUrl}api/bookings/${bookingId}/dispute`,
            { reason, description },
            getAuthConfig()
        );
        return response.data;
    },
};