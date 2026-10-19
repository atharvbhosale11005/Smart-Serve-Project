import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminAnalytics,
  getAdminRequests,
  getAdminWorkers,
  assignWorkerToRequest,
  cancelAdminRequest
} from "../Services/adminService";
import "./AdminAnalytics.css";

function AdminAnalytics() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("ANALYTICS"); // "ANALYTICS" or "REQUESTS"
  const [analytics, setAnalytics] = useState(null);
  const [requests, setRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestFilter, setRequestFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [requestFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const [analyticsRes, requestsRes, workersRes] = await Promise.all([
        getAdminAnalytics(token),
        getAdminRequests(requestFilter, token),
        getAdminWorkers(token)
      ]);

      if (analyticsRes.status === "success") {
        setAnalytics(analyticsRes.data);
      }
      if (requestsRes.status === "success") {
        setRequests(requestsRes.data || []);
      }
      if (workersRes.status === "success") {
        setWorkers((workersRes.data || []).filter(w => w.approval_status === "APPROVED" && w.is_active && !w.is_blocked));
      }
    } catch (error) {
      console.error("ADMIN ANALYTICS ERROR:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReassign = (req) => {
    setSelectedRequest(req);
    setSelectedWorkerId(req.assigned_worker_id || "");
    setReassignModalOpen(true);
  };

  const handleSaveReassign = async () => {
    if (!selectedWorkerId) {
      toast.warning("Please select a worker to assign");
      return;
    }

    try {
      setReassigning(true);
      const token = sessionStorage.getItem("token");
      const res = await assignWorkerToRequest(selectedRequest.request_id, selectedWorkerId, token);
      if (res.status === "success") {
        toast.success(res.data?.message || "Worker assigned successfully");
        setReassignModalOpen(false);
        loadData();
      } else {
        toast.error(res.data || "Assignment failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign worker");
    } finally {
      setReassigning(false);
    }
  };

  const handleCancelRequest = async (reqId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const token = sessionStorage.getItem("token");
      const res = await cancelAdminRequest(reqId, token);
      if (res.status === "success") {
        toast.success("Request cancelled successfully");
        loadData();
      } else {
        toast.error(res.data || "Failed to cancel request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel request");
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return <span className="badge bg-success">Completed</span>;
    if (s === "PENDING") return <span className="badge bg-warning text-dark">Pending</span>;
    if (s === "CANCELLED") return <span className="badge bg-danger">Cancelled</span>;
    if (s === "IN_PROGRESS") return <span className="badge bg-primary">In Progress</span>;
    if (s === "ASSIGNED") return <span className="badge bg-info text-dark">Assigned</span>;
    if (s === "ACCEPTED") return <span className="badge bg-info text-dark">Accepted</span>;
    if (s === "ARRIVED") return <span className="badge bg-primary">Arrived</span>;
    return <span className="badge bg-secondary">{status}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredRequests = requests.filter(r =>
    (r.request_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.service_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.worker_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.address_city || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* Header */}
          <div className="page-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                <i className="bi bi-graph-up text-danger me-2"></i>
                Analytics & Global Requests Tracker
              </h2>
              <p className="text-muted mb-0">
                Track revenue, service distribution, ratings, and all service booking requests
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-danger btn-sm" onClick={loadData}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>

          {/* Nav Pills Section Switcher */}
          <div className="d-flex gap-2 mb-4">
            <button
              className={`btn ${activeSection === "ANALYTICS" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
              onClick={() => setActiveSection("ANALYTICS")}
            >
              <i className="bi bi-pie-chart-fill me-1"></i> Insights & Performance
            </button>
            <button
              className={`btn ${activeSection === "REQUESTS" ? "btn-danger fw-bold" : "btn-outline-secondary"}`}
              onClick={() => setActiveSection("REQUESTS")}
            >
              <i className="bi bi-receipt me-1"></i> Global Bookings Log ({requests.length})
            </button>
          </div>

          {/* SECTION 1: ANALYTICS & INSIGHTS */}
          {activeSection === "ANALYTICS" && (
            <div>
              {loading || !analytics ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Calculating platform metrics...</p>
                </div>
              ) : (
                <div className="row g-4">
                  {/* Status Breakdown Cards */}
                  <div className="col-12">
                    <h5 className="fw-bold mb-3">Service Request Status Distribution</h5>
                    <div className="row g-3">
                      {analytics.statusDistribution?.map((st, i) => (
                        <div className="col-lg-2 col-md-4 col-6" key={i}>
                          <div className="status-metric-tile">
                            <span className="status-name">{st.status}</span>
                            <h3 className="mb-0 fw-bold">{st.count}</h3>
                            <small className="text-muted">₹{Number(st.value).toLocaleString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Performance */}
                  <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <i className="bi bi-folder2-open text-danger"></i>
                          Category Performance & Revenue
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Category</th>
                                <th>Total Bookings</th>
                                <th className="text-end">Completed Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.categoryPerformance?.map((cat, idx) => (
                                <tr key={idx}>
                                  <td className="fw-semibold">{cat.category_name}</td>
                                  <td>
                                    <span className="badge bg-light text-dark border">
                                      {cat.total_requests} bookings
                                    </span>
                                  </td>
                                  <td className="text-end fw-bold text-dark">
                                    ₹{Number(cat.category_revenue || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Booked Services */}
                  <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <i className="bi bi-star-fill text-warning"></i>
                          Most Popular Services
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Service Title</th>
                                <th>Category</th>
                                <th>Base Price</th>
                                <th className="text-end">Bookings</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.topServices?.map((svc, idx) => (
                                <tr key={idx}>
                                  <td className="fw-semibold">{svc.service_name}</td>
                                  <td>
                                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                                      {svc.category_name}
                                    </span>
                                  </td>
                                  <td className="fw-bold">₹{svc.base_price}</td>
                                  <td className="text-end">
                                    <span className="badge bg-primary px-2 py-1">
                                      {svc.booking_count} times
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Rated Workers */}
                  <div className="col-lg-7">
                    <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <i className="bi bi-award-fill text-danger"></i>
                          Top Rated Service Professionals
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Professional</th>
                                <th>Trade</th>
                                <th>City</th>
                                <th>Rating</th>
                                <th className="text-end">Completed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {analytics.topWorkers?.map((w, idx) => (
                                <tr key={idx}>
                                  <td className="fw-semibold">{w.full_name}</td>
                                  <td><small className="text-muted">{w.categories || "All"}</small></td>
                                  <td><small>{w.primary_city || "N/A"}</small></td>
                                  <td>
                                    <span className="badge bg-warning text-dark">
                                      ★ {w.avg_rating?.toFixed(1) || "0.0"}
                                    </span>
                                  </td>
                                  <td className="text-end fw-bold">{w.total_jobs_completed} jobs</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Summary */}
                  <div className="col-lg-5">
                    <div className="card shadow-sm border-0 h-100">
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <i className="bi bi-chat-heart-fill text-danger"></i>
                          Customer Feedback Ratings Breakdown
                        </h6>
                      </div>
                      <div className="card-body p-3">
                        {analytics.ratingDistribution?.length === 0 ? (
                          <p className="text-muted small text-center my-4">No reviews submitted yet.</p>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {analytics.ratingDistribution?.map((r, idx) => (
                              <div key={idx} className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-bold">{r.rating} ★</span>
                                  <div className="progress flex-grow-1" style={{ width: "160px", height: "8px" }}>
                                    <div
                                      className="progress-bar bg-warning"
                                      role="progressbar"
                                      style={{ width: `${Math.min(100, r.count * 15)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span className="badge bg-light text-dark border">{r.count} reviews</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* SECTION 2: GLOBAL BOOKINGS LOG */}
          {activeSection === "REQUESTS" && (
            <div>
              {/* Filter / Search Bar */}
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
                          placeholder="Search by code, service, customer or worker..."
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
                    <div className="col-md-6 d-flex justify-content-md-end gap-2">
                      <select
                        className="form-select w-auto"
                        value={requestFilter}
                        onChange={(e) => setRequestFilter(e.target.value)}
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ARRIVED">Arrived</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                      <p className="mt-2 text-muted">Loading bookings log...</p>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                      <h5>No Service Requests Found</h5>
                      <p className="text-muted small">No bookings match the selected status filter.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 bookings-table">
                        <thead className="table-light">
                          <tr>
                            <th>Request Code</th>
                            <th>Service & Category</th>
                            <th>Customer</th>
                            <th>Assigned Worker</th>
                            <th>Price</th>
                            <th>Requested At</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((req) => (
                            <tr key={req.request_id}>
                              <td>
                                <span className="fw-mono fw-bold text-dark small">
                                  {req.request_code || `#${req.request_id}`}
                                </span>
                              </td>
                              <td>
                                <strong className="d-block text-dark">{req.service_name}</strong>
                                <small className="text-muted">{req.category_name}</small>
                              </td>
                              <td>
                                <div className="small">
                                  <strong className="d-block">{req.customer_name}</strong>
                                  <span className="text-muted">{req.customer_phone || req.customer_email}</span>
                                </div>
                              </td>
                              <td>
                                {req.worker_name ? (
                                  <div className="small">
                                    <strong className="d-block text-dark">{req.worker_name}</strong>
                                    <span className="text-muted">{req.worker_phone}</span>
                                  </div>
                                ) : (
                                  <span className="badge bg-light text-muted border">Unassigned</span>
                                )}
                              </td>
                              <td>
                                <span className="fw-bold">
                                  ₹{req.final_price || req.estimated_price || 0}
                                </span>
                              </td>
                              <td>
                                <small className="text-muted">{formatDate(req.created_at)}</small>
                              </td>
                              <td>
                                {getStatusBadge(req.status)}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  {req.status !== "COMPLETED" && req.status !== "CANCELLED" && (
                                    <>
                                      <button
                                        className="btn btn-outline-primary"
                                        onClick={() => handleOpenReassign(req)}
                                        title="Assign / Reassign Worker"
                                      >
                                        <i className="bi bi-person-plus"></i> Assign
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() => handleCancelRequest(req.request_id)}
                                        title="Cancel Request"
                                      >
                                        <i className="bi bi-x-circle"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reassign Worker Modal */}
          {reassignModalOpen && selectedRequest && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg">
                <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Assign Worker to Request</h5>
                  <button className="btn-close" onClick={() => setReassignModalOpen(false)}></button>
                </div>
                <div className="modal-body-custom p-4">
                  <div className="mb-3 p-3 bg-light rounded">
                    <div className="small text-muted mb-1">Service Request</div>
                    <h6 className="fw-bold mb-1">{selectedRequest.service_name} ({selectedRequest.request_code})</h6>
                    <p className="small text-muted mb-0">Customer: {selectedRequest.customer_name} &middot; {selectedRequest.address_city}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Select Approved Worker</label>
                    <select
                      className="form-select"
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                    >
                      <option value="">-- Choose an Available Worker --</option>
                      {workers.map((w) => (
                        <option key={w.user_id} value={w.user_id}>
                          {w.full_name} ({w.primary_city || "City N/A"}) - Rating: {w.avg_rating?.toFixed(1) || "0.0"} ★ ({w.total_jobs_completed} jobs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                    <button className="btn btn-secondary" onClick={() => setReassignModalOpen(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger px-4"
                      onClick={handleSaveReassign}
                      disabled={reassigning || !selectedWorkerId}
                    >
                      {reassigning ? "Assigning..." : "Confirm Assignment"}
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

export default AdminAnalytics;
