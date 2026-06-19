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
export const adminGetAllDisputes = (status = "") => {
    const url = status
        ? `${BASE_URL}/bookings/admin/disputes?status=${status}`
        : `${BASE_URL}/bookings/admin/disputes`;
    return fetch(url, {
        headers: getAuthHeaders()
    }).then(handleResponse);
};

export const adminGetDisputeById = (disputeId) =>
    fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}`, {
        headers: getAuthHeaders()
    }).then(handleResponse);

export const adminResolveDispute = (disputeId, resolutionNotes = "") =>
    fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/resolve`, {
        method: "PATCH", // or "POST" depending on your backend
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolution_notes: resolutionNotes }),
    }).then(handleResponse);

export const adminRejectDispute = (disputeId, rejectionReason = "") =>
    fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/reject`, {
        method: "PATCH", // or "POST" depending on your backend
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason: rejectionReason }),
    }).then(handleResponse);

export const adminUpdateDisputeStatus = (disputeId, status, notes = "") =>
    fetch(`${BASE_URL}/bookings/admin/disputes/${disputeId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, notes }),
    }).then(handleResponse);

// ── Dashboard Stats ───────────────────────────────────────
export const adminGetDashboardStats = async () => {
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

    // Count pending disputes
    const pendingDisputes = disputes.disputes
        ? disputes.disputes.filter(d => d.status?.toLowerCase() === 'pending').length
        : 0;

    return {
        stats: bookings.stats || {},
        totalSpaces: spaces.count || 0,
        pendingHosts: Array.isArray(hosts) ? hosts.length : (hosts.count || 0),
        pendingDisputes: pendingDisputes,
        recentBookings: (bookings.bookings || []).slice(0, 5),
    };
};