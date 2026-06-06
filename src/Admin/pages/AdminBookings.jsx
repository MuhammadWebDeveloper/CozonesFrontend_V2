import { useEffect, useState, useCallback } from "react";
import { adminGetAllBookings } from "../services/admin.service";
import "../styles/AdminLayout.css";

const STATUSES = ["", "confirmed", "pending", "cancelled", "cancelled_by_owner", "completed"];
const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");

function StatusBadge({ status }) {
  const map = {
    confirmed: "badge-green",
    pending: "badge-amber",
    cancelled: "badge-red",
    cancelled_by_owner: "badge-red",
    completed: "badge-blue",
  };
  return (
    <span className={`badge ${map[status] || "badge-gray"}`}>
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [fromDate, setFrom] = useState("");
  const [toDate, setTo] = useState("");
  const [selectedBooking, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminGetAllBookings({ status: statusFilter, from_date: fromDate, to_date: toDate })
      .then((d) => {
        setBookings(d.bookings || []);
        setStats(d.stats || {});
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.buyer?.full_name?.toLowerCase().includes(q) ||
      b.space?.name?.toLowerCase().includes(q) ||
      b.space?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Bookings</h1>
        <p>Manage and monitor all bookings across the platform.</p>
      </div>

      {/* Stats row */}
      <div className="stat-grid">
        <div className="stat-card accent-purple">
          <div className="stat-label">Total</div>
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
          <div className="stat-label">Revenue (confirmed)</div>
          <div className="stat-value">PKR {fmt(Math.round(stats.total_revenue || 0))}</div>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <div className="table-toolbar">
          <h2>All Bookings ({filtered.length})</h2>
          <div className="toolbar-search">
            <i className="ti ti-search" />
            <input
              placeholder="Search user, space…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || "All statuses"}</option>
            ))}
          </select>
          <input
            type="date"
            className="filter-select"
            value={fromDate}
            onChange={(e) => setFrom(e.target.value)}
            title="From date"
          />
          <input
            type="date"
            className="filter-select"
            value={toDate}
            onChange={(e) => setTo(e.target.value)}
            title="To date"
          />
          {(fromDate || toDate || statusFilter) && (
            <button className="btn-action" onClick={() => { setStatus(""); setFrom(""); setTo(""); }}>
              <i className="ti ti-x" /> Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="admin-loading">
            <i className="ti ti-loader" />
            <span>Loading bookings…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-calendar-off" />
            No bookings found
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Owner</th>
                <th>Space</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.booking_ref}>
                  <td style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>
                    {/* {b.booking_ref?.slice(0, 20)} */}
                    {b.booking_ref}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.buyer?.full_name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.buyer?.email}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{b.owner?.full_name || "—"}</td>
                  <td>
                    <div>{b.space?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{b.space?.city}</div>
                  </td>
                  <td>
                    <span className="badge badge-purple">
                      {b.unit?.unit_type?.replace(/_/g, " ") || "—"}
                    </span>
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ fontSize: 12 }}>
                    {b.start_time ? new Date(b.start_time).toLocaleString() : "—"}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {b.end_time ? new Date(b.end_time).toLocaleString() : "—"}
                  </td>
                  <td style={{ fontWeight: 500 }}>PKR {fmt(b.total_price)}</td>
                  <td>
                    <button
                      className="btn-action view"
                      onClick={() => setSelected(b)}
                    >
                      <i className="ti ti-eye" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Booking detail modal */}
      {selectedBooking && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <i className="ti ti-x" />
            </button>
            <h2>Booking Details</h2>
            <BookingDetail b={selectedBooking} />
          </div>
        </div>
      )}
    </div>
  );
}

function BookingDetail({ b }) {
  const rows = [
    ["Booking ID", b.id],
    ["Status", b.status?.replace(/_/g, " ")],
    ["User", b.buyer?.full_name],
    ["User Email", b.buyer?.email],
    ["Owner", b.owner?.full_name],
    ["Space", b.space?.name],
    ["City", b.space?.city],
    ["Address", b.space?.address],
    ["Unit Type", b.unit?.unit_type?.replace(/_/g, " ")],
    ["Start", b.start_time ? new Date(b.start_time).toLocaleString() : "—"],
    ["End", b.end_time ? new Date(b.end_time).toLocaleString() : "—"],
    ["Total Price", b.total_price ? `PKR ${Number(b.total_price).toLocaleString()}` : "—"],
    ["Created", b.created_at ? new Date(b.created_at).toLocaleString() : "—"],
  ];

  return (
    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
      <tbody>
        {rows.map(([label, val]) => (
          <tr key={label} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
            <td style={{ padding: "8px 0", color: "#9ca3af", width: 120 }}>{label}</td>
            <td style={{ padding: "8px 0", fontWeight: label === "Total Price" ? 500 : 400 }}>
              {val || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}