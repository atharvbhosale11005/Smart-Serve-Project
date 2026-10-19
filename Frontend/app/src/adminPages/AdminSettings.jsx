import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminNavbar from "../components/AdminNavbar";
import {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
} from "../Services/adminService";
import "./AdminSettings.css";

/* ===== Embedded Crisp SVG Icons ===== */
const Icons = {
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
};

function AdminSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_name: "ADMIN",
    created_at: ""
  });
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPass, setChangingPass] = useState(false);

  // Show/Hide Password States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const res = await getAdminProfile(token);
      if (res.status === "success") {
        setProfile(res.data || {});
      } else {
        toast.error(typeof res.data === "string" ? res.data : "Failed to load profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Unable to load admin settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile.full_name?.trim()) {
      toast.warning("Full name is required");
      return;
    }
    try {
      setUpdatingProfile(true);
      const token = sessionStorage.getItem("token");
      const res = await updateAdminProfile(
        {
          full_name: profile.full_name.trim(),
          phone: profile.phone ? profile.phone.trim() : null
        },
        token
      );

      if (res.status === "success") {
        toast.success("Admin profile updated successfully");
        const currentLocal = JSON.parse(sessionStorage.getItem("user") || "{}");
        sessionStorage.setItem(
          "user",
          JSON.stringify({
            ...currentLocal,
            fullName: profile.full_name.trim(),
            full_name: profile.full_name.trim()
          })
        );
      } else {
        toast.error(typeof res.data === "string" ? res.data : "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validations matching backend requirements
    if (!passwords.currentPassword) {
      toast.warning("Please enter your current password");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    try {
      setChangingPass(true);
      const token = sessionStorage.getItem("token");
      
      // FIX: Send confirmPassword since backend strictly checks for it
      const res = await changeAdminPassword(
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword
        },
        token
      );

      if (res.status === "success") {
        toast.success("Password changed successfully");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast.error(
          typeof res.data === "string" ? res.data : "Failed to change password"
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Password update error");
    } finally {
      setChangingPass(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
  };

  return (
    <div className="dashboard-shell">
      <AdminNavbar />

      <main className="dashboard-main">
        <div className="dashboard-content">
          
          {/* Header */}
          <div className="page-header d-flex flex-wrap gap-3 justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Admin Profile & System Settings</h2>
              <p className="text-muted mb-0">
                Manage your administrator account credentials, platform security, and system configuration
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status"></div>
              <p className="mt-2 text-muted">Loading settings...</p>
            </div>
          ) : (
            <div className="row g-4 settings-grid">
              
              {/* Left Column: Admin Profile */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 settings-card h-100">
                  <div className="card-header bg-white py-3 d-flex align-items-center gap-2">
                    <div className="icon-box bg-soft-red text-danger"><Icons.User /></div>
                    <h5 className="mb-0 fw-bold">Administrator Profile</h5>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleUpdateProfile}>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Email Address</label>
                        <input
                          type="email"
                          className="form-control bg-light"
                          value={profile.email || ""}
                          disabled
                        />
                        <small className="text-muted">Email cannot be changed directly.</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.full_name || ""}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Phone Number</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. +91 9876543210"
                          value={profile.phone || ""}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Account Role</label>
                        <div>
                          <span className="badge bg-danger px-3 py-2 fs-6 role-badge">
                            <i className="bi bi-shield-lock-fill me-1"></i>
                            {profile.role_name || "ADMIN"} (Superuser)
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold">Admin Since</label>
                        <p className="text-muted mb-0 fw-semibold">{formatDate(profile.created_at)}</p>
                      </div>

                      <button type="submit" className="btn btn-danger px-4 action-btn" disabled={updatingProfile}>
                        {updatingProfile ? "Saving Changes..." : "Update Profile"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Security & System Config */}
              <div className="col-lg-6">
                
                {/* Change Password */}
                <div className="card shadow-sm border-0 settings-card mb-4">
                  <div className="card-header bg-white py-3 d-flex align-items-center gap-2">
                    <div className="icon-box bg-soft-yellow text-warning"><Icons.Lock /></div>
                    <h5 className="mb-0 fw-bold">Change Admin Password</h5>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleChangePassword}>
                      
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Current Password</label>
                        <div className="input-group password-group">
                          <input
                            type={showCurrent ? "text" : "password"}
                            className="form-control"
                            value={passwords.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            required
                          />
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCurrent(!showCurrent)}>
                            {showCurrent ? <Icons.EyeOff /> : <Icons.Eye />}
                          </button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">New Password</label>
                        <div className="input-group password-group">
                          <input
                            type={showNew ? "text" : "password"}
                            className="form-control"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            required
                          />
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNew(!showNew)}>
                            {showNew ? <Icons.EyeOff /> : <Icons.Eye />}
                          </button>
                        </div>
                        <small className="text-muted">Must be at least 6 characters.</small>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold">Confirm New Password</label>
                        <div className="input-group password-group">
                          <input
                            type={showConfirm ? "text" : "password"}
                            className="form-control"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            required
                          />
                          <button type="button" className="btn btn-outline-secondary" onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? <Icons.EyeOff /> : <Icons.Eye />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="btn btn-outline-danger px-4 action-btn" disabled={changingPass}>
                        {changingPass ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Platform Settings */}
                <div className="card shadow-sm border-0 settings-card">
                  <div className="card-header bg-white py-3 d-flex align-items-center gap-2">
                    <div className="icon-box bg-soft-blue text-primary"><Icons.Settings /></div>
                    <h5 className="mb-0 fw-bold">SmartServe Platform Settings</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="d-flex flex-column gap-3">
                      
                      <div className="setting-row">
                        <div>
                          <strong>Worker Dispatch Algorithm</strong>
                          <p className="text-muted small mb-0">Haversine GPS Nearest Available Match</p>
                        </div>
                        <span className="custom-badge badge-approved">Active</span>
                      </div>

                      <div className="setting-row">
                        <div>
                          <strong>Max Matching Radius</strong>
                          <p className="text-muted small mb-0">Search limit for nearby technicians</p>
                        </div>
                        <span className="custom-badge badge-neutral">5.0 KM</span>
                      </div>

                      <div className="setting-row">
                        <div>
                          <strong>Live Tracking Updates</strong>
                          <p className="text-muted small mb-0">Worker GPS live tracker</p>
                        </div>
                        <span className="custom-badge badge-approved">Enabled</span>
                      </div>

                      <div className="setting-row border-0 pb-0">
                        <div>
                          <strong>Database Connection</strong>
                          <p className="text-muted small mb-0">MySQL Connection Pool</p>
                        </div>
                        <span className="custom-badge badge-approved">Connected</span>
                      </div>

                    </div>
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

export default AdminSettings;