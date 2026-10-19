import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminWorkers, updateWorkerApproval, updateWorkerStatus } from "../Services/adminService";
import "./ManageWorkers.css";

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
        toast.error(response.data || "Failed to load workers");
      }
    } catch (error) {
      console.error("LOAD WORKERS ERROR:", error);
      toast.error(error.response?.data?.data || "Unable to load service workers");
    } finally {
      setLoading(false);
    }
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
        setWorkers(prev =>
          prev.map(w => w.user_id === workerId ? { ...w, approval_status: newStatus } : w)
        );
        if (selectedWorker?.user_id === workerId) {
          setSelectedWorker(prev => ({ ...prev, approval_status: newStatus }));
        }
      } else {
        toast.error(res.data || "Failed to update approval status");
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
        setWorkers(prev =>
          prev.map(w => w.user_id === worker.user_id ? { ...w, is_blocked: newBlocked } : w)
        );
        if (selectedWorker?.user_id === worker.user_id) {
          setSelectedWorker(prev => ({ ...prev, is_blocked: newBlocked }));
        }
      } else {
        toast.error(res.data || "Action failed");
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
        setWorkers(prev =>
          prev.map(w => w.user_id === worker.user_id ? { ...w, is_active: newActive } : w)
        );
        if (selectedWorker?.user_id === worker.user_id) {
          setSelectedWorker(prev => ({ ...prev, is_active: newActive }));
        }
      } else {
        toast.error(res.data || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update active status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const categoriesStr = (w.categories || []).join(" ").toLowerCase();
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

  const pendingCount = workers.filter(w => (w.approval_status || "PENDING") === "PENDING").length;
  const approvedCount = workers.filter(w => w.approval_status === "APPROVED").length;
  const availableCount = workers.filter(w => w.is_available && w.approval_status === "APPROVED").length;
  const rejectedCount = workers.filter(w => w.approval_status === "REJECTED").length;

  const getApprovalBadge = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "APPROVED") return <span className="badge bg-success"><i className="bi bi-patch-check-fill me-1"></i>Approved</span>;
    if (s === "PENDING") return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>Pending Review</span>;
    if (s === "REJECTED") return <span className="badge bg-danger"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
    return <span className="badge bg-secondary">{status}</span>;
  };

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                <i className="bi bi-person-workspace text-danger me-2"></i>
                Service Worker Management & Approvals
              </h2>
              <p className="text-muted mb-0">
                Review worker applications, verify credentials, manage service skills, and control account status
              </p>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={loadWorkers}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh Workers
            </button>
          </div>

          {/* Metrics summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="worker-metric-card" onClick={() => setApprovalTab("ALL")}>
                <div className="metric-icon bg-light-primary text-primary">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{workers.length}</h4>
                  <span className="text-muted small">Total Registered</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="worker-metric-card alert-border" onClick={() => setApprovalTab("PENDING")}>
                <div className="metric-icon bg-light-warning text-warning">
                  <i className="bi bi-shield-exclamation"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold text-danger">{pendingCount}</h4>
                  <span className="text-muted small">Pending Approvals</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="worker-metric-card" onClick={() => setApprovalTab("APPROVED")}>
                <div className="metric-icon bg-light-success text-success">
                  <i className="bi bi-patch-check-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{approvedCount}</h4>
                  <span className="text-muted small">Approved Workers</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="worker-metric-card">
                <div className="metric-icon bg-light-info text-info">
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{availableCount}</h4>
                  <span className="text-muted small">Online & Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Tabs Filter */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center justify-content-between">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      placeholder="Search by worker name, category, city, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="btn btn-light border" onClick={() => setSearchTerm("")}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="col-md-6 d-flex justify-content-md-end">
                  <div className="nav nav-pills worker-filter-pills">
                    <button
                      className={`nav-link ${approvalTab === "ALL" ? "active" : ""}`}
                      onClick={() => setApprovalTab("ALL")}
                    >
                      All ({workers.length})
                    </button>
                    <button
                      className={`nav-link ${approvalTab === "PENDING" ? "active" : ""}`}
                      onClick={() => setApprovalTab("PENDING")}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      className={`nav-link ${approvalTab === "APPROVED" ? "active" : ""}`}
                      onClick={() => setApprovalTab("APPROVED")}
                    >
                      Approved ({approvedCount})
                    </button>
                    <button
                      className={`nav-link ${approvalTab === "REJECTED" ? "active" : ""}`}
                      onClick={() => setApprovalTab("REJECTED")}
                    >
                      Rejected ({rejectedCount})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workers Table */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Loading worker directory...</p>
                </div>
              ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-x fs-1 text-muted d-block mb-2"></i>
                  <h5>No Workers Found</h5>
                  <p className="text-muted small">
                    {searchTerm ? "No workers match your filter criteria." : "No workers found in this status category."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 worker-table">
                    <thead className="table-light">
                      <tr>
                        <th>Worker</th>
                        <th>Skills / Categories</th>
                        <th>Experience</th>
                        <th>City / Area</th>
                        <th>Rating & Jobs</th>
                        <th>Availability</th>
                        <th>Approval</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorkers.map((worker) => {
                        const initials = (worker.full_name || "W")
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <tr key={worker.user_id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="worker-avatar-circle">{initials}</div>
                                <div>
                                  <strong className="d-block text-dark">{worker.full_name}</strong>
                                  <small className="text-muted d-block">{worker.email}</small>
                                  <small className="text-secondary">{worker.phone || "No phone"}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1" style={{ maxWidth: "220px" }}>
                                {worker.categories && worker.categories.length > 0 ? (
                                  worker.categories.map((cat, i) => (
                                    <span key={i} className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                                      {cat}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-muted small">No categories</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="fw-semibold">
                                {worker.experience_years ? `${worker.experience_years} yrs` : "N/A"}
                              </span>
                            </td>
                            <td>
                              <span className="small text-secondary">
                                {worker.primary_city ? `${worker.primary_city}${worker.primary_area ? `, ${worker.primary_area}` : ""}` : "Not set"}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1">
                                <i className="bi bi-star-fill text-warning"></i>
                                <span className="fw-bold">{worker.avg_rating ? worker.avg_rating.toFixed(1) : "0.0"}</span>
                                <small className="text-muted">({worker.total_jobs_completed} jobs)</small>
                              </div>
                            </td>
                            <td>
                              {worker.is_available ? (
                                <span className="badge bg-success-subtle text-success border border-success-subtle">
                                  <i className="bi bi-dot"></i> Available
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border">
                                  Unavailable
                                </span>
                              )}
                            </td>
                            <td>
                              {getApprovalBadge(worker.approval_status)}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                {/* Approve button */}
                                {worker.approval_status !== "APPROVED" && (
                                  <button
                                    className="btn btn-success"
                                    onClick={() => handleUpdateApproval(worker.user_id, "APPROVED")}
                                    disabled={actionLoading}
                                    title="Approve Application"
                                  >
                                    <i className="bi bi-check-lg"></i> Approve
                                  </button>
                                )}

                                {/* Reject button */}
                                {worker.approval_status !== "REJECTED" && (
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleUpdateApproval(worker.user_id, "REJECTED")}
                                    disabled={actionLoading}
                                    title="Reject Application"
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                )}

                                {/* View details */}
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => setSelectedWorker(worker)}
                                  title="View Full Profile"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>

                                {/* Block toggle */}
                                <button
                                  className={`btn ${worker.is_blocked ? "btn-outline-success" : "btn-outline-warning"}`}
                                  onClick={() => handleToggleBlock(worker)}
                                  disabled={actionLoading}
                                  title={worker.is_blocked ? "Unblock Worker" : "Block Worker"}
                                >
                                  <i className={`bi ${worker.is_blocked ? "bi-unlock" : "bi-lock"}`}></i>
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
                      <div className="mt-1 d-flex gap-2 align-items-center">
                        {getApprovalBadge(selectedWorker.approval_status)}
                        {selectedWorker.is_blocked && <span className="badge bg-danger">Blocked</span>}
                        {selectedWorker.is_available ? (
                          <span className="badge bg-success-subtle text-success">Online & Available</span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary">Offline</span>
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
                        {selectedWorker.categories?.map((cat, idx) => (
                          <span key={idx} className="badge bg-danger text-white">{cat}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Experience & Jobs</label>
                      <p className="fw-semibold">
                        {selectedWorker.experience_years || 0} years exp &middot; {selectedWorker.total_jobs_completed || 0} jobs done ({selectedWorker.avg_rating?.toFixed(1) || "0.0"} rating)
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
                        {selectedWorker.latitude && selectedWorker.longitude ? (
                          `Lat: ${selectedWorker.latitude.toFixed(4)}, Lng: ${selectedWorker.longitude.toFixed(4)}`
                        ) : (
                          "GPS not active"
                        )}
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small mb-1">Professional Bio / Summary</label>
                      <div className="p-2 bg-light rounded small">
                        {selectedWorker.professional_summary || "No professional summary provided."}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-between">
                    <div className="d-flex gap-2">
                      {selectedWorker.approval_status !== "APPROVED" && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleUpdateApproval(selectedWorker.user_id, "APPROVED")}
                        >
                          <i className="bi bi-check-circle-fill me-1"></i> Approve Application
                        </button>
                      )}
                      {selectedWorker.approval_status !== "REJECTED" && (
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleUpdateApproval(selectedWorker.user_id, "REJECTED")}
                        >
                          <i className="bi bi-x-circle me-1"></i> Reject Application
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
