import { useEffect, useState } from "react";
import {
  adminGetPendingHosts,
  adminApproveHost,
  adminRejectHost,
} from "../services/admin.service";
import "../styles/AdminLayout.css";

export default function AdminHostRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setAL] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => {
    setLoading(true);
    adminGetPendingHosts()
      .then((d) => {
        console.log('📦 Raw response:', d);
        // Handle different response formats
        let requestsData = [];
        if (Array.isArray(d)) {
          requestsData = d;
        } else if (d && typeof d === 'object') {
          if (d.requests && Array.isArray(d.requests)) {
            requestsData = d.requests;
          } else if (d.data && Array.isArray(d.data)) {
            requestsData = d.data;
          }
        }
        console.log('✅ Processed requests:', requestsData);
        setRequests(requestsData);
      })
      .catch((e) => {
        console.error('❌ Error loading requests:', e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id) => {
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

  const handleImageError = (requestId, imageType) => {
    setImageErrors(prev => ({
      ...prev,
      [`${requestId}-${imageType}`]: true
    }));
  };

  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    // If it's already a data URL or HTTP URL, return as is
    if (imageData.startsWith('data:') || imageData.startsWith('http')) {
      return imageData;
    }
    // If it's a file path, prepend the base URL
    return `https://v1.api.co-zones.com/uploads/${imageData}`;
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
            color: toast.type === "error" ? "#991b1b" : "#065f46",
            padding: "12px 18px",
            borderRadius: 8,
            fontSize: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            maxWidth: "400px",
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
                <th>CNIC Images</th>
                <th>Submitted</th>
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
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {r.cnic_front_image ? (
                        <img
                          src={getImageUrl(r.cnic_front_image)}
                          alt="CNIC Front"
                          style={{
                            width: 40,
                            height: 30,
                            objectFit: "cover",
                            borderRadius: 4,
                            cursor: "pointer",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb"
                          }}
                          onClick={() => setSelected(r)}
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='30'%3E%3Crect width='40' height='30' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='8'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : "—"}
                      {r.cnic_back_image && (
                        <img
                          src={getImageUrl(r.cnic_back_image)}
                          alt="CNIC Back"
                          style={{
                            width: 40,
                            height: 30,
                            objectFit: "cover",
                            borderRadius: 4,
                            cursor: "pointer",
                            border: "1px solid #e5e7eb",
                            background: "#f9fafb"
                          }}
                          onClick={() => setSelected(r)}
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='30'%3E%3Crect width='40' height='30' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='8'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "#9ca3af" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-action view"
                        onClick={() => setSelected(r)}
                      >
                        <i className="ti ti-eye" /> View
                      </button>
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

      {/* Detail Modal with Images */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "650px" }}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              <i className="ti ti-x" />
            </button>
            <h2 style={{ marginBottom: 16 }}>Host Request Details</h2>

            {/* User Information */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Applicant Information</h3>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0", color: "#9ca3af", width: 140 }}>Full Name</td>
                    <td style={{ padding: "8px 0", fontWeight: 500 }}>
                      {selected.user_name || selected.full_name || "—"}
                    </td>
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
                    <td style={{ padding: "8px 0", fontFamily: "monospace" }}>
                      {selected.cnic_number || "—"}
                    </td>
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
            </div>

            {/* CNIC Images Section */}
            {(selected.cnic_front_image || selected.cnic_back_image) && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>CNIC Documents</h3>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {selected.cnic_front_image && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        <i className="ti ti-id" /> Front Side
                      </div>
                      <img
                        src={getImageUrl(selected.cnic_front_image)}
                        alt="CNIC Front"
                        style={{
                          width: "100%",
                          maxHeight: 250,
                          objectFit: "contain",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          padding: 8,
                          background: "#f9fafb"
                        }}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  )}
                  {selected.cnic_back_image && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        <i className="ti ti-id" /> Back Side
                      </div>
                      <img
                        src={getImageUrl(selected.cnic_back_image)}
                        alt="CNIC Back"
                        style={{
                          width: "100%",
                          maxHeight: 250,
                          objectFit: "contain",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          padding: 8,
                          background: "#f9fafb"
                        }}
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #f3f4f6", paddingTop: 16 }}>
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
            <h2 style={{ marginBottom: 8 }}>Reject Host Request</h2>
            <p style={{ marginBottom: "16px", color: "#666", fontSize: 14 }}>
              Please provide a reason for rejecting this host request. This will be shared with the applicant.
            </p>
            <div className="form-group">
              <label htmlFor="reject-reason" style={{ fontWeight: 500 }}>
                Rejection Reason <span className="required" style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                id="reject-reason"
                className="reject-textarea"
                rows="4"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Invalid CNIC document, Incomplete information, etc."
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 14,
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                className="btn-action cancel"
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: "8px 16px",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                className="btn-action reject"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                style={{
                  padding: "8px 16px",
                  background: !rejectReason.trim() ? "#9ca3af" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: !rejectReason.trim() ? "not-allowed" : "pointer",
                  fontSize: 14
                }}
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