import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { LoginContext } from "../App";
import smartServeLogo from "../assets/smartserve-logo.png";
import "./WorkerNavbar.css";

/* ===== Zero-Dependency High-Clarity Vector SVGs ===== */
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Requests: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
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

function WorkerNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(LoginContext);

  // Persist collapsed state across reloads
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("worker_navbar_collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workerName, setWorkerName] = useState("Worker");

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "null");
      if (user) {
        setWorkerName(user.full_name || user.fullName || "Worker");
      }
    } catch {
      // Keep default
    }
  }, []);

  // Close mobile drawer on navigation
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

  const workerInitials =
    workerName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "W";

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
      localStorage.setItem("worker_navbar_collapsed", String(next));
    }
  };

  const links = [
    {
      to: "/worker/dashboard",
      icon: Icons.Dashboard,
      label: "Dashboard"
    },
    {
      to: "/worker/requests",
      icon: Icons.Requests,
      label: "My Requests"
    },
    {
      to: "/worker/profile",
      icon: Icons.Profile,
      label: "Profile"
    }
  ];

  return (
    <>
      {/* Mobile Drawer Toggle */}
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
        className={`worker-navbar ${
          collapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Top Header & Worker Info */}
        <div className="sidebar-top-section">
          <div className="sidebar-header">
            <Link
              className="sidebar-brand"
              to="/worker/dashboard"
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
            <div className="avatar-circle" title={workerName}>
              <span>{workerInitials}</span>
            </div>
            <div className="user-meta">
              <span className="user-name">{workerName}</span>
              <span className="user-role">Service Provider</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <ul>
            {links.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end
                    data-title={item.label}
                    className={({ isActive }) => (isActive ? "active" : "")}
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="nav-icon">
                      <ItemIcon />
                    </div>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Centered Logout */}
        <div className="sidebar-footer">
          <div className="version-text">SmartServe v1.0</div>
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

export default WorkerNavbar;