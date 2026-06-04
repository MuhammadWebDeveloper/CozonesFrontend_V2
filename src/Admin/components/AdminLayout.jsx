import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "../styles/AdminLayout.css";

const NAV = [
    { to: "/admin", icon: "ti-layout-dashboard", label: "Dashboard" },
    { to: "/admin/spaces", icon: "ti-building", label: "Spaces & Units" },
    { to: "/admin/bookings", icon: "ti-calendar-event", label: "Bookings" },
    { to: "/admin/hosts", icon: "ti-user-check", label: "Host Requests" },
    // { to: "/admin/users", icon: "ti-users", label: "Users" },
];

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className={`admin-shell ${collapsed ? "collapsed" : ""}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <span className="sidebar-logo">
                        <i className="ti ti-shield-check" aria-hidden="true" />
                        {!collapsed && <span>CoZones Admin</span>}
                    </span>
                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed((p) => !p)}
                        aria-label="Toggle sidebar"
                    >
                        <i className={`ti ${collapsed ? "ti-chevron-right" : "ti-chevron-left"}`} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {NAV.map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/admin"}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? "active" : ""}`
                            }
                        >
                            <i className={`ti ${icon}`} aria-hidden="true" />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <button className="logout-btn" onClick={handleLogout}>
                    <i className="ti ti-logout" aria-hidden="true" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    );
}