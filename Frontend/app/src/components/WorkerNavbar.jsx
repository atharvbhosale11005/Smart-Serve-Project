import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { LoginContext } from "../App";
import smartServeLogo from "../assets/smartserve-logo.png";
import "./WorkerNavbar.css";

function WorkerNavbar() {
  const navigate = useNavigate();
  const { logout } = useContext(LoginContext);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workerName, setWorkerName] = useState("Worker");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    if (user) {
      setWorkerName(user.full_name || user.fullName || "Worker");
    }
  }, []);

  // ===========================================================
  // AVATAR INITIALS
  // Rendered as text inside the avatar circle so the worker is
  // always identifiable even if an icon font fails to load.
  // ===========================================================
  const workerInitials =
    workerName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "W";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // ===========================================================
  // HEADER CONTROL — dual purpose, single source of truth
  // Desktop: toggles the collapsed/expanded rail width.
  // Mobile (drawer open): closes the drawer instead. The
  // external hamburger button is not rendered at all while the
  // drawer is open, so there is only ever ONE visible control.
  // ===========================================================
  const handleHeaderToggle = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // ===========================================================
  // CLOSE ON ESCAPE (mobile drawer)
  // ===========================================================
  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const links = [
    {
      to: "/worker/dashboard",
      icon: "bi-grid-1x2-fill",
      label: "Dashboard"
    },
    {
      to: "/worker/requests",
      icon: "bi-inbox-fill",
      label: "My Requests"
    },
    {
      to: "/worker/profile",
      icon: "bi-person-workspace",
      label: "Profile"
    },
  ];

  return (
    <>
      {/* Mobile Toggle — only rendered while the drawer is
          closed, so it can never sit on top of the open drawer
          or duplicate the header's close control. */}
      {!mobileOpen && (
        <button
          className="sidebar-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={false}
        >
          <span className="wave-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6.5q3-3 6 0t6 0 6 0" />
              <path d="M2 12q3-3 6 0t6 0 6 0" />
              <path d="M2 17.5q3-3 6 0t6 0 6 0" />
            </svg>
          </span>
        </button>
      )}

      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`worker-navbar ${
          collapsed ? "collapsed" : ""
        } ${mobileOpen ? "mobile-open" : ""}`}
      >
        {/* Brand */}
        <div className="sidebar-header">
          <Link
            className="sidebar-brand"
            to="/worker/dashboard"
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar-brand-logo">
              <img src={smartServeLogo} alt="SmartServe" />
            </span>

            <span className="sidebar-brand-text">SmartServe</span>
          </Link>

          <button
            className="collapse-btn"
            onClick={handleHeaderToggle}
            aria-label={
              mobileOpen
                ? "Close navigation"
                : collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            aria-expanded={mobileOpen ? true : undefined}
          >
            <i
              className={`bi ${
                collapsed ? "bi-chevron-right" : "bi-chevron-left"
              }`}
            ></i>
          </button>
        </div>

        {/* Worker Info */}
        <div className="sidebar-user">
          <div className="avatar-circle" title={workerName}>
            <span>{workerInitials}</span>
          </div>

          <div className="user-meta">
            <span className="user-name">{workerName}</span>
            <span className="user-role">Service Provider</span>
          </div>
        </div>

        {/* Navigation — active state comes from React Router's
            NavLink (exact match via `end`), matching the original
            strict-equality behavior but recomputing correctly on
            every route change. No manual active-item state. */}
        <nav className="sidebar-nav">
          <ul>
            {links.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="version-text">SmartServe v1.0</div>

          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default WorkerNavbar;