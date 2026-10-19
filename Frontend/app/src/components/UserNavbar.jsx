import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { LoginContext } from "../App";
import smartServeLogo from "../assets/smartserve-logo.png";
import "./UserNavbar.css";

function UserNavbar() {

    const navigate = useNavigate();
    const { logout } = useContext(LoginContext);

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const user = JSON.parse(
        sessionStorage.getItem("user") || "{}"
    );

    const userName =
        user.fullName ||
        user.full_name ||
        user.name ||
        "User";

    // =====================================================
    // AVATAR INITIALS
    // Used as a text fallback inside the avatar circle so the
    // user is always identifiable even if an icon font fails
    // to load.
    // =====================================================

    const userInitials =
        userName
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "U";

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        logout();

        navigate("/login", {
            replace: true
        });

    };

    // =====================================================
    // HEADER CONTROL — dual purpose, single source of truth
    // Desktop: toggles the collapsed/expanded rail width.
    // Mobile (drawer open): closes the drawer instead. This
    // replaces the old "circular arrow that does nothing
    // useful on mobile" behavior — there is only ever ONE
    // active control at a time; the external hamburger button
    // is not rendered at all while the drawer is open (below).
    // =====================================================

    const handleHeaderToggle = () => {

        if (mobileOpen) {
            setMobileOpen(false);
        } else {
            setCollapsed(!collapsed);
        }

    };

    // =====================================================
    // CLOSE ON ESCAPE (mobile drawer)
    // =====================================================

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

    // =====================================================
    // USER NAVIGATION
    // Paths preserved exactly as in the original source —
    // routing config was not provided, so nothing was guessed.
    // =====================================================

    const links = [

        {
            to: "/user/dashboard",
            icon: "bi-house-fill",
            label: "Dashboard"
        },

        {
            to: "/user/services",
            icon: "bi-grid-fill",
            label: "Available Services"
        },

        {
            to: "/user/requests",
            icon: "bi-file-earmark-text-fill",
            label: "My Requests"
        },

        {
            to: "/user/history",
            icon: "bi-clock-history",
            label: "History"
        },

        {
            to: "/user/feedback",
            icon: "bi-star-fill",
            label: "Feedback & Ratings"
        },

        {
            to: "/user/profile",
            icon: "bi-person-circle",
            label: "Profile"
        }

    ];

    return (

        <>

            {/* =================================================
                MOBILE TOGGLE
                Only exists in the DOM while the drawer is closed.
                This is what guarantees exactly one visible mobile
                control at any given time — no CSS hiding tricks,
                no duplicate button sitting on top of the drawer.
            ================================================= */}

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


            {/* =================================================
                MOBILE BACKDROP
            ================================================= */}

            <div
                className={`sidebar-backdrop ${
                    mobileOpen
                        ? "active"
                        : ""
                }`}
                onClick={() =>
                    setMobileOpen(false)
                }
                aria-hidden="true"
            ></div>


            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`
                    user-navbar
                    ${collapsed ? "collapsed" : ""}
                    ${mobileOpen ? "mobile-open" : ""}
                `}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="sidebar-header">

                    <Link
                        to="/user/dashboard"
                        className="sidebar-brand"
                        onClick={() =>
                            setMobileOpen(false)
                        }
                    >

                        <span className="sidebar-brand-logo">

                            <img
                                src={smartServeLogo}
                                alt="SmartServe"
                            />

                        </span>

                        <span className="sidebar-brand-text">
                            SmartServe
                        </span>

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
                                collapsed
                                    ? "bi-chevron-right"
                                    : "bi-chevron-left"
                            }`}
                        ></i>

                    </button>

                </div>


                {/* =================================================
                    USER INFORMATION
                ================================================= */}

                <div className="sidebar-user">

                    <div
                        className="avatar-circle"
                        title={userName}
                    >

                        <span>
                            {userInitials}
                        </span>

                    </div>


                    <div className="user-meta">

                        <span className="user-name">
                            {userName}
                        </span>

                        <span className="user-role">
                            User
                        </span>

                    </div>

                </div>


                {/* =================================================
                    NAVIGATION
                    Active state comes from React Router's NavLink,
                    which recomputes on every route change — no
                    manual activeItem/selectedMenu state anywhere.
                ================================================= */}

                <nav className="sidebar-nav">

                    <ul>

                        {links.map((link) => (

                            <li key={link.to}>

                                <NavLink
                                    to={link.to}
                                    className={({ isActive }) =>
                                        isActive ? "active" : ""
                                    }
                                    onClick={() =>
                                        setMobileOpen(false)
                                    }
                                    title={link.label}
                                >

                                    <i
                                        className={`bi ${link.icon}`}
                                    ></i>

                                    <span>
                                        {link.label}
                                    </span>

                                </NavLink>

                            </li>

                        ))}

                    </ul>

                </nav>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="sidebar-footer">

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >

                        <i className="bi bi-box-arrow-right"></i>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>

        </>

    );

}

export default UserNavbar;