import { useEffect, useState } from "react";
import {
  adminGetPendingHosts,
  adminApproveHost,
  adminRejectHost,
} from "../services/admin.service";
import "../styles/AdminLayout.css";

export default function AdminHostRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [actionLoading, setAL]  = useState(null);
  const [toast, setToast]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => {
    setLoading(true);
    adminGetPendingHosts()
      .then((d) => setRequests(Array.isArray(d) ? d : (d.requests || d.data || [])))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id) => {
    // Optional: Add confirmation
    if (!window.confirm("Are you sure you want to APPROVE this host request?")) return;
    
    setAL(id + "-approve");
    try {
      await adminApproveHost(id, "Application approved by admin");
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("✅ Host request approved successfully! User is now an owner.", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAL(null);
    }
  };

  const openRejectModal = (id) => {
    setCurrentRequestId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a rejection reason", "error");
      return;
    }
    
    setAL(currentRequestId + "-reject");
    setShowRejectModal(false);
    
    try {
      await adminRejectHost(currentRequestId, rejectReason);
      setRequests((prev) => prev.filter((r) => r.id !== currentRequestId));
      showToast("❌ Host request rejected.", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setAL(null);
      setCurrentRequestId(null);
      setRejectReason("");
    }
  };

  return (
    <div className="admin-page">
      {/* Toast Notification */}
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
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>Host Requests</h1>
        <p>
          {requests.length} pending request{requests.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">
          <i className="ti ti-loader" />
          <span>Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-table-wrap">
          <div className="empty-state">
            <i className="ti ti-user-check" />
            <div>No pending host requests</div>
          </div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <div className="table-toolbar">
            <h2>Pending Host Requests ({requests.length})</h2>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Phone</th>
                <th>CNIC</th>
                <th>Submitted</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {r.user_name || r.full_name || r.user?.full_name || "—"}
                    </div>
                   </td>
                  <td style={{ fontSize: 13 }}>
                    {r.user_email || r.email || r.user?.email || "—"}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {r.phone_number || r.phone || r.user?.phone || "—"}
                  </td>
                  <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                    {r.cnic_number || "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "#9ca3af" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <button className="btn-action view" onClick={() => setSelected(r)}>
                      <i className="ti ti-eye" /> View
                    </button>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-action approve"
                        disabled={!!actionLoading}
                        onClick={() => handleApprove(r.id)}
                      >
                        {actionLoading === r.id + "-approve" ? (
                          <i className="ti ti-loader" />
                        ) : (
                          <i className="ti ti-check" />
                        )}
                        Approve
                      </button>
                      <button
                        className="btn-action reject"
                        disabled={!!actionLoading}
                        onClick={() => openRejectModal(r.id)}
                      >
                        {actionLoading === r.id + "-reject" ? (
                          <i className="ti ti-loader" />
                        ) : (
                          <i className="ti ti-x" />
                        )}
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <i className="ti ti-x" />
            </button>
            <h2>Host Request Details</h2>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <tbody>
                <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", color: "#9ca3af", width: 140 }}>Full Name</td>
                  <td style={{ padding: "8px 0" }}>{selected.user_name || selected.full_name || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", color: "#9ca3af" }}>Email</td>
                  <td style={{ padding: "8px 0" }}>{selected.user_email || selected.email || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", color: "#9ca3af" }}>Phone Number</td>
                  <td style={{ padding: "8px 0" }}>{selected.phone_number || selected.phone || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", color: "#9ca3af" }}>CNIC Number</td>
                  <td style={{ padding: "8px 0" }}>{selected.cnic_number || "—"}</td>
                </tr>
                <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 0", color: "#9ca3af" }}>Submitted Date</td>
                  <td style={{ padding: "8px 0" }}>
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
                {selected.additional_info && (
                  <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0", color: "#9ca3af" }}>Additional Info</td>
                    <td style={{ padding: "8px 0" }}>{selected.additional_info}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button 
                className="btn-action approve" 
                onClick={() => { handleApprove(selected.id); setSelected(null); }}
              >
                <i className="ti ti-check" /> Approve
              </button>
              <button 
                className="btn-action reject" 
                onClick={() => { openRejectModal(selected.id); setSelected(null); }}
              >
                <i className="ti ti-x" /> Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <button className="modal-close" onClick={() => setShowRejectModal(false)}>
              <i className="ti ti-x" />
            </button>
            <h2>Reject Host Request</h2>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Please provide a reason for rejecting this host request. This will be shared with the applicant.
            </p>
            <div className="form-group">
              <label htmlFor="reject-reason">Rejection Reason <span className="required">*</span></label>
              <textarea
                id="reject-reason"
                className="reject-textarea"
                rows="4"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Invalid CNIC document, Incomplete information, etc."
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button 
                className="btn-action cancel"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-action reject"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}