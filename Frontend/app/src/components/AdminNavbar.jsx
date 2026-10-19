import { useState, useEffect, useContext } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { LoginContext } from "../App";
import "./AdminNavbar.css";

/* ===== Zero-Dependency High-Clarity SVG Icons ===== */
const Icons = {
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Workers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20" />
      <path d="M12 2v6" />
      <path d="M4.93 10.93a8 8 0 0 1 14.14 0" />
      <rect x="4" y="18" width="16" height="4" rx="1" />
    </svg>
  ),
  Services: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Analytics: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Access global auth context matching WorkerNavbar and UserNavbar
  const loginContext = useContext(LoginContext);
  const logout = loginContext?.logout;

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("admin_navbar_collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const [adminUser, setAdminUser] = useState({
    name: "Admin",
    role: "ADMINISTRATOR"
  });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdminUser({
          name: parsed.full_name || parsed.name || "Admin",
          role: parsed.role_name || "ADMINISTRATOR"
        });
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("admin_navbar_collapsed", String(newState));
  };

  const handleLogout = () => {
    // 1. Update global App context state so route guards know user is logged out
    if (typeof logout === "function") {
      logout();
    }

    // 2. Clear stored auth credentials
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.clear();

    toast.success("Logged out successfully");

    // 3. Navigate cleanly to login and prevent backwards navigation
    navigate("/login", { replace: true });
  };

  const navItems = [
    { title: "Dashboard", path: "/admin/dashboard", icon: Icons.Dashboard },
    { title: "Users", path: "/admin/users", icon: Icons.Users },
    { title: "Workers", path: "/admin/workers", icon: Icons.Workers },
    { title: "Services", path: "/admin/services", icon: Icons.Services },
    { title: "Analytics", path: "/admin/analytics", icon: Icons.Analytics },
    { title: "Settings", path: "/admin/settings", icon: Icons.Settings }
  ];

  return (
    <>
      {/* Mobile Drawer Trigger */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open Navigation Menu"
      >
        <Icons.Menu />
      </button>

      {/* Backdrop for mobile drawer */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Main Admin Sidebar */}
      <aside
        className={`admin-navbar ${collapsed ? "collapsed" : ""} ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Top Header & Admin Profile */}
        <div className="sidebar-top-section">
          <div className="sidebar-header">
            <NavLink to="/admin/dashboard" className="sidebar-brand">
              <div className="brand-icon-box">
                <Icons.Logo />
              </div>
              <span className="brand-text">SmartServe</span>
            </NavLink>
            <button
              className="collapse-btn"
              onClick={toggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Icons.ChevronLeft />
            </button>
          </div>

          <div className="sidebar-user">
            <div className="avatar-circle">
              {adminUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <span className="user-name">{adminUser.name}</span>
              <span className="user-role">{adminUser.role}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    data-title={item.title}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    <div className="nav-icon">
                      <ItemIcon />
                    </div>
                    <span className="nav-label">{item.title}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Centered Logout Button */}
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

export default AdminNavbar;