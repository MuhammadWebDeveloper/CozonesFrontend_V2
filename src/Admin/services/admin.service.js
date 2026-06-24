// src/Admin/services/admin.service.js

const BASE_URL = "https://v1.api.co-zones.com/api";
// const BASE_URL = "http://localhost:4343/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
};

// ── Spaces ──────────────────────────────────────────────
export const adminGetAllSpaces = () =>
    fetch(`${BASE_URL}/spaces/allspaces`, { headers: getAuthHeaders() }).then(handleResponse);

export const adminGetSpaceById = (id) =>
    fetch(`${BASE_URL}/spaces/space/${id}`, { headers: getAuthHeaders() }).then(handleResponse);

export const adminGetUnitsOfSpace = (spaceId) =>
    fetch(`${BASE_URL}/spaces/${spaceId}/units`, { headers: getAuthHeaders() }).then(handleResponse);

export const adminToggleSpaceVerify = (spaceId, isVerified) =>
    fetch(`${BASE_URL}/admin/spaces/${spaceId}/verify`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_verified: isVerified }),
    }).then(handleResponse);

// ── Bookings ─────────────────────────────────────────────
export const adminGetAllBookings = (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    return fetch(`${BASE_URL}/bookings/admin/all-bookings${qs ? `?${qs}` : ""}`, {
        headers: getAuthHeaders(),
    }).then(handleResponse);
};

// ── Host Requests ─────────────────────────────────────────
export const adminGetPendingHosts = () =>
    fetch(`${BASE_URL}/host-requests/pending`, { headers: getAuthHeaders() }).then(handleResponse);

export const adminApproveHost = (requestId, adminNotes = "") =>
    fetch(`${BASE_URL}/host-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ admin_notes: adminNotes }),
    }).then(handleResponse);

export const adminRejectHost = (requestId, rejectionReason = "") =>
    fetch(`${BASE_URL}/host-requests/${requestId}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
    }).then(handleResponse);

// ── Users ─────────────────────────────────────────────────
export const adminGetAllUsers = () =>
    fetch(`${BASE_URL}/admin/users`, { headers: getAuthHeaders() }).then(handleResponse);

export const adminToggleUserBlock = (userId, blocked) =>
    fetch(`${BASE_URL}/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked }),
    }).then(handleResponse);

// ── Disputes ──────────────────────────────────────────────
// Base route: /api/bookings/admin/disputes

/**
 * Get all disputes with optional status filter
 * @param {string} status - Optional status filter (pending, resolved, rejected)
 */
export const adminGetAllDisputes = (status = "") => {
    const url = status
        ? `${BASE_URL}/bookings/admin/disputes?status=${status}`
        : `${BASE_URL}/bookings/admin/disputes`;
    return fetch(url, {
        headers: getAuthHeaders()
    }).then(handleResponse);
};

/**
 * Get a single dispute by ID with full details
 * @param {string} disputeId - The dispute ID
 */
export const adminGetDisputeById = (disputeId) => {
    return fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}`, {
        headers: getAuthHeaders()
    }).then(handleResponse);
};

/**
 * Resolve a dispute with resolution notes and decision
 * @param {string} disputeId - The dispute ID
 * @param {string} resolution - Resolution notes/decision text
 * @param {string} decision - The decision type: 'refund', 'no_refund', 'partial_refund'
 */
export const adminResolveDispute = (disputeId, resolution, decision = "refund") => {
    const validDecisions = ['refund', 'no_refund', 'partial_refund'];
    if (!validDecisions.includes(decision)) {
        console.warn(`Invalid decision "${decision}". Defaulting to "refund".`);
        decision = "refund";
    }

    return fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            resolution: resolution,
            decision: decision
        }),
    }).then(handleResponse);
};

/**
 * Reject a dispute with rejection reason - Uses dedicated reject endpoint
 * @param {string} disputeId - The dispute ID
 * @param {string} reason - Rejection reason
 */
export const adminRejectDispute = (disputeId, reason) => {
    return fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            rejection_reason: reason
        }),
    }).then(handleResponse);
};

/**
 * Delete a dispute permanently (Admin only)
 * @param {string} disputeId - The dispute ID to delete
 */
export const adminDeleteDispute = (disputeId) => {
    return fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    }).then(handleResponse);
};

/**
 * Update dispute status (alternative method)
 * @param {string} disputeId - The dispute ID
 * @param {string} status - New status (resolved, rejected)
 * @param {string} notes - Notes about the status change
 */
export const adminUpdateDisputeStatus = (disputeId, status, notes = "") => {
    return fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
    }).then(handleResponse);
};

// ── Dashboard Stats ───────────────────────────────────────
export const adminGetDashboardStats = async () => {
    try {
        const [bookingsRes, spacesRes, hostsRes, disputesRes] = await Promise.allSettled([
            adminGetAllBookings(),
            adminGetAllSpaces(),
            adminGetPendingHosts(),
            adminGetAllDisputes(),
        ]);

        const bookings = bookingsRes.status === "fulfilled" ? bookingsRes.value : {};
        const spaces = spacesRes.status === "fulfilled" ? spacesRes.value : {};
        const hosts = hostsRes.status === "fulfilled" ? hostsRes.value : {};
        const disputes = disputesRes.status === "fulfilled" ? disputesRes.value : {};

        const pendingDisputes = disputes.disputes
            ? disputes.disputes.filter(d => d.status?.toLowerCase() === 'pending' || d.status?.toLowerCase() === 'open').length
            : 0;

        const totalDisputes = disputes.disputes ? disputes.disputes.length : 0;
        const resolvedDisputes = disputes.disputes
            ? disputes.disputes.filter(d => d.status?.toLowerCase() === 'resolved').length
            : 0;
        const rejectedDisputes = disputes.disputes
            ? disputes.disputes.filter(d => d.status?.toLowerCase() === 'rejected').length
            : 0;

        return {
            stats: bookings.stats || {},
            totalSpaces: spaces.count || 0,
            pendingHosts: Array.isArray(hosts) ? hosts.length : (hosts.count || 0),
            pendingDisputes: pendingDisputes,
            totalDisputes: totalDisputes,
            resolvedDisputes: resolvedDisputes,
            rejectedDisputes: rejectedDisputes,
            recentBookings: (bookings.bookings || []).slice(0, 5),
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

// ── Helper function to get dispute statistics ──────────────────
export const adminGetDisputeStats = async () => {
    try {
        const allDisputes = await adminGetAllDisputes();
        const disputes = allDisputes.disputes || [];

        return {
            total: disputes.length,
            pending: disputes.filter(d => d.status?.toLowerCase() === 'pending' || d.status?.toLowerCase() === 'open').length,
            resolved: disputes.filter(d => d.status?.toLowerCase() === 'resolved').length,
            rejected: disputes.filter(d => d.status?.toLowerCase() === 'rejected').length,
            inProgress: disputes.filter(d => d.status?.toLowerCase() === 'in_progress').length,
        };
    } catch (error) {
        console.error('Error fetching dispute stats:', error);
        throw error;
    }
};