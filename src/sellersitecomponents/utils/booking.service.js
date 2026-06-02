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

    // ✅ Owner Cancel Booking - NEW
    ownerCancelBooking: async (bookingId, reason) => {
        const response = await axios.patch(
            `${BaseUrl}api/bookings/${bookingId}/owner-cancel`,
            { reason },  // Send cancellation reason in body
            getAuthConfig()
        );
        return response.data;
    },
    // In booking.service.js
    deleteBooking: async (bookingId) => {
        const response = await axios.delete(
            `${BaseUrl}api/bookings/${bookingId}/delete`,
            getAuthConfig()
        );
        return response.data;
    }
};