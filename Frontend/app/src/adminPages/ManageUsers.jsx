import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminUsers, updateUserStatus } from "../Services/adminService";
import "./ManageUsers.css";

function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await getAdminUsers(token);
      if (response.status === "success") {
        setUsers(response.data || []);
      } else {
        toast.error(response.data || "Failed to load users");
      }
    } catch (error) {
      console.error("LOAD USERS ERROR:", error);
      toast.error(error.response?.data?.data || "Unable to load customer accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user) => {
    const newBlocked = !user.is_blocked;
    const confirmMsg = newBlocked
      ? `Are you sure you want to BLOCK ${user.full_name}? They will not be able to log in or book services.`
      : `Unblock ${user.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await updateUserStatus(user.user_id, { isBlocked: newBlocked }, token);
      if (res.status === "success") {
        toast.success(newBlocked ? "User blocked successfully" : "User unblocked successfully");
        setUsers(prev =>
          prev.map(u => u.user_id === user.user_id ? { ...u, is_blocked: newBlocked } : u)
        );
        if (selectedUser?.user_id === user.user_id) {
          setSelectedUser(prev => ({ ...prev, is_blocked: newBlocked }));
        }
      } else {
        toast.error(res.data || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user block status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    const newActive = !user.is_active;
    const actionText = newActive ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${actionText} this user's account?`)) return;

    try {
      setActionLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await updateUserStatus(user.user_id, { isActive: newActive }, token);
      if (res.status === "success") {
        toast.success(`User ${actionText}d successfully`);
        setUsers(prev =>
          prev.map(u => u.user_id === user.user_id ? { ...u, is_active: newActive } : u)
        );
        if (selectedUser?.user_id === user.user_id) {
          setSelectedUser(prev => ({ ...prev, is_active: newActive }));
        }
      } else {
        toast.error(res.data || "Action failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user active status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone || "").includes(searchTerm) ||
      (u.city || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "ACTIVE") return u.is_active && !u.is_blocked;
    if (statusFilter === "BLOCKED") return u.is_blocked;
    if (statusFilter === "INACTIVE") return !u.is_active;
    return true;
  });

  const totalUsersCount = users.length;
  const activeCount = users.filter(u => u.is_active && !u.is_blocked).length;
  const blockedCount = users.filter(u => u.is_blocked).length;
  const totalBookingsSum = users.reduce((acc, curr) => acc + (curr.total_requests || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
                <i className="bi bi-people-fill text-danger me-2"></i>
                Customer Management
              </h2>
              <p className="text-muted mb-0">
                View, search, filter and manage registered customer accounts
              </p>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={loadUsers}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh Users
            </button>
          </div>

          {/* User Metrics Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="user-metric-card">
                <div className="metric-icon bg-light-danger text-danger">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{totalUsersCount}</h4>
                  <span className="text-muted small">Total Customers</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="user-metric-card">
                <div className="metric-icon bg-light-success text-success">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{activeCount}</h4>
                  <span className="text-muted small">Active & Verified</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="user-metric-card">
                <div className="metric-icon bg-light-warning text-warning">
                  <i className="bi bi-slash-circle-fill"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{blockedCount}</h4>
                  <span className="text-muted small">Blocked Accounts</span>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="user-metric-card">
                <div className="metric-icon bg-light-primary text-primary">
                  <i className="bi bi-receipt"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{totalBookingsSum}</h4>
                  <span className="text-muted small">Total Bookings Made</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-7">
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0"
                      placeholder="Search customers by name, email, phone or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-light border"
                        onClick={() => setSearchTerm("")}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-md-5 d-flex gap-2 justify-content-md-end">
                  <select
                    className="form-select w-auto"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses ({totalUsersCount})</option>
                    <option value="ACTIVE">Active ({activeCount})</option>
                    <option value="BLOCKED">Blocked ({blockedCount})</option>
                    <option value="INACTIVE">Inactive ({users.filter(u => !u.is_active).length})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Loading customers list...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-x fs-1 text-muted d-block mb-2"></i>
                  <h5>No Customers Found</h5>
                  <p className="text-muted small">
                    {searchTerm ? "Try clearing search filters." : "No registered customers in the system yet."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 user-list-table">
                    <thead className="table-light">
                      <tr>
                        <th>Customer</th>
                        <th>Contact Info</th>
                        <th>Location</th>
                        <th>Bookings</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const initials = (user.full_name || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <tr key={user.user_id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="user-avatar-badge">{initials}</div>
                                <div>
                                  <strong className="d-block text-dark">{user.full_name}</strong>
                                  <small className="text-muted">ID: #{user.user_id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div><i className="bi bi-envelope text-muted me-1"></i>{user.email}</div>
                                <div><i className="bi bi-telephone text-muted me-1"></i>{user.phone || "N/A"}</div>
                              </div>
                            </td>
                            <td>
                              <span className="small text-secondary">
                                {user.city ? `${user.city}${user.area ? `, ${user.area}` : ""}` : "Not specified"}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border fw-bold px-2 py-1">
                                {user.total_requests} bookings
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{formatDate(user.created_at)}</small>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                {user.is_blocked ? (
                                  <span className="badge bg-danger">Blocked</span>
                                ) : user.is_active ? (
                                  <span className="badge bg-success">Active</span>
                                ) : (
                                  <span className="badge bg-secondary">Inactive</span>
                                )}
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => setSelectedUser(user)}
                                  title="View Details"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  className={`btn ${user.is_blocked ? "btn-outline-success" : "btn-outline-warning"}`}
                                  onClick={() => handleToggleBlock(user)}
                                  disabled={actionLoading}
                                  title={user.is_blocked ? "Unblock User" : "Block User"}
                                >
                                  <i className={`bi ${user.is_blocked ? "bi-unlock" : "bi-lock"}`}></i>
                                </button>
                                <button
                                  className={`btn ${user.is_active ? "btn-outline-danger" : "btn-outline-success"}`}
                                  onClick={() => handleToggleActive(user)}
                                  disabled={actionLoading}
                                  title={user.is_active ? "Deactivate Account" : "Activate Account"}
                                >
                                  <i className={`bi ${user.is_active ? "bi-person-x" : "bi-person-check"}`}></i>
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

          {/* User Details Modal */}
          {selectedUser && (
            <div className="modal-backdrop-custom">
              <div className="modal-card-custom shadow-lg">
                <div className="modal-header-custom border-bottom p-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">Customer Account Details</h5>
                  <button className="btn-close" onClick={() => setSelectedUser(null)}></button>
                </div>
                <div className="modal-body-custom p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="user-avatar-large">
                      {(selectedUser.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="mb-0 fw-bold">{selectedUser.full_name}</h4>
                      <p className="text-muted mb-0">Customer ID: #{selectedUser.user_id}</p>
                      <div className="mt-1">
                        {selectedUser.is_blocked ? (
                          <span className="badge bg-danger me-1">Blocked</span>
                        ) : selectedUser.is_active ? (
                          <span className="badge bg-success me-1">Active</span>
                        ) : (
                          <span className="badge bg-secondary me-1">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Email Address</label>
                      <p className="fw-semibold">{selectedUser.email}</p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Phone Number</label>
                      <p className="fw-semibold">{selectedUser.phone || "Not provided"}</p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Default Address / Location</label>
                      <p className="fw-semibold">
                        {selectedUser.address_line1 ? (
                          <>
                            {selectedUser.address_line1}, {selectedUser.area ? `${selectedUser.area}, ` : ""}{selectedUser.city} ({selectedUser.pincode})
                          </>
                        ) : (
                          "No address saved"
                        )}
                      </p>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-muted small mb-1">Total Service Bookings</label>
                      <p className="fw-semibold">{selectedUser.total_requests || 0} services booked</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label text-muted small mb-1">Registration Date</label>
                      <p className="fw-semibold">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>

                  <div className="modal-footer-custom mt-4 pt-3 border-top d-flex justify-content-end gap-2">
                    <button
                      className={`btn ${selectedUser.is_blocked ? "btn-success" : "btn-warning"}`}
                      onClick={() => handleToggleBlock(selectedUser)}
                    >
                      {selectedUser.is_blocked ? "Unblock Account" : "Block Account"}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
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

export default ManageUsers;
