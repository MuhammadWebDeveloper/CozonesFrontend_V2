import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    adminGetAllDisputes,
    adminResolveDispute,
    adminRejectDispute,
    adminGetDisputeById,
    adminDeleteDispute
} from "../services/admin.service";
import "../styles/AdminDisputes.css";

// Import React Icons
import {
    FiAlertCircle,
    FiRefreshCw,
    FiClock,
    FiLoader,
    FiCheckCircle,
    FiXCircle,
    FiEye,
    FiCheck,
    FiX,
    FiTrash2,
    FiInbox,
    FiFileText
} from "react-icons/fi";

export default function AdminDisputes() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionComment, setActionComment] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [validationError, setValidationError] = useState("");

    useEffect(() => {
        fetchDisputes();
    }, [statusFilter]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = await adminGetAllDisputes(statusFilter);
            const disputesData = response.disputes || response.data || response;
            setDisputes(Array.isArray(disputesData) ? disputesData : []);
            setError(null);
        } catch (err) {
            setError(err.message || "Failed to fetch disputes");
            setDisputes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (dispute) => {
        try {
            setActionLoading(true);
            const response = await adminGetDisputeById(dispute.id);
            const disputeData = response.dispute || response.data || response;
            setSelectedDispute(disputeData);
        } catch {
            setSelectedDispute(dispute);
            toast.warning('Could not load full details. Using available data.');
        } finally {
            setActionLoading(false);
            setActionComment("");
            setValidationError("");
            setShowModal(true);
        }
    };

    const handleResolve = async (disputeId) => {
        if (!actionComment || actionComment.trim() === "") {
            setValidationError("Please provide a resolution comment");
            return;
        }

        try {
            setActionLoading(true);
            setValidationError("");
            await adminResolveDispute(disputeId, actionComment.trim());
            toast.success('✅ Dispute resolved successfully');
            await fetchDisputes();
            closeModal();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to resolve dispute";
            setError(errorMsg);
            toast.error(errorMsg);
            if (err.response?.data?.message?.includes("Resolution")) {
                setValidationError(err.response.data.message);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (disputeId) => {
        if (!actionComment || actionComment.trim() === "") {
            setValidationError("Please provide a rejection reason");
            return;
        }

        try {
            setActionLoading(true);
            setValidationError("");
            await adminRejectDispute(disputeId, actionComment.trim());
            toast.success('❌ Dispute rejected successfully');
            await fetchDisputes();
            closeModal();
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to reject dispute";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteDispute = async (disputeId) => {
        if (!window.confirm('⚠️ Are you sure you want to permanently delete this dispute?\n\nThis action cannot be undone!')) {
            return;
        }

        try {
            setActionLoading(true);
            await adminDeleteDispute(disputeId);
            toast.success('🗑️ Dispute deleted successfully');
            await fetchDisputes();
            closeModal();
        } catch (err) {
            const errorMsg = err.message || "Failed to delete dispute";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedDispute(null);
        setActionComment("");
        setValidationError("");
    };

    const getStatusBadgeClass = (status) => {
        const map = {
            open: "admin-badge-open",
            pending: "admin-badge-pending",
            in_progress: "admin-badge-progress",
            resolved: "admin-badge-resolved",
            rejected: "admin-badge-rejected",
        };
        return map[status?.toLowerCase()] || "admin-badge-default";
    };

    const getStatusIcon = (status) => {
        const map = {
            open: <FiClock size={14} />,
            pending: <FiClock size={14} />,
            in_progress: <FiLoader size={14} className="admin-spinning" />,
            resolved: <FiCheckCircle size={14} />,
            rejected: <FiXCircle size={14} />,
        };
        return map[status?.toLowerCase()] || <FiClock size={14} />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusCount = (status) =>
        disputes.filter((d) => d.status?.toLowerCase() === status).length;

    const isPending = (status) =>
        status?.toLowerCase() === "pending" || status?.toLowerCase() === "open";

    if (loading && disputes.length === 0) {
        return (
            <div className="admin-disputes-loading">
                <div className="admin-spinner" />
                <p>Loading disputes…</p>
            </div>
        );
    }

    return (
        <div className="admin-disputes-page">
            {/* Header */}
            <div className="admin-disputes-header">
                <div className="admin-disputes-header-left">
                    <FiAlertCircle size={24} color="#e53e3e" />
                    <h1>Disputes</h1>
                    <span className="admin-disputes-count-pill">{disputes.length} total</span>
                </div>
                <div className="admin-disputes-header-right">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="admin-disputes-filter-select"
                    >
                        <option value="">All status</option>
                        <option value="pending">Pending</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        className="admin-disputes-btn-icon"
                        onClick={fetchDisputes}
                        aria-label="Refresh"
                        disabled={loading}
                    >
                        <FiRefreshCw size={18} className={loading ? "admin-spinning" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="admin-disputes-stats">
                {[
                    { key: "open", label: "Open", icon: <FiClock size={20} />, cls: "admin-stat-open" },
                    { key: "in_progress", label: "In progress", icon: <FiLoader size={20} />, cls: "admin-stat-progress" },
                    { key: "resolved", label: "Resolved", icon: <FiCheckCircle size={20} />, cls: "admin-stat-resolved" },
                    { key: "rejected", label: "Rejected", icon: <FiXCircle size={20} />, cls: "admin-stat-rejected" },
                ].map(({ key, label, icon, cls }) => (
                    <div className="admin-disputes-stat-card" key={key}>
                        <div className={`admin-disputes-stat-icon ${cls}`}>
                            {icon}
                        </div>
                        <div className="admin-disputes-stat-info">
                            <span className="admin-disputes-stat-num">
                                {key === "open"
                                    ? disputes.filter((d) => isPending(d.status)).length
                                    : getStatusCount(key)}
                            </span>
                            <span className="admin-disputes-stat-label">{label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error banner */}
            {error && (
                <div className="admin-disputes-error-banner">
                    <FiAlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} aria-label="Dismiss">
                        <FiX size={18} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="admin-disputes-table-card">
                {disputes.length === 0 ? (
                    <div className="admin-disputes-empty">
                        <FiInbox size={48} color="#a0aec0" />
                        <h3>No disputes found</h3>
                        <p>
                            {statusFilter
                                ? `No ${statusFilter} disputes at the moment`
                                : "All disputes are resolved"}
                        </p>
                    </div>
                ) : (
                    <table className="admin-disputes-table">
                        <colgroup>
                            <col style={{ width: "130px" }} />
                            <col style={{ width: "180px" }} />
                            <col />
                            <col style={{ width: "110px" }} />
                            <col style={{ width: "110px" }} />
                            <col style={{ width: "140px" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Booking ref</th>
                                <th>Raised by</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {disputes.map((dispute) => (
                                <tr key={dispute.id}>
                                    <td>
                                        <span className="admin-disputes-booking-ref">
                                            {dispute.booking?.booking_ref ||
                                                dispute.booking_ref ||
                                                "—"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="admin-disputes-user-name">
                                            {dispute.raised_by_user?.full_name ||
                                                dispute.raised_by ||
                                                "Unknown"}
                                        </span>
                                        <span className="admin-disputes-user-email">
                                            {dispute.raised_by_user?.email || ""}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="admin-disputes-reason-text">
                                            {dispute.reason || "—"}
                                        </span>
                                        {dispute.description && (
                                            <span className="admin-disputes-reason-desc">
                                                {dispute.description}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            className={`admin-disputes-badge ${getStatusBadgeClass(
                                                dispute.status
                                            )}`}
                                        >
                                            {getStatusIcon(dispute.status)}
                                            {dispute.status || "Unknown"}
                                        </span>
                                    </td>
                                    <td className="admin-disputes-date">
                                        {formatDate(dispute.created_at)}
                                    </td>
                                    <td>
                                        <div className="admin-disputes-row-actions">
                                            <button
                                                className="admin-disputes-act-btn"
                                                onClick={() => handleViewDetails(dispute)}
                                                title="View details"
                                                aria-label="View dispute details"
                                            >
                                                <FiEye size={16} />
                                            </button>
                                            {isPending(dispute.status) && (
                                                <>
                                                    <button
                                                        className="admin-disputes-act-btn admin-disputes-resolve"
                                                        onClick={() => handleViewDetails(dispute)}
                                                        title="Resolve"
                                                        aria-label="Resolve dispute"
                                                        disabled={actionLoading}
                                                    >
                                                        <FiCheck size={16} />
                                                    </button>
                                                    <button
                                                        className="admin-disputes-act-btn admin-disputes-reject"
                                                        onClick={() => handleViewDetails(dispute)}
                                                        title="Reject"
                                                        aria-label="Reject dispute"
                                                        disabled={actionLoading}
                                                    >
                                                        <FiX size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="admin-disputes-act-btn admin-disputes-delete"
                                                onClick={() => {
                                                    if (window.confirm('⚠️ Delete this dispute permanently?')) {
                                                        handleDeleteDispute(dispute.id);
                                                    }
                                                }}
                                                title="Delete dispute"
                                                aria-label="Delete dispute"
                                                disabled={actionLoading}
                                                style={{
                                                    background: '#fee2e2',
                                                    color: '#dc2626'
                                                }}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail + Action Modal */}
            {showModal && selectedDispute && (
                <div
                    className="admin-disputes-modal-overlay"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-modal-title"
                >
                    <div
                        className="admin-disputes-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-disputes-modal-head">
                            <h2 id="admin-modal-title">
                                <FiFileText size={20} />
                                Dispute details
                            </h2>
                            <button
                                className="admin-disputes-modal-close"
                                onClick={closeModal}
                                aria-label="Close"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="admin-disputes-modal-body">
                            <div className="admin-disputes-detail-grid">
                                <div className="admin-disputes-detail-item">
                                    <label>Booking ref</label>
                                    <p className="admin-disputes-booking-ref">
                                        {selectedDispute.booking?.booking_ref ||
                                            selectedDispute.booking_ref ||
                                            "—"}
                                    </p>
                                </div>
                                <div className="admin-disputes-detail-item">
                                    <label>Booking status</label>
                                    <p>{selectedDispute.booking?.status || "—"}</p>
                                </div>
                                <div className="admin-disputes-detail-item">
                                    <label>Raised by</label>
                                    <p>
                                        {selectedDispute.raised_by_user?.full_name ||
                                            selectedDispute.raised_by ||
                                            "Unknown"}
                                    </p>
                                    {selectedDispute.raised_by_user?.email && (
                                        <small>{selectedDispute.raised_by_user.email}</small>
                                    )}
                                </div>
                                <div className="admin-disputes-detail-item">
                                    <label>Status</label>
                                    <span
                                        className={`admin-disputes-badge ${getStatusBadgeClass(
                                            selectedDispute.status
                                        )}`}
                                    >
                                        {getStatusIcon(selectedDispute.status)}
                                        {selectedDispute.status || "Unknown"}
                                    </span>
                                </div>
                                <div className="admin-disputes-detail-item admin-disputes-full-width">
                                    <label>Reason</label>
                                    <p>{selectedDispute.reason || "—"}</p>
                                </div>
                                {selectedDispute.description && (
                                    <div className="admin-disputes-detail-item admin-disputes-full-width">
                                        <label>Description</label>
                                        <p>{selectedDispute.description}</p>
                                    </div>
                                )}
                                <div className="admin-disputes-detail-item">
                                    <label>Created</label>
                                    <p>{formatDateTime(selectedDispute.created_at)}</p>
                                </div>
                                {selectedDispute.resolution && (
                                    <div className="admin-disputes-detail-item admin-disputes-full-width">
                                        <label>Resolution / Decision</label>
                                        <p style={{
                                            background: selectedDispute.status?.toLowerCase() === 'rejected'
                                                ? '#fee2e2'
                                                : '#f0fdf4',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            borderLeft: `3px solid ${selectedDispute.status?.toLowerCase() === 'rejected'
                                                ? '#e53e3e'
                                                : '#22c55e'}`
                                        }}>
                                            {selectedDispute.resolution}
                                        </p>
                                    </div>
                                )}
                                {selectedDispute.resolved_by_user && (
                                    <div className="admin-disputes-detail-item">
                                        <label>Resolved by</label>
                                        <p>{selectedDispute.resolved_by_user.full_name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action area — only shown for pending/open disputes */}
                            {isPending(selectedDispute.status) && (
                                <div className="admin-disputes-action-area">
                                    <label htmlFor="admin-action-comment">
                                        {selectedDispute.status?.toLowerCase() === 'pending' || selectedDispute.status?.toLowerCase() === 'open'
                                            ? 'Resolution / Decision'
                                            : 'Comment'}{" "}
                                        <span className="admin-disputes-required">*</span>
                                        <span className="admin-disputes-optional">(required)</span>
                                    </label>
                                    <textarea
                                        id="admin-action-comment"
                                        rows={3}
                                        value={actionComment}
                                        onChange={(e) => {
                                            setActionComment(e.target.value);
                                            setValidationError("");
                                        }}
                                        placeholder="Please provide a resolution, decision, or rejection reason for this dispute..."
                                        className={validationError ? "admin-disputes-textarea-error" : ""}
                                    />
                                    {validationError && (
                                        <div className="admin-disputes-validation-error">
                                            <FiAlertCircle size={16} />
                                            {validationError}
                                        </div>
                                    )}
                                    <div className="admin-disputes-action-buttons">
                                        <button
                                            className="admin-disputes-btn-resolve"
                                            onClick={() => handleResolve(selectedDispute.id)}
                                            disabled={actionLoading}
                                        >
                                            <FiCheck size={16} />
                                            {actionLoading ? "Resolving…" : "Mark resolved"}
                                        </button>
                                        <button
                                            className="admin-disputes-btn-reject"
                                            onClick={() => handleReject(selectedDispute.id)}
                                            disabled={actionLoading}
                                        >
                                            <FiX size={16} />
                                            {actionLoading ? "Rejecting…" : "Reject"}
                                        </button>
                                        <button
                                            className="admin-disputes-btn-delete"
                                            onClick={() => handleDeleteDispute(selectedDispute.id)}
                                            disabled={actionLoading}
                                            style={{
                                                background: '#dc2626',
                                                color: 'white',
                                                padding: '8px 20px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = '#b91c1c';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = '#dc2626';
                                            }}
                                        >
                                            <FiTrash2 size={16} />
                                            {actionLoading ? "Deleting…" : "Delete Permanently"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Show resolution for resolved/rejected disputes */}
                            {!isPending(selectedDispute.status) && selectedDispute.resolution && (
                                <div className="admin-disputes-resolution-display">
                                    <label>Resolution / Decision</label>
                                    <div style={{
                                        background: selectedDispute.status?.toLowerCase() === 'rejected'
                                            ? '#fee2e2'
                                            : '#f0fdf4',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        borderLeft: `4px solid ${selectedDispute.status?.toLowerCase() === 'rejected'
                                            ? '#e53e3e'
                                            : '#22c55e'}`
                                    }}>
                                        <p style={{ margin: 0 }}>{selectedDispute.resolution}</p>
                                        {selectedDispute.resolved_by_user && (
                                            <p style={{
                                                margin: '8px 0 0 0',
                                                fontSize: '12px',
                                                color: '#6b7280'
                                            }}>
                                                Resolved by: {selectedDispute.resolved_by_user.full_name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="admin-disputes-modal-foot">
                            <button className="admin-disputes-btn-close" onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}