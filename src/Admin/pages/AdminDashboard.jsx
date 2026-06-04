import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetDashboardStats } from "../services/admin.service";
import "../styles/AdminLayout.css";

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    adminGetDashboardStats()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="admin-loading">
        <i className="ti ti-loader" />
        <span>Loading dashboard…</span>
      </div>
    );

  if (error) return <div className="admin-page"><div className="admin-error">{error}</div></div>;

  const { stats, totalSpaces, pendingHosts, recentBookings } = data;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back. Here's what's happening in CoZones.</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent-purple">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{fmt(stats.total)}</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-label">Confirmed</div>
          <div className="stat-value">{fmt(stats.confirmed)}</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{fmt(stats.pending)}</div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-label">Cancelled</div>
          <div className="stat-value">{fmt(Number(stats.cancelled || 0) + Number(stats.cancelled_by_owner || 0))}</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">PKR {fmt(Math.round(stats.total_revenue || 0))}</div>
        </div>
        <div className="stat-card accent-purple">
          <div className="stat-label">Total Spaces</div>
          <div className="stat-value">{fmt(totalSpaces)}</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Pending Hosts</div>
          <div className="stat-value">{fmt(pendingHosts)}</div>
          {pendingHosts > 0 && (
            <div className="stat-sub" style={{ cursor: "pointer", color: "#818cf8" }}
              onClick={() => navigate("/admin/hosts")}>
              Review now →
            </div>
          )}
        </div>
      </div>

      <div className="admin-table-wrap">
        <div className="table-toolbar">
          <h2>Recent Bookings</h2>
          <button className="btn-action view" onClick={() => navigate("/admin/bookings")}>
            View all <i className="ti ti-arrow-right" />
          </button>
        </div>
        {recentBookings.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-calendar-off" />
            No bookings yet
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Space</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.buyer?.full_name || "—"}</td>
                  <td>{b.space?.name || "—"}</td>
                  <td>{b.unit?.unit_type?.replace(/_/g, " ") || "—"}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>PKR {fmt(b.total_price)}</td>
                  <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: "badge-green",
    pending:   "badge-amber",
    cancelled: "badge-red",
    cancelled_by_owner: "badge-red",
    completed: "badge-blue",
  };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{status?.replace(/_/g, " ") || "—"}</span>;
}