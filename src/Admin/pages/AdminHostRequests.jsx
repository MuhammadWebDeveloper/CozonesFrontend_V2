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
  const [imageModal, setImageModal] = useState(null); // { url, label, type }

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => {
    setLoading(true);
    adminGetPendingHosts()
      .then((d) => {
        console.log('📦 Full API Response:', d);

        if (d.requests && d.requests.length > 0) {
          const firstRequest = d.requests[0];
          console.log('🔍 First request data:', {
            id: firstRequest.id,
            has_front_image: !!firstRequest.cnic_front_image,
            has_back_image: !!firstRequest.cnic_back_image,
            front_image_length: firstRequest.cnic_front_image?.length,
            back_image_length: firstRequest.cnic_back_image?.length,
          });
        }

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

        console.log('✅ Processed requests count:', requestsData.length);
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

  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    if (imageData.startsWith('data:') || imageData.startsWith('http')) {
      return imageData;
    }
    return `https://v1.api.co-zones.com/uploads/${imageData}`;
  };

  const openImageModal = (imageData, label) => {
    const url = getImageUrl(imageData);
    if (url) {
      setImageModal({ url, label });
      document.body.style.overflow = 'hidden';
    }
  };

  const closeImageModal = () => {
    setImageModal(null);
    document.body.style.overflow = 'unset';
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeImageModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

      {/* LARGE IMAGE MODAL - Full Screen Viewer */}
      {imageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.92)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={closeImageModal}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "95vw",
              maxHeight: "95vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: "-60px",
                right: "-10px",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                color: "white",
                fontSize: "16px",
                cursor: "pointer",
                padding: "10px 24px",
                borderRadius: "8px",
                transition: "all 0.3s",
                backdropFilter: "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(255,0,0,0.3)";
                e.target.style.borderColor = "rgba(255,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.15)";
                e.target.style.borderColor = "rgba(255,255,255,0.3)";
              }}
            >
              ✕ Close Image
            </button>

            {/* Image Label */}
            <div
              style={{
                color: "white",
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "16px",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                background: "rgba(0,0,0,0.4)",
                padding: "8px 24px",
                borderRadius: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              {imageModal.label || "CNIC Document"}
            </div>

            {/* Image Container with Zoom */}
            <div
              style={{
                width: "100%",
                height: "80vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                padding: "10px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={imageModal.url}
                alt={imageModal.label || "Full size image"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                  background: "#1a1a1a",
                  userSelect: "none",
                }}
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='400'%3E%3Crect width='500' height='400' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='20'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>

            {/* Instructions */}
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                marginTop: "16px",
                textAlign: "center",
                background: "rgba(0,0,0,0.3)",
                padding: "8px 20px",
                borderRadius: "6px",
                backdropFilter: "blur(10px)",
              }}
            >
              💡 Click outside image or press <kbd style={{ background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "4px" }}>ESC</kbd> to close • Image is fully zoomable
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

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
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ minWidth: "900px" }}>
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
                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        {r.cnic_front_image ? (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: "600", marginBottom: 4 }}>📄 FRONT</div>
                            <img
                              src={getImageUrl(r.cnic_front_image)}
                              alt="CNIC Front"
                              style={{
                                width: 120,
                                height: 90,
                                objectFit: "contain",
                                borderRadius: 6,
                                cursor: "pointer",
                                border: "3px solid #3b82f6",
                                background: "#f9fafb",
                                transition: "transform 0.2s, box-shadow 0.2s",
                              }}
                              onClick={() => openImageModal(r.cnic_front_image, "CNIC - Front Side")}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow = "none";
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='90'%3E%3Crect width='120' height='90' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <button
                              onClick={() => openImageModal(r.cnic_front_image, "CNIC - Front Side")}
                              style={{
                                marginTop: 4,
                                padding: "4px 16px",
                                background: "#3b82f6",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.target.style.background = "#2563eb"}
                              onMouseLeave={(e) => e.target.style.background = "#3b82f6"}
                            >
                              🔍 View Full
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                        )}
                        {r.cnic_back_image && (
                          <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: "600", marginBottom: 4 }}>📄 BACK</div>
                            <img
                              src={getImageUrl(r.cnic_back_image)}
                              alt="CNIC Back"
                              style={{
                                width: 120,
                                height: 90,
                                objectFit: "contain",
                                borderRadius: 6,
                                cursor: "pointer",
                                border: "3px solid #8b5cf6",
                                background: "#f9fafb",
                                transition: "transform 0.2s, box-shadow 0.2s",
                              }}
                              onClick={() => openImageModal(r.cnic_back_image, "CNIC - Back Side")}
                              onMouseEnter={(e) => {
                                e.target.style.transform = "scale(1.05)";
                                e.target.style.boxShadow = "0 4px 16px rgba(139, 92, 246, 0.4)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = "scale(1)";
                                e.target.style.boxShadow = "none";
                              }}
                              onError={(e) => {
                                e.target.src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='90'%3E%3Crect width='120' height='90' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            <button
                              onClick={() => openImageModal(r.cnic_back_image, "CNIC - Back Side")}
                              style={{
                                marginTop: 4,
                                padding: "4px 16px",
                                background: "#8b5cf6",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                fontSize: 12,
                                cursor: "pointer",
                                fontWeight: "500",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => e.target.style.background = "#7c3aed"}
                              onMouseLeave={(e) => e.target.style.background = "#8b5cf6"}
                            >
                              🔍 View Full
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "#9ca3af" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn-action view"
                          onClick={() => setSelected(r)}
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          <i className="ti ti-eye" /> View
                        </button>
                        <button
                          className="btn-action approve"
                          disabled={!!actionLoading}
                          onClick={() => handleApprove(r.id)}
                          style={{ padding: "4px 10px", fontSize: 12 }}
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
                          style={{ padding: "4px 10px", fontSize: 12 }}
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
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "850px", maxHeight: "95vh", overflow: "auto" }}>
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

            {/* CNIC Images Section - Large Preview */}
            {(selected.cnic_front_image || selected.cnic_back_image) && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>CNIC Documents</h3>
                <div style={{ display: "flex", gap: 30, flexWrap: "wrap", justifyContent: "center" }}>
                  {selected.cnic_front_image && (
                    <div style={{ flex: 1, minWidth: 300, maxWidth: 500 }}>
                      <div style={{
                        fontSize: 14,
                        color: "#3b82f6",
                        fontWeight: "600",
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>📄 Front Side</span>
                        <button
                          onClick={() => openImageModal(selected.cnic_front_image, "CNIC - Front Side")}
                          style={{
                            padding: "6px 20px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#2563eb"}
                          onMouseLeave={(e) => e.target.style.background = "#3b82f6"}
                        >
                          🔍 View Full Size
                        </button>
                      </div>
                      <img
                        src={getImageUrl(selected.cnic_front_image)}
                        alt="CNIC Front"
                        style={{
                          width: "100%",
                          maxHeight: 500,
                          objectFit: "contain",
                          border: "2px solid #3b82f6",
                          borderRadius: 8,
                          padding: 10,
                          background: "#f9fafb",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onClick={() => openImageModal(selected.cnic_front_image, "CNIC - Front Side")}
                        onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  )}
                  {selected.cnic_back_image && (
                    <div style={{ flex: 1, minWidth: 300, maxWidth: 500 }}>
                      <div style={{
                        fontSize: 14,
                        color: "#8b5cf6",
                        fontWeight: "600",
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>📄 Back Side</span>
                        <button
                          onClick={() => openImageModal(selected.cnic_back_image, "CNIC - Back Side")}
                          style={{
                            padding: "6px 20px",
                            background: "#8b5cf6",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 13,
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.background = "#7c3aed"}
                          onMouseLeave={(e) => e.target.style.background = "#8b5cf6"}
                        >
                          🔍 View Full Size
                        </button>
                      </div>
                      <img
                        src={getImageUrl(selected.cnic_back_image)}
                        alt="CNIC Back"
                        style={{
                          width: "100%",
                          maxHeight: 500,
                          objectFit: "contain",
                          border: "2px solid #8b5cf6",
                          borderRadius: 8,
                          padding: 10,
                          background: "#f9fafb",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        onClick={() => openImageModal(selected.cnic_back_image, "CNIC - Back Side")}
                        onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
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
                  fontFamily: "inherit",
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
                  fontSize: 14,
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
                  fontSize: 14,
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