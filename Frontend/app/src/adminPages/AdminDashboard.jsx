import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminDashboard } from "../Services/adminService";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    totalUsers: 0,
    totalWorkers: 0,
    pendingApprovals: 0,
    availableWorkers: 0,
    activeServices: 0,
    activeCategories: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    cancelledRequests: 0,
    totalRevenue: 0,
    recentActivities: []
  });

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user") || "null");
    if (userData) {
      setUserName(userData.fullName || userData.full_name || "Admin");
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await getAdminDashboard(token);
      if (response.status === "success") {
        const d = response.data || {};
        setDashboard({
          totalUsers: d.totalUsers ?? 0,
          totalWorkers: d.totalWorkers ?? 0,
          pendingApprovals: d.pendingApprovals ?? 0,
          availableWorkers: d.availableWorkers ?? 0,
          activeServices: d.activeServices ?? 0,
          activeCategories: d.activeCategories ?? 0,
          totalRequests: d.totalRequests ?? 0,
          activeRequests: d.activeRequests ?? 0,
          completedRequests: d.completedRequests ?? 0,
          cancelledRequests: d.cancelledRequests ?? 0,
          totalRevenue: d.totalRevenue ?? 0,
          recentActivities: Array.isArray(d.recentActivities) ? d.recentActivities : []
        });
      } else {
        toast.error(typeof response.data === "string" ? response.data : "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("ADMIN DASHBOARD LOAD ERROR:", error);
      toast.error(
        error?.response?.data?.data || "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "COMPLETED") return "badge bg-success";
    if (s === "PENDING") return "badge bg-warning text-dark";
    if (s === "CANCELLED") return "badge bg-danger";
    if (s === "IN_PROGRESS" || s === "ACCEPTED" || s === "ARRIVED")
      return "badge bg-primary";
    return "badge bg-secondary";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const formatCurrency = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n.toLocaleString() : "0";
  };

  const stats = [
    {
      icon: "bi-people-fill",
      color: "red",
      value: dashboard.totalUsers,
      label: "Total Customers",
      subtext: "Registered users",
      onClick: () => navigate("/admin/users")
    },
    {
      icon: "bi-person-badge-fill",
      color: "blue",
      value: dashboard.totalWorkers,
      label: "Total Workers",
      subtext: `${dashboard.availableWorkers} active & available`,
      onClick: () => navigate("/admin/workers")
    },
    {
      icon: "bi-clock-history",
      color: "orange",
      value: dashboard.pendingApprovals,
      label: "Pending Approvals",
      subtext: "Worker verifications",
      badge:
        dashboard.pendingApprovals > 0
          ? `${dashboard.pendingApprovals} Action Required`
          : null,
      onClick: () => navigate("/admin/workers")
    },
    {
      icon: "bi-currency-rupee",
      color: "green",
      value: `₹${formatCurrency(dashboard.totalRevenue)}`,
      label: "Total Revenue",
      subtext: `${dashboard.completedRequests} completed jobs`,
      onClick: () => navigate("/admin/analytics")
    }
  ];

  const secondaryStats = [
    {
      icon: "bi-grid-fill",
      title: "Active Services",
      count: dashboard.activeServices,
      sub: `Across ${dashboard.activeCategories} categories`,
      link: "/admin/services"
    },
    {
      icon: "bi-lightning-charge-fill",
      title: "Active Jobs",
      count: dashboard.activeRequests,
      sub: "In-progress & assigned",
      link: "/admin/analytics"
    },
    {
      icon: "bi-check2-all",
      title: "Completed Jobs",
      count: dashboard.completedRequests,
      sub: "Fulfilled requests",
      link: "/admin/analytics"
    },
    {
      icon: "bi-shield-x",
      title: "Cancelled Jobs",
      count: dashboard.cancelledRequests,
      sub: "Customer/Admin cancelled",
      link: "/admin/analytics"
    }
  ];

  const quickActions = [
    {
      title: "Manage Customers",
      desc: "View and manage registered user accounts",
      path: "/admin/users",
      icon: "bi-people",
      color: "red"
    },
    {
      title: "Manage Workers",
      desc: "Approve worker applications & verify profiles",
      path: "/admin/workers",
      icon: "bi-person-workspace",
      color: "blue"
    },
    {
      title: "Manage Services & Pricing",
      desc: "Configure services, categories & pricing rates",
      path: "/admin/services",
      icon: "bi-tools",
      color: "purple"
    },
    {
      title: "Bookings & Analytics",
      desc: "Track requests, assignments & platform insights",
      path: "/admin/analytics",
      icon: "bi-graph-up-arrow",
      color: "green"
    }
  ];

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Welcome Banner */}
          <div className="welcome-section admin-welcome">
            <div>
              <h1 className="display-6 fw-bold">
                Welcome back,{" "}
                <span className="admin-name-highlight">{userName}</span>! 🛡️
              </h1>
              <p className="text-muted">
                System Overview & Real-Time Platform Management Hub
              </p>
            </div>
            <div className="welcome-actions">
              <button
                className="btn btn-outline-danger me-2"
                onClick={() => loadDashboardData()}
                title="Refresh platform stats"
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
              <button
                className="btn btn-danger"
                onClick={() => navigate("/admin/services")}
              >
                <i className="bi bi-plus-circle-fill me-2"></i>
                Add New Service
              </button>
            </div>
          </div>

          {/* Pending Approval Alert if any */}
          {dashboard.pendingApprovals > 0 && (
            <div
              className="alert alert-warning admin-approval-alert d-flex align-items-center justify-content-between mb-4 shadow-sm"
              role="alert"
            >
              <div className="d-flex align-items-center gap-3">
                <div className="approval-alert-icon">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <div>
                  <strong>
                    {dashboard.pendingApprovals} Worker Application(s) Pending Review!
                  </strong>
                  <p className="mb-0 text-muted small">
                    New service professionals are waiting for admin approval before
                    they can take service requests.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-sm btn-dark px-3 fw-bold"
                onClick={() => navigate("/admin/workers")}
              >
                Review Applications{" "}
                <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          )}

          {/* Primary Stats Grid */}
          <div className="row g-4 mb-4">
            {stats.map((stat, index) => (
              <div className="col-lg-3 col-sm-6" key={index}>
                <div className="stat-card clickable-stat" onClick={stat.onClick}>
                  <div className={`stat-icon ${stat.color}`}>
                    <i className={`bi ${stat.icon}`}></i>
                  </div>
                  <div className="stat-info">
                    <h3>{loading ? "..." : stat.value}</h3>
                    <span className="stat-label">{stat.label}</span>
                    <small className="stat-subtext d-block">{stat.subtext}</small>
                  </div>
                  {stat.badge && (
                    <span className="pending-badge-pill">{stat.badge}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary Metric Badges */}
          <div className="row g-3 mb-4">
            {secondaryStats.map((item, idx) => (
              <div className="col-lg-3 col-sm-6" key={idx}>
                <div
                  className="secondary-stat-card"
                  onClick={() => navigate(item.link)}
                >
                  <div className="d-flex align-items-center gap-3">
                    <i className={`bi ${item.icon} sec-icon`}></i>
                    <div>
                      <h4 className="mb-0 fw-bold">{loading ? "..." : item.count}</h4>
                      <p className="mb-0 text-dark fw-semibold small">
                        {item.title}
                      </p>
                      <small className="text-muted">{item.sub}</small>
                    </div>
                  </div>
                  <i className="bi bi-chevron-right chevron-nav"></i>
                </div>
              </div>
            ))}
          </div>

          {/* Main 2-Column Section: Recent Activities & Quick Actions */}
          <div className="row g-4">
            {/* Recent Activities Feed */}
            <div className="col-lg-7">
              <div className="card admin-feed-card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-activity text-danger"></i>
                    Recent Platform Bookings & Activity
                  </h5>
                  <button
                    className="btn btn-sm btn-link text-danger text-decoration-none fw-bold"
                    onClick={() => navigate("/admin/analytics")}
                  >
                    View All <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-danger" role="status"></div>
                      <p className="mt-2 text-muted">Loading live activity...</p>
                    </div>
                  ) : dashboard.recentActivities.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
                      No recent service activities logged.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 activity-table">
                        <thead className="table-light">
                          <tr>
                            <th>Code</th>
                            <th>Service</th>
                            <th>Customer</th>
                            <th>Worker</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.recentActivities.map((act) => (
                            <tr key={act.request_id}>
                              <td>
                                <span className="fw-mono text-secondary small fw-bold">
                                  {act.request_code || `#${act.request_id}`}
                                </span>
                              </td>
                              <td>
                                <strong className="d-block">{act.service_name}</strong>
                                <small className="text-muted">
                                  {formatDate(act.created_at)}
                                </small>
                              </td>
                              <td>{act.customer_name || "Guest"}</td>
                              <td>
                                {act.worker_name ? (
                                  <span className="text-dark fw-semibold">
                                    {act.worker_name}
                                  </span>
                                ) : (
                                  <span className="badge bg-light text-muted border">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="fw-bold text-dark">
                                  ₹
                                  {formatCurrency(
                                    act.final_price || act.estimated_price || 0
                                  )}
                                </span>
                              </td>
                              <td>
                                <span className={getStatusBadge(act.status)}>
                                  {act.status}
                                </span>
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

            {/* Quick Actions & Navigation Cards */}
            <div className="col-lg-5">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-grid-3x3-gap-fill text-danger"></i>
                    Admin Management Modules
                  </h5>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex flex-column gap-3">
                    {quickActions.map((qa, index) => (
                      <div
                        key={index}
                        className="admin-module-tile"
                        onClick={() => navigate(qa.path)}
                      >
                        <div className={`module-icon-wrap ${qa.color}`}>
                          <i className={`bi ${qa.icon}`}></i>
                        </div>
                        <div className="module-info">
                          <h6 className="mb-0 fw-bold">{qa.title}</h6>
                          <p className="mb-0 text-muted small">{qa.desc}</p>
                        </div>
                        <i className="bi bi-chevron-right ms-auto text-muted"></i>
                      </div>
                    ))}
                  </div>

                  {/* System Health / Status Box */}
                  <div className="admin-status-box mt-4 p-3 rounded-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold small text-uppercase text-secondary">
                        Platform System Health
                      </span>
                      <span className="badge bg-success-subtle text-success border border-success-subtle">
                        <i className="bi bi-dot"></i> Operational
                      </span>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>
                        Dispatch Engine: <strong>Active</strong>
                      </span>
                      <span>
                        GPS Radius: <strong>5.0 KM</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;