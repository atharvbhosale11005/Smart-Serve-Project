import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import "./HomeNavbar.css";

function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileRef.current && !mobileRef.current.contains(event.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <nav className={`home-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="home-navbar-inner">
        {/* Brand / Logo */}
        <Link className="navbar-brand" to="/" onClick={closeMobileMenu}>
          <span className="brand-mark">
            <img src="smartserve-logo.png" alt="smartserve" />
          </span>
          <span className="brand-text">SmartServe</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          <NavLink className="nav-link" to="/" end>
            Home
          </NavLink>
          <a className="nav-link" href="#about">
            About Us
          </a>
          <a className="nav-link" href="#team">
            Our Team
          </a>
          <a className="nav-link" href="#contact">
            Contact
          </a>
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <div className="navbar-divider"></div>
          <button className="icon-btn" aria-label="Notifications">
            <i className="bi bi-bell"></i>
            <span className="badge"></span>
          </button>
          <Link className="btn-login" to="/login">
            <i className="bi bi-box-arrow-in-right"></i>
            <span>Login</span>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`hamburger-btn ${mobileOpen ? "active" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileOpen ? "open" : ""}`} ref={mobileRef}>
          <NavLink className="nav-link" to="/" onClick={closeMobileMenu} end>
            Home
          </NavLink>
          <a className="nav-link" href="#about" onClick={closeMobileMenu}>
            About Us
          </a>
          <a className="nav-link" href="#team" onClick={closeMobileMenu}>
            Our Team
          </a>
          <a className="nav-link" href="#contact" onClick={closeMobileMenu}>
            Contact
          </a>
          <div className="nav-divider"></div>
          <div className="mobile-login">
            <Link className="btn-login" to="/login" onClick={closeMobileMenu}>
              <i className="bi bi-box-arrow-in-right"></i>
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default HomeNavbar;