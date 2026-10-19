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

  // Password state
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    loadProfile();
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
        setProfile(res.data);
      } else {
        toast.error(res.data || "Failed to load profile");
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
      const res = await updateAdminProfile({
        full_name: profile.full_name.trim(),
        phone: profile.phone ? profile.phone.trim() : null
      }, token);

      if (res.status === "success") {
        toast.success("Admin profile updated successfully");
        // Update local session
        const currentLocal = JSON.parse(sessionStorage.getItem("user") || "{}");
        sessionStorage.setItem("user", JSON.stringify({
          ...currentLocal,
          fullName: profile.full_name.trim(),
          full_name: profile.full_name.trim()
        }));
      } else {
        toast.error(res.data || "Update failed");
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
    if (!passwords.currentPassword) {
      toast.warning("Please enter your current password");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 4) {
      toast.warning("Password should be at least 4 characters");
      return;
    }

    try {
      setChangingPass(true);
      const token = sessionStorage.getItem("token");
      const res = await changeAdminPassword(passwords, token);
      if (res.status === "success") {
        toast.success("Password changed successfully");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast.error(res.data || "Failed to change password");
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
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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
                <i className="bi bi-gear-fill text-danger me-2"></i>
                Admin Profile & System Settings
              </h2>
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
            <div className="row g-4">
              {/* Left Column: Admin Profile */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <i className="bi bi-person-fill text-danger"></i>
                      Administrator Profile
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleUpdateProfile}>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Email Address</label>
                        <input
                          type="email"
                          className="form-control bg-light"
                          value={profile.email}
                          disabled
                        />
                        <small className="text-muted">Email cannot be changed directly.</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={profile.full_name}
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
                          <span className="badge bg-danger px-3 py-2 fs-6">
                            <i className="bi bi-shield-lock-fill me-1"></i> {profile.role_name} (Superuser)
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold">Admin Since</label>
                        <p className="text-muted mb-0">{formatDate(profile.created_at)}</p>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-danger px-4"
                        disabled={updatingProfile}
                      >
                        {updatingProfile ? "Saving Changes..." : "Update Profile"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Security & System Config */}
              <div className="col-lg-6">
                {/* Change Password Card */}
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <i className="bi bi-key-fill text-danger"></i>
                      Change Admin Password
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <form onSubmit={handleChangePassword}>
                      <div className="mb-3">
                        <label className="form-label small fw-bold">Current Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.currentPassword}
                          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-bold">New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-4">
                        <label className="form-label small fw-bold">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.confirmPassword}
                          onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-outline-danger px-4"
                        disabled={changingPass}
                      >
                        {changingPass ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Platform Configuration Info Card */}
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <i className="bi bi-sliders text-danger"></i>
                      SmartServe Platform Settings
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <div>
                          <strong>Worker Dispatch Algorithm</strong>
                          <p className="text-muted small mb-0">Haversine GPS Nearest Available Match</p>
                        </div>
                        <span className="badge bg-success">Active</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <div>
                          <strong>Max Matching Radius</strong>
                          <p className="text-muted small mb-0">Search limit for nearby technicians</p>
                        </div>
                        <span className="badge bg-light text-dark border">5.0 KM</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                        <div>
                          <strong>Live Tracking Updates</strong>
                          <p className="text-muted small mb-0">Worker GPS live tracker</p>
                        </div>
                        <span className="badge bg-success">Enabled</span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>Database Connection</strong>
                          <p className="text-muted small mb-0">MySQL Connection Pool</p>
                        </div>
                        <span className="badge bg-success">Connected</span>
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
