import { useEffect, useState } from "react";
import { adminGetAllUsers, adminToggleUserBlock } from "../services/admin.service";
import "../styles/AdminLayout.css";

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("");
  const [actionLoading, setAL] = useState(null);
  const [toast, setToast]   = useState(null);

  useEffect(() => {
    adminGetAllUsers()
      .then((d) => setUsers(Array.isArray(d) ? d : (d.users || d.data || [])))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleBlock = async (user) => {
    const willBlock = !user.is_blocked;
    if (!window.confirm(`${willBlock ? "Block" : "Unblock"} ${user.full_name}?`)) return;
    setAL(user.id);
    try {
      await adminToggleUserBlock(user.id, willBlock);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_blocked: willBlock } : u))
      );
      showToast(`User ${willBlock ? "blocked" : "unblocked"} successfully.`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAL(null);
    }
  };

  const roles = [...new Set(users.map((u) => u.role).filter(Boolean))];

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(search);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="admin-page">
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 999,
            background: toast.type === "error" ? "#fee2e2" : "#d1fae5",
            color:      toast.type === "error" ? "#991b1b" : "#065f46",
            padding: "12px 18px",
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>Users</h1>
        <p>{users.length} total registered users</p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-wrap">
        <div className="table-toolbar">
          <h2>All Users ({filtered.length})</h2>
          <div className="toolbar-search">
            <i className="ti ti-search" />
            <input
              placeholder="Search by name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="admin-loading">
            <i className="ti ti-loader" />
            <span>Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-users-off" />
            No users found
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: u.is_blocked ? "#fee2e2" : "#ede9fe",
                          color:      u.is_blocked ? "#991b1b" : "#5b21b6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {u.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "?"}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email || "—"}</td>
                  <td style={{ fontSize: 13 }}>{u.phone || "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === "admin"
                          ? "badge-purple"
                          : u.role === "host"
                          ? "badge-blue"
                          : "badge-gray"
                      }`}
                    >
                      {u.role || "user"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_blocked ? "badge-red" : "badge-green"}`}>
                      {u.is_blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#9ca3af" }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {u.role !== "admin" && (
                      <button
                        className={`btn-action ${u.is_blocked ? "approve" : "reject"}`}
                        disabled={actionLoading === u.id}
                        onClick={() => handleToggleBlock(u)}
                      >
                        {actionLoading === u.id ? (
                          <i className="ti ti-loader" />
                        ) : u.is_blocked ? (
                          <><i className="ti ti-lock-open" /> Unblock</>
                        ) : (
                          <><i className="ti ti-ban" /> Block</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}