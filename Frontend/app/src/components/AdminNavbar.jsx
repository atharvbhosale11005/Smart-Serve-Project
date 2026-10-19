import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { LoginContext } from "../App";
import "./AdminNavbar.css";

/**
 * Usage:
 * <div className="dashboard-shell">
 *   <AdminNavbar />
 *   <main className="dashboard-main">{page content}</main>
 * </div>
 */
function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(LoginContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const links = [
    { to: "/admin/dashboard", icon: "bi-house-fill", label: "Dashboard" },
    { to: "/admin/users", icon: "bi-people", label: "Users" },
    { to: "/admin/workers", icon: "bi-briefcase", label: "Workers" },
    { to: "/admin/services", icon: "bi-list-check", label: "Services" },
    { to: "/admin/analytics", icon: "bi-graph-up", label: "Analytics" },
    { to: "/admin/settings", icon: "bi-gear", label: "Settings" },
  ];

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        <i className={`bi ${mobileOpen ? "bi-x-lg" : "bi-list"}`}></i>
      </button>

      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`admin-navbar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-header">
          <Link to="/admin/dashboard" className="sidebar-brand">
            <i className="bi bi-shield-lock-fill"></i>
            {!collapsed && <span>SmartServe</span>}
          </Link>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Collapse sidebar"
          >
            <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="avatar-circle">
            <i className="bi bi-person-fill"></i>
          </div>
          {!collapsed && (
            <div className="user-meta">
              <span className="user-name">
                {user?.fullName || user?.full_name || "Admin"}
              </span>
              <span className="user-role">Administrator</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul>
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={isActive(link.to) ? "active" : ""}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? link.label : undefined}
                >
                  <i className={`bi ${link.icon}`}></i>
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminNavbar;