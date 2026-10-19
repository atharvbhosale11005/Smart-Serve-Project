import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { LoginContext } from "../App";
import smartServeLogo from "../assets/smartserve-logo.png";
import "./UserNavbar.css";

/* ===== Zero-Dependency High-Clarity Vector SVGs ===== */
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Services: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Requests: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
};

function UserNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(LoginContext);

  // Persist collapsed state across reloads
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("user_navbar_collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userName = user.fullName || user.full_name || user.name || "User";

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const userInitials =
    userName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  const handleLogout = () => {
    if (logout) logout();
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleHeaderToggle = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    } else {
      const next = !collapsed;
      setCollapsed(next);
      localStorage.setItem("user_navbar_collapsed", String(next));
    }
  };

  const links = [
    {
      to: "/user/dashboard",
      icon: Icons.Dashboard,
      label: "Dashboard"
    },
    {
      to: "/user/services",
      icon: Icons.Services,
      label: "Available Services"
    },
    {
      to: "/user/requests",
      icon: Icons.Requests,
      label: "My Requests"
    },
    {
      to: "/user/history",
      icon: Icons.History,
      label: "History"
    },
    {
      to: "/user/profile",
      icon: Icons.Profile,
      label: "Profile"
    }
  ];

  return (
    <>
      {/* Mobile Drawer Trigger */}
      {!mobileOpen && (
        <button
          className="sidebar-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Icons.Menu />
        </button>
      )}

      {/* Backdrop */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside
        className={`user-navbar ${
          collapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Top Header & User Info */}
        <div className="sidebar-top-section">
          <div className="sidebar-header">
            <Link
              to="/user/dashboard"
              className="sidebar-brand"
              onClick={() => setMobileOpen(false)}
            >
              <div className="sidebar-brand-logo">
                <img src={smartServeLogo} alt="SmartServe" />
              </div>
              <span className="sidebar-brand-text">SmartServe</span>
            </Link>

            <button
              className="collapse-btn"
              onClick={handleHeaderToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icons.ChevronLeft />
            </button>
          </div>

          <div className="sidebar-user">
            <div className="avatar-circle" title={userName}>
              <span>{userInitials}</span>
            </div>
            <div className="user-meta">
              <span className="user-name">{userName}</span>
              <span className="user-role">Customer</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <ul>
            {links.map((link) => {
              const LinkIcon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    data-title={link.label}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="nav-icon">
                      <LinkIcon />
                    </div>
                    <span className="nav-label">{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Centered Logout */}
        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <div className="logout-icon">
              <Icons.Logout />
            </div>
            <span className="logout-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default UserNavbar;