import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) return <Navigate to="/admin/login" replace />;

    let user;
    try { user = JSON.parse(userRaw); } catch { return <Navigate to="/admin/login" replace />; }

    if (user?.role !== "admin") return <Navigate to="/admin/login" replace />;

    return children;
}