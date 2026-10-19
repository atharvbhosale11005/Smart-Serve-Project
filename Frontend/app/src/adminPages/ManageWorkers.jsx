import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminWorkers,
  updateWorkerApproval,
  updateWorkerStatus
} from "../Services/adminService";
import "./ManageWorkers.css";

/* ===== Embedded Crisp SVG Icons ===== */
const Icons = {
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Check: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Cross: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Unlock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  Power: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  Refresh: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
};

function ManageWorkers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalTab, setApprovalTab] = useState("ALL");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await getAdminWorkers(token);
      if (response.status === "success") {
        setWorkers(response.data || []);
      } else {
        toast.error(
          response.error || (typeof response.data === "string" ? response.data : "Failed to load workers")
        );
      }
    } catch (error) {
      console.error("LOAD WORKERS ERROR:", error);
      toast.error(error?.response?.data?.error || error?.response?.data?.data || "Unable to load service workers");
    } finally {
      setLoading(false);
    }
  };

  const normalizeCategories = (cats) => {
    if (Array.isArray(cats)) return cats.filter(Boolean);
    if (typeof cats === "string") {
      return cats.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const formatRating = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(1) : "0.0";
  };

  const formatCoord = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(4) : "0.0000";
  };

  const handleUpdateApproval = async (workerId, newStatus) => {
    const actionVerb = newStatus === "APPROVED" ? "approve" : newStatus === "REJECTED" ? "reject" : "reset";
    if (!window.confirm(`Are you sure you want to ${actionVerb} this worker application?`)) return;

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await updateWorkerApproval(workerId, newStatus, token);
      if (res.status === "success") {
        toast.success(`Worker application marked as ${newStatus}`);
        setWorkers((prev) =>
          prev.map((w) => (w.user_id === workerId ? { ...w, approval_status: newStatus } : w))
        );
        if (selectedWorker?.user_id === workerId) {
          setSelectedWorker((prev) => ({ ...prev, approval_status: newStatus }));
        }
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Failed to update approval status"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update approval status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async (worker) => {
    const newBlocked = !worker.is_blocked;
    const confirmMsg = newBlocked
      ? `Block worker ${worker.full_name}? They will not be assigned jobs.`
      : `Unblock worker ${worker.full_name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await updateWorkerStatus(worker.user_id, { isBlocked: newBlocked }, token);
      if (res.status === "success") {
        toast.success(newBlocked ? "Worker blocked successfully" : "Worker unblocked successfully");
        setWorkers((prev) =>
          prev.map((w) => (w.user_id === worker.user_id ? { ...w, is_blocked: newBlocked } : w))
        );
        if (selectedWorker?.user_id === worker.user_id) {
          setSelectedWorker((prev) => ({ ...prev, is_blocked: newBlocked }));
        }
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Action failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update worker account status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (worker) => {
    const newActive = !worker.is_active;
    const actionText = newActive ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${actionText} this worker account?`)) return;

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await updateWorkerStatus(worker.user_id, { isActive: newActive }, token);
      if (res.status === "success") {
        toast.success(`Worker ${actionText}d successfully`);
        setWorkers((prev) =>
          prev.map((w) => (w.user_id === worker.user_id ? { ...w, is_active: newActive } : w))
        );
        if (selectedWorker?.user_id === worker.user_id) {
          setSelectedWorker((prev) => ({ ...prev, is_active: newActive }));
        }
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Action failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update active status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const categoriesStr = normalizeCategories(w.categories).join(" ").toLowerCase();
    const matchesSearch =
      (w.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.phone || "").includes(searchTerm) ||
      (w.primary_city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoriesStr.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (approvalTab === "PENDING") return (w.approval_status || "PENDING") === "PENDING";
    if (approvalTab === "APPROVED") return w.approval_status === "APPROVED";
    if (approvalTab === "REJECTED") return w.approval_status === "REJECTED";
    return true;
  });

  const pendingCount = workers.filter((w) => (w.approval_status || "PENDING") === "PENDING").length;
  const approvedCount = workers.filter((w) => w.approval_status === "APPROVED").length;
  const availableCount = workers.filter((w) => w.is_available && w.approval_status === "APPROVED").length;
  const rejectedCount = workers.filter((w) => w.approval_status === "REJECTED").length;

  const getApprovalBadge = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "APPROVED") return <span className="custom-badge badge-approved">Approved</span>;
    if (s === "PENDING") return <span className="custom-badge badge-pending">Pending Review</span>;
    if (s === "REJECTED") return <span className="custom-badge badge-rejected">Rejected</span>;
    return <span className="custom-badge badge-neutral">{status}</span>;
  };

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          
          {/* Header - Wrap Enabled for Mobile */}
          <div className="page-header d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Service Worker Management & Approvals</h2>
              <p className="text-muted mb-0">
                Review worker applications, verify credentials, manage service skills, and control account status
              </p>
            </div>
            <button className="btn-modern-refresh" onClick={loadWorkers}>
              <Icons.Refresh />
              <span>Refresh Workers</span>
            </button>
          </div>

          {/* Metrics summary: 4-Column Responsive Grid */}
          <div className="metrics-grid mb-4">
            <div className="worker-metric-card" onClick={() => setApprovalTab("ALL")}>
              <div className="metric-icon-box bg-soft-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{workers.length}</h4>
                <span className="text-muted small">Total Registered</span>
              </div>
            </div>

            <div className="worker-metric-card alert-border" onClick={() => setApprovalTab("PENDING")}>
              <div className="metric-icon-box bg-soft-yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold text-danger">{pendingCount}</h4>
                <span className="text-muted small">Pending Approvals</span>
              </div>
            </div>

            <div className="worker-metric-card" onClick={() => setApprovalTab("APPROVED")}>
              <div className="metric-icon-box bg-soft-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{approvedCount}</h4>
                <span className="text-muted small">Approved Workers</span>
              </div>
            </div>

            <div className="worker-metric-card">
              <div className="metric-icon-box bg-soft-cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{availableCount}</h4>
                <span className="text-muted small">Online & Available</span>
              </div>
            </div>
          </div>

          {/* Search & Tabs Filter */}
          <div className="card shadow-sm border-0 mb-4 modern-filter-card">
            <div className="card-body p-3">
              <div className="row g-3 align-items-center justify-content-between">
                <div className="col-md-5">
                  <div className="modern-search-box">
                    <span className="search-icon"><Icons.Search /></span>
                    <input
                      type="text"
                      className="form-control border-0 bg-transparent"
                      placeholder="Search by worker name, category, city, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="search-clear-btn" onClick={() => setSearchTerm("")}>✕</button>
                    )}
                  </div>
                </div>

                <div className="col-md-7 d-flex justify-content-md-end">
                  <div className="nav nav-pills worker-filter-pills flex-wrap gap-2">
                    <button className={`nav-link ${approvalTab === "ALL" ? "active" : ""}`} onClick={() => setApprovalTab("ALL")}>
                      All ({workers.length})
                    </button>
                    <button className={`nav-link ${approvalTab === "PENDING" ? "active" : ""}`} onClick={() => setApprovalTab("PENDING")}>
                      Pending ({pendingCount})
                    </button>
                    <button className={`nav-link ${approvalTab === "APPROVED" ? "active" : ""}`} onClick={() => setApprovalTab("APPROVED")}>
                      Approved ({approvedCount})
                    </button>
                    <button className={`nav-link ${approvalTab === "REJECTED" ? "active" : ""}`} onClick={() => setApprovalTab("REJECTED")}>
                      Rejected ({rejectedCount})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workers Table */}
          <div className="card shadow-sm border-0 table-card-elevated">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Loading worker directory...</p>
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="empty-state-icon">👷</div>
                  <h5 className="mt-3">No Workers Found</h5>
                  <p className="text-muted small">
                    {searchTerm ? "No workers match your filter criteria." : "No workers found in this status category."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 worker-table">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Skills / Categories</th>
                        <th>Experience</th>
                        <th>City / Area</th>
                        <th>Rating & Jobs</th>
                        <th>Availability</th>
                        <th>Approval</th>
                        <th className="text-end" style={{ minWidth: "320px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => {
                        const initials = (worker.full_name || "W")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();
                        const workerCats = normalizeCategories(worker.categories);

                        return (
                          <tr key={worker.user_id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="worker-avatar-circle">{initials}</div>
                                <div>
                                  <strong className="d-block text-dark worker-name-label">{worker.full_name}</strong>
                                  <small className="text-muted d-block">{worker.email}</small>
                                  <small className="text-secondary">{worker.phone || "No phone"}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "220px" }}>
                                {workerCats.length > 0 ? (
                                  workerCats.map((cat, i) => (
                                    <span key={i} className="skill-chip">
                                      {cat}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted small">No categories</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="fw-semibold text-dark">
                                {worker.experience_years != null ? `${worker.experience_years} yrs` : "N/A"}
                              </span>
                            </td>
                            <td>
                              <span className="small text-secondary">
                                {worker.primary_city
                                  ? `${worker.primary_city}${worker.primary_area ? `, ${worker.primary_area}` : ""}`
                                  : "Not set"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <Icons.Star />
                                <span className="fw-bold">{formatRating(worker.avg_rating)}</span>
                                <small className="text-muted">({worker.total_jobs_completed ?? 0} jobs)</small>
                              </div>
                            </td>
                            <td>
                              {worker.is_available ? (
                                <span className="custom-badge badge-available">
                                  <span className="live-dot green"></span> Available
                                </span>
                              ) : (
                                <span className="custom-badge badge-unavailable">
                                  <span className="live-dot gray"></span> Unavailable
                                </span>
                              )}
                            </td>
                            <td>{getApprovalBadge(worker.approval_status)}</td>
                            <td className="text-end">
                              
                              {/* Wrapped Action Buttons Container */}
                              <div className="action-buttons-cell">
                                {worker.approval_status !== "APPROVED" && (
                                  <button
                                    className="action-btn-mid btn-mid-approve"
                                    onClick={() => handleUpdateApproval(worker.user_id, "APPROVED")}
                                    disabled={actionLoading}
                                    title="Approve Application"
                                  >
                                    <Icons.Check />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {worker.approval_status !== "REJECTED" && (
                                  <button
                                    className="action-btn-mid btn-mid-reject"
                                    onClick={() => handleUpdateApproval(worker.user_id, "REJECTED")}
                                    disabled={actionLoading}
                                    title="Reject Application"
                                  >
                                    <Icons.Cross />
                                    <span>Reject</span>
                                  </button>
                                )}

                                <button
                                  className="action-btn-mid btn-mid-view"
                                  onClick={() => setSelectedWorker(worker)}
                                  title="View Full Profile"
                                >
                                  <Icons.Eye />
                                  <span>View</span>
                                </button>

                                <button
                                  className={`action-btn-mid ${worker.is_blocked ? "btn-mid-unblock" : "btn-mid-block"}`}
                                  onClick={() => handleToggleBlock(worker)}
                                  disabled={actionLoading}
                                  title={worker.is_blocked ? "Unblock Worker" : "Block Worker"}
                                >
                                  {worker.is_blocked ? <Icons.Unlock /> : <Icons.Lock />}
                                  <span>{worker.is_blocked ? "Unblock" : "Block"}</span>
                                </button>

                                <button
                                  className={`action-btn-mid ${worker.is_active ? "btn-mid-deactivate" : "btn-mid-activate"}`}
                                  onClick={() => handleToggleActive(worker)}
                                  disabled={actionLoading}
                                  title={worker.is_active ? "Deactivate Account" : "Activate Account"}
                                >
                                  <Icons.Power />
                                  <span>{worker.is_active ? "Deactivate" : "Activate"}</span>
                                </button>
                              </div>

                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Worker Details Modal */}
          {selectedWorker && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg" style={{ maxWidth: "650px" }}>
                <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Worker Profile & Credentials</h5>
                  <button className="btn-close" onClick={() => setSelectedWorker(null)}></button>
                </div>
                <div className="modal-body-custom p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="worker-avatar-large">
                      {(selectedWorker.full_name || "W").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold">{selectedWorker.full_name}</h4>
                      <p className="text-muted mb-0">Worker ID: #{selectedWorker.user_id}</p>
                      <div className="mt-1 d-flex gap-2 align-items-center flex-wrap">
                        {getApprovalBadge(selectedWorker.approval_status)}
                        {selectedWorker.is_blocked && <span className="custom-badge badge-rejected">Blocked</span>}
                        {selectedWorker.is_active === false && <span className="custom-badge badge-neutral">Deactivated</span>}
                        {selectedWorker.is_available ? (
                          <span className="custom-badge badge-available">Online & Available</span>
                        ) : (
                          <span className="custom-badge badge-unavailable">Offline</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Email Address</label>
                      <p className="fw-semibold">{selectedWorker.email}</p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Phone Number</label>
                      <p className="fw-semibold">{selectedWorker.phone || "Not provided"}</p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Service Categories</label>
                      <div className="d-flex flex-wrap gap-1">
                        {normalizeCategories(selectedWorker.categories).map((cat, idx) => (
                          <span key={idx} className="skill-chip">{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Experience & Jobs</label>
                      <p className="fw-semibold">
                        {selectedWorker.experience_years ?? 0} years exp &middot; {selectedWorker.total_jobs_completed ?? 0} jobs done ({formatRating(selectedWorker.avg_rating)} rating)
                      </p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Primary Operational Area</label>
                      <p className="fw-semibold">
                        {selectedWorker.primary_city ? `${selectedWorker.primary_city}, ${selectedWorker.primary_area || ""}` : "Not configured"}
                      </p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Live Coordinates</label>
                      <p className="fw-semibold small">
                        {selectedWorker.latitude != null && selectedWorker.longitude != null
                          ? `Lat: ${formatCoord(selectedWorker.latitude)}, Lng: ${formatCoord(selectedWorker.longitude)}`
                          : "GPS not active"}
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small mb-1">Professional Bio / Summary</label>
                      <div className="p-3 bg-light rounded small text-secondary">
                        {selectedWorker.professional_summary || "No professional summary provided."}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-between flex-wrap gap-2">
                    <div className="d-flex gap-2 flex-wrap">
                      {selectedWorker.approval_status !== "APPROVED" && (
                        <button
                          className="btn btn-success d-flex align-items-center gap-1"
                          onClick={() => handleUpdateApproval(selectedWorker.user_id, "APPROVED")}
                          disabled={actionLoading}
                        >
                          <Icons.Check /> Approve Application
                        </button>
                      )}
                      {selectedWorker.approval_status !== "REJECTED" && (
                        <button
                          className="btn btn-outline-danger d-flex align-items-center gap-1"
                          onClick={() => handleUpdateApproval(selectedWorker.user_id, "REJECTED")}
                          disabled={actionLoading}
                        >
                          <Icons.Cross /> Reject Application
                        </button>
                      )}
                    </div>
                    <button className="btn btn-secondary" onClick={() => setSelectedWorker(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ManageWorkers;