import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import { getAdminUsers, updateUserStatus } from "../Services/adminService";
import "./ManageUsers.css";

/* ===== Embedded Crisp SVG Icons ===== */
const Icons = {
  Eye: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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
  )
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        toast.error(
          response.error || (typeof response.data === "string" ? response.data : "Failed to load users")
        );
      }
    } catch (error) {
      console.error("LOAD USERS ERROR:", error);
      toast.error(error?.response?.data?.error || error?.response?.data?.data || "Unable to load customer accounts");
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
        setUsers((prev) =>
          prev.map((u) => (u.user_id === user.user_id ? { ...u, is_blocked: newBlocked } : u))
        );
        if (selectedUser?.user_id === user.user_id) {
          setSelectedUser((prev) => ({ ...prev, is_blocked: newBlocked }));
        }
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Action failed"));
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
        setUsers((prev) =>
          prev.map((u) => (u.user_id === user.user_id ? { ...u, is_active: newActive } : u))
        );
        if (selectedUser?.user_id === user.user_id) {
          setSelectedUser((prev) => ({ ...prev, is_active: newActive }));
        }
      } else {
        toast.error(res.error || (typeof res.data === "string" ? res.data : "Action failed"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user active status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").includes(searchTerm) ||
      (u.city || "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return u.is_active && !u.is_blocked;
    if (statusFilter === "BLOCKED") return u.is_blocked;
    if (statusFilter === "INACTIVE") return !u.is_active;
    return true;
  });

  const totalUsersCount = users.length;
  const activeCount = users.filter((u) => u.is_active && !u.is_blocked).length;
  const blockedCount = users.filter((u) => u.is_blocked).length;
  const totalBookingsSum = users.reduce((acc, curr) => acc + (Number(curr.total_requests) || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          
          {/* Header - Wrap Enabled for Mobile */}
          <div className="page-header d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Customer Management</h2>
              <p className="text-muted mb-0">
                View, search, filter and manage registered customer accounts
              </p>
            </div>
            <button className="btn-modern-refresh" onClick={loadUsers}>
              <Icons.Refresh />
              <span>Refresh Users</span>
            </button>
          </div>

          {/* User Metrics: 4-Column Grid */}
          <div className="metrics-grid mb-4">
            <div className="user-metric-card">
              <div className="metric-icon-box bg-soft-red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{totalUsersCount}</h4>
                <span className="text-muted small">Total Customers</span>
              </div>
            </div>

            <div className="user-metric-card">
              <div className="metric-icon-box bg-soft-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{activeCount}</h4>
                <span className="text-muted small">Active & Verified</span>
              </div>
            </div>

            <div className="user-metric-card">
              <div className="metric-icon-box bg-soft-yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{blockedCount}</h4>
                <span className="text-muted small">Blocked Accounts</span>
              </div>
            </div>

            <div className="user-metric-card">
              <div className="metric-icon-box bg-soft-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div>
                <h4 className="mb-0 fw-bold">{totalBookingsSum}</h4>
                <span className="text-muted small">Total Bookings Made</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card shadow-sm border-0 mb-4 modern-filter-card">
            <div className="card-body p-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-7">
                  <div className="modern-search-box">
                    <span className="search-icon"><Icons.Search /></span>
                    <input
                      type="text"
                      className="form-control border-0 bg-transparent"
                      placeholder="Search customers by name, email, phone or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="search-clear-btn" onClick={() => setSearchTerm("")}>✕</button>
                    )}
                  </div>
                </div>
                <div className="col-md-5 d-flex gap-2 justify-content-md-end">
                  <select
                    className="form-select w-auto modern-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses ({totalUsersCount})</option>
                    <option value="ACTIVE">Active ({activeCount})</option>
                    <option value="BLOCKED">Blocked ({blockedCount})</option>
                    <option value="INACTIVE">Inactive ({users.filter((u) => !u.is_active).length})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card shadow-sm border-0 table-card-elevated">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-danger" role="status"></div>
                  <p className="mt-2 text-muted">Loading customers list...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-5">
                  <div className="empty-state-icon">👥</div>
                  <h5 className="mt-3">No Customers Found</h5>
                  <p className="text-muted small">
                    {searchTerm ? "Try clearing search filters." : "No registered customers in the system yet."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 user-list-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Contact Info</th>
                        <th>Location</th>
                        <th>Bookings</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th className="text-end" style={{ minWidth: "270px" }}>Actions</th>
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
                                  <strong className="d-block text-dark user-name-label">{user.full_name}</strong>
                                  <small className="text-muted">ID: #{user.user_id}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <div className="text-dark fw-semibold">{user.email}</div>
                                <div className="text-muted">{user.phone || "N/A"}</div>
                              </div>
                            </td>
                            <td>
                              <span className="small text-secondary">
                                {user.city ? `${user.city}${user.area ? `, ${user.area}` : ""}` : "Not specified"}
                              </span>
                            </td>
                            <td>
                              <span className="bookings-pill">
                                {user.total_requests ?? 0} bookings
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{formatDate(user.created_at)}</small>
                            </td>
                            <td>
                              {user.is_blocked ? (
                                <span className="custom-badge badge-rejected">Blocked</span>
                              ) : user.is_active ? (
                                <span className="custom-badge badge-approved">Active</span>
                              ) : (
                                <span className="custom-badge badge-neutral">Inactive</span>
                              )}
                            </td>
                            <td className="text-end">
                              
                              {/* Wrapped Action Buttons Container */}
                              <div className="action-buttons-cell">
                                <button
                                  className="action-btn-mid btn-mid-view"
                                  onClick={() => setSelectedUser(user)}
                                  title="View Account Details"
                                >
                                  <Icons.Eye />
                                  <span>View</span>
                                </button>

                                <button
                                  className={`action-btn-mid ${user.is_blocked ? "btn-mid-unblock" : "btn-mid-block"}`}
                                  onClick={() => handleToggleBlock(user)}
                                  disabled={actionLoading}
                                  title={user.is_blocked ? "Unblock Customer" : "Block Customer"}
                                >
                                  {user.is_blocked ? <Icons.Unlock /> : <Icons.Lock />}
                                  <span>{user.is_blocked ? "Unblock" : "Block"}</span>
                                </button>

                                <button
                                  className={`action-btn-mid ${user.is_active ? "btn-mid-deactivate" : "btn-mid-activate"}`}
                                  onClick={() => handleToggleActive(user)}
                                  disabled={actionLoading}
                                  title={user.is_active ? "Deactivate Customer" : "Activate Customer"}
                                >
                                  <Icons.Power />
                                  <span>{user.is_active ? "Deactivate" : "Activate"}</span>
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
                          <span className="custom-badge badge-rejected">Blocked</span>
                        ) : selectedUser.is_active ? (
                          <span className="custom-badge badge-approved">Active</span>
                        ) : (
                          <span className="custom-badge badge-neutral">Inactive</span>
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
                      <p className="fw-semibold">{selectedUser.total_requests ?? 0} services booked</p>
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