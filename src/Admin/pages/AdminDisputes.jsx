// src/Admin/pages/AdminDisputes.jsx
import { useState, useEffect } from "react";
import {
    adminGetAllDisputes,
    adminResolveDispute,
    adminRejectDispute,
    adminGetDisputeById
} from "../services/admin.service";
import "../styles/AdminDisputes.css";
export default function AdminDisputes() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchDisputes();
    }, [statusFilter]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = await adminGetAllDisputes(statusFilter);
            // Handle different response structures
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

    const handleResolve = async (disputeId) => {
        const notes = prompt("Enter resolution notes (optional):");
        if (notes === null) return;

        try {
            setActionLoading(true);
            await adminResolveDispute(disputeId, notes || "");
            await fetchDisputes();
            alert("Dispute resolved successfully!");
        } catch (err) {
            alert(err.message || "Failed to resolve dispute");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (disputeId) => {
        const reason = prompt("Enter rejection reason:");
        if (reason === null) return;

        try {
            setActionLoading(true);
            await adminRejectDispute(disputeId, reason || "No reason provided");
            await fetchDisputes();
            alert("Dispute rejected successfully!");
        } catch (err) {
            alert(err.message || "Failed to reject dispute");
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewDetails = async (dispute) => {
        try {
            setLoading(true);
            const response = await adminGetDisputeById(dispute.id);
            const disputeData = response.dispute || response.data || response;
            setSelectedDispute(disputeData);
            setShowModal(true);
        } catch (err) {
            // Fallback to the data we already have
            setSelectedDispute(dispute);
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: "status-pending",
            in_progress: "status-progress",
            resolved: "status-resolved",
            rejected: "status-rejected"
        };
        return colors[status?.toLowerCase()] || "status-default";
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: "ti-timer",
            in_progress: "ti-loader",
            resolved: "ti-check-circle",
            rejected: "ti-x-circle"
        };
        return icons[status?.toLowerCase()] || "ti-circle";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusCount = (status) => {
        return disputes.filter(d => d.status?.toLowerCase() === status).length;
    };

    if (loading && disputes.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading disputes...</p>
            </div>
        );
    }

    return (
        <div className="admin-page disputes-page">
            <div className="page-header">
                <div className="header-left">
                    <h1>
                        <i className="ti ti-alert-circle" />
                        Disputes Management
                    </h1>
                    <span className="total-count">{disputes.length} Total</span>
                </div>

                <div className="header-right">
                    <div className="filter-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button className="btn-refresh" onClick={fetchDisputes}>
                            <i className="ti ti-refresh" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon pending-icon">
                        <i className="ti ti-timer" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{getStatusCount('pending')}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon progress-icon">
                        <i className="ti ti-loader" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{getStatusCount('in_progress')}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon resolved-icon">
                        <i className="ti ti-check-circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{getStatusCount('resolved')}</span>
                        <span className="stat-label">Resolved</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon rejected-icon">
                        <i className="ti ti-x-circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-number">{getStatusCount('rejected')}</span>
                        <span className="stat-label">Rejected</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <i className="ti ti-alert-circle" />
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="table-container">
                {disputes.length === 0 ? (
                    <div className="empty-state">
                        <i className="ti ti-alert-circle" />
                        <h3>No disputes found</h3>
                        <p>{statusFilter ? `No ${statusFilter} disputes available` : "All disputes are resolved"}</p>
                    </div>
                ) : (
                    <table className="disputes-table">
                        <thead>
                            <tr>
                                {/* <th>ID</th> */}
                                <th>Booking Ref</th>
                                <th>Raised By</th>
                                <th>Reason</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {disputes.map((dispute) => (
                                <tr key={dispute.id}>
                                    {/* <td>
                                        <span className="dispute-id">#{dispute.id}</span>
                                    </td> */}
                                    <td>
                                        <span className="booking-ref">
                                            {dispute.booking?.booking_ref || dispute.booking_ref || "N/A"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="user-info">
                                            <span className="user-name">
                                                {dispute.raised_by_user?.full_name || dispute.raised_by || "N/A"}
                                            </span>
                                            <span className="user-email">
                                                {dispute.raised_by_user?.email || ""}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="reason-cell">
                                            <span className="reason-text">{dispute.reason || "N/A"}</span>
                                            {dispute.description && (
                                                <span className="reason-description">{dispute.description}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {dispute.amount ? (
                                            <span className="amount">${parseFloat(dispute.amount).toFixed(2)}</span>
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(dispute.status)}`}>
                                            <i className={`ti ${getStatusIcon(dispute.status)}`} />
                                            {dispute.status || "Unknown"}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="date-time">{formatDate(dispute.created_at)}</span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={() => handleViewDetails(dispute)}
                                                title="View Details"
                                            >
                                                <i className="ti ti-eye" />
                                            </button>

                                            {dispute.status?.toLowerCase() === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn-resolve"
                                                        onClick={() => handleResolve(dispute.id)}
                                                        disabled={actionLoading}
                                                        title="Resolve Dispute"
                                                    >
                                                        <i className="ti ti-check" />
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => handleReject(dispute.id)}
                                                        disabled={actionLoading}
                                                        title="Reject Dispute"
                                                    >
                                                        <i className="ti ti-x" />
                                                    </button>
                                                </>
                                            )}

                                            {dispute.status?.toLowerCase() === 'in_progress' && (
                                                <button
                                                    className="btn-review"
                                                    onClick={() => handleViewDetails(dispute)}
                                                    title="Review"
                                                >
                                                    <i className="ti ti-edit" />
                                                </button>
                                            )}

                                            {dispute.resolved_by_user && (
                                                <span className="resolved-by" title={`Resolved by ${dispute.resolved_by_user.full_name}`}>
                                                    <i className="ti ti-user-check" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedDispute && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <i className="ti ti-file-description" />
                                Dispute Details #{selectedDispute.id}
                            </h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="ti ti-x" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Booking Reference</label>
                                    <p>{selectedDispute.booking?.booking_ref || selectedDispute.booking_ref || "N/A"}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Booking Status</label>
                                    <p>{selectedDispute.booking?.status || "N/A"}</p>
                                </div>
                                <div className="detail-item">
                                    <label>Raised By</label>
                                    <p>{selectedDispute.raised_by_user?.full_name || selectedDispute.raised_by || "N/A"}</p>
                                    <small>{selectedDispute.raised_by_user?.email || ""}</small>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span className={`status-badge ${getStatusColor(selectedDispute.status)}`}>
                                        <i className={`ti ${getStatusIcon(selectedDispute.status)}`} />
                                        {selectedDispute.status || "Unknown"}
                                    </span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Reason</label>
                                    <p className="reason-full">{selectedDispute.reason || "N/A"}</p>
                                </div>
                                {selectedDispute.description && (
                                    <div className="detail-item full-width">
                                        <label>Description</label>
                                        <p className="description-full">{selectedDispute.description}</p>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <label>Amount</label>
                                    <p className="amount-display">
                                        ${selectedDispute.amount ? parseFloat(selectedDispute.amount).toFixed(2) : "0.00"}
                                    </p>
                                </div>
                                <div className="detail-item">
                                    <label>Created At</label>
                                    <p>{formatDate(selectedDispute.created_at)}</p>
                                </div>
                                {selectedDispute.resolved_at && (
                                    <div className="detail-item">
                                        <label>Resolved At</label>
                                        <p>{formatDate(selectedDispute.resolved_at)}</p>
                                    </div>
                                )}
                                {selectedDispute.resolved_by_user && (
                                    <div className="detail-item">
                                        <label>Resolved By</label>
                                        <p>{selectedDispute.resolved_by_user.full_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {selectedDispute.status?.toLowerCase() === 'pending' && (
                                <>
                                    <button
                                        className="btn-resolve-modal"
                                        onClick={() => {
                                            handleResolve(selectedDispute.id);
                                            setShowModal(false);
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <i className="ti ti-check" />
                                        Resolve Dispute
                                    </button>
                                    <button
                                        className="btn-reject-modal"
                                        onClick={() => {
                                            handleReject(selectedDispute.id);
                                            setShowModal(false);
                                        }}
                                        disabled={actionLoading}
                                    >
                                        <i className="ti ti-x" />
                                        Reject Dispute
                                    </button>
                                </>
                            )}
                            <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}