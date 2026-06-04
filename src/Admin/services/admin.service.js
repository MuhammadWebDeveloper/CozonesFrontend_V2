const BASE_URL = " https://cozoens-backend-v2.vercel.app/api";
// const BASE_URL = "http://localhost:4343/api";

// import BaseUrl from "../../sitecomponents//";

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
// ✅ FIXED: Changed from /host/ to /host-requests/
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

// ── Dashboard Stats ───────────────────────────────────────
export const adminGetDashboardStats = async () => {
    const [bookingsRes, spacesRes, hostsRes] = await Promise.allSettled([
        adminGetAllBookings(),
        adminGetAllSpaces(),
        adminGetPendingHosts(),
    ]);

    const bookings = bookingsRes.status === "fulfilled" ? bookingsRes.value : {};
    const spaces = spacesRes.status === "fulfilled" ? spacesRes.value : {};
    const hosts = hostsRes.status === "fulfilled" ? hostsRes.value : {};

    return {
        stats: bookings.stats || {},
        totalSpaces: spaces.count || 0,
        pendingHosts: Array.isArray(hosts) ? hosts.length : (hosts.count || 0),
        recentBookings: (bookings.bookings || []).slice(0, 5),
    };
};