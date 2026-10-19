import { useState } from "react";
import { Link } from "react-router-dom";
import smartServeLogo from "../assets/smartserve-logo.png";
import ThemeToggle from "../components/ThemeToggle";
import "./Home.css";

/* =========================================================
   SmartServe — Home page (PUBLIC landing page)

   Navigation model:
   - "Services"  → in-page anchor  → #popular-services
   - "About Us"  → in-page anchor  → #about
   - "Contact"   → in-page anchor  → #contact
   - "Login"     → real route      → /login
   - "Register"  → real route      → /register

   No external Services page is required.
   ========================================================= */

function Home() {
    return (
        <div className="home" id="top">
            <HomeNavbar />

            <main className="home__main">
                <HeroSection />
                <HeroVisual />
                <PopularServices />
                <StaggeredServiceCards />
                <OurServices />
                <AboutSection />
                <ContactSection />
                <HomeCTA />
            </main>

            <HomeFooter />

            <ThemeToggle className="is-floating" />
        </div>
    );
}

/* =========================================================
   Photography
   Free-to-use, royalty-free photos from Pexels (no attribution
   required — https://www.pexels.com/license/). Swap any of
   these for your own shoot later; just keep the same variable
   names so nothing else in this file needs to change.
   ========================================================= */
const PHOTOS = {
    heroPrimary:
        "https://images.pexels.com/photos/17842832/pexels-photo-17842832.jpeg?auto=compress&cs=tinysrgb&w=1400",
    heroSecondary:
        "https://images.pexels.com/photos/5493653/pexels-photo-5493653.jpeg?auto=compress&cs=tinysrgb&w=1400",
    electrical:
        "https://images.pexels.com/photos/17924298/pexels-photo-17924298.jpeg?auto=compress&cs=tinysrgb&w=900",
    burner:
        "https://images.pexels.com/photos/3722212/pexels-photo-3722212.jpeg?auto=compress&cs=tinysrgb&w=900",
    painting:
        "https://images.pexels.com/photos/18369835/pexels-photo-18369835.jpeg?auto=compress&cs=tinysrgb&w=900",
    bathroom:
        "https://images.pexels.com/photos/4021256/pexels-photo-4021256.jpeg?auto=compress&cs=tinysrgb&w=900",
    wallRepair:
        "https://images.pexels.com/photos/5691637/pexels-photo-5691637.jpeg?auto=compress&cs=tinysrgb&w=900"
};

/* =========================================================
   Icon set
   All icons use `currentColor` for strokes/fills, so their
   color is controlled entirely by CSS (parent `color`) — this
   is what lets every icon re-tint automatically when the
   `[data-theme="dark"]` block swaps the --ink-* variables.
   Still used for the small StaggeredServiceCards badges.
   ========================================================= */

function IconSmartHome(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M3.5 11.5 12 4l8.5 7.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M5.5 10v8.5a1 1 0 0 0 1 1H10v-5.2h4V19.5h3.5a1 1 0 0 0 1-1V10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.8 7.2a3 3 0 0 1 3 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <circle cx="17.8" cy="10.2" r="0.9" fill="currentColor" />
        </svg>
    );
}

function IconElectrical(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M13 3 5.5 13.2h4.7L9.6 21l8.9-11.3h-5.1L13 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconFurniture(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M6.5 10.5V6.8a2.3 2.3 0 0 1 2.3-2.3h6.4a2.3 2.3 0 0 1 2.3 2.3v3.7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.8 10.5h14.4a1 1 0 0 1 1 1.15l-.72 5.05a1.4 1.4 0 0 1-1.39 1.2H5.9a1.4 1.4 0 0 1-1.39-1.2l-.72-5.05a1 1 0 0 1 1.01-1.15Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M6 17.9 5.3 20M18 17.9l.7 2.1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconSecurity(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M12 3.4 19 6v5.4c0 4.6-3 7.9-7 9.2-4-1.3-7-4.6-7-9.2V6l7-2.6Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="m9 12.1 2.1 2.2L15.3 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconBurner(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M12 3.5c1.2 1.7 1.7 3 1.7 4.1a1.7 1.7 0 0 1-3.4 0c0-.5.15-1 .5-1.6-1.2.9-2.1 2.5-2.1 4.1a3.3 3.3 0 1 0 6.6 0c0-2.7-1.5-5-3.3-6.6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <path
                d="M5.5 20.5h13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <path
                d="M7 20.5v-1.8a5 5 0 0 1 10 0v1.8"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconPaint(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M4 8.2h9.5a1.8 1.8 0 0 1 1.8 1.8v1a1.8 1.8 0 0 1-1.8 1.8H4z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path d="M4 8.2v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path
                d="M15.3 10.7h2a1.2 1.2 0 0 1 1.2 1.2v1.6c0 1.6-1.3 2.9-2.9 2.9h0a1.9 1.9 0 0 1-1.9-1.9v-.4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            <path
                d="M15.6 16.4c0 1.6-.9 2.9-2.6 2.9s-2.7-1.3-2.7-2.9c0-1.1 1.1-2.1 2.1-3 .2-.2.5-.2.7 0 1 .9 2.5 1.9 2.5 3Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function IconBathroom(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <path
                d="M12 3.5c1.8 2.6 3 4.6 3 6.4a3 3 0 1 1-6 0c0-1.8 1.2-3.8 3-6.4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M4.5 16.2h15M6 16.2v2.1a1.7 1.7 0 0 0 1.7 1.7h8.6a1.7 1.7 0 0 0 1.7-1.7v-2.1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.5 13.5c1.1.7 1.7 1.6 1.7 2.7"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}

function IconWall(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
            <rect
                x="3.5"
                y="4.5"
                width="17"
                height="15"
                rx="1.4"
                stroke="currentColor"
                strokeWidth="1.6"
            />
            <path
                d="M3.5 9.5h17M3.5 14.5h17M9 4.5v5M15 9.5v5M9 14.5v5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
            />
            <path
                d="m14.3 12.6 3.1 3.1-1.3 1.3-3.1-3.1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="currentColor"
                fillOpacity="0.12"
            />
        </svg>
    );
}

/* =========================================================
   Public Navbar
   ========================================================= */
function HomeNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const openMobile = () => setMobileOpen(true);
    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            <button
                type="button"
                className={`home-nav__toggle ${mobileOpen ? "is-hidden" : ""}`}
                onClick={openMobile}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                aria-controls="home-nav"
            >
                <span className="home-nav__toggle-bar" />
                <span className="home-nav__toggle-bar" />
                <span className="home-nav__toggle-bar" />
            </button>

            <div
                className={`home-nav__backdrop ${mobileOpen ? "is-active" : ""}`}
                onClick={closeMobile}
                aria-hidden="true"
            />

            <header className="home-nav">
                <div className="home-nav__inner">
                    <a
                        href="#top"
                        className="home-nav__brand"
                        onClick={closeMobile}
                    >
                        <img
                            src={smartServeLogo}
                            alt="SmartServe"
                            className="home-nav__logo"
                        />
                        <span className="home-nav__brand-text">SmartServe</span>
                    </a>

                    <nav
                        id="home-nav"
                        className={`home-nav__links ${mobileOpen ? "is-open" : ""}`}
                    >
                        <button
                            type="button"
                            className="home-nav__close"
                            onClick={closeMobile}
                            aria-label="Close navigation"
                        >
                            <span aria-hidden="true">×</span>
                        </button>

                        <ul>
                            <li>
                                <a
                                    href="#popular-services"
                                    onClick={closeMobile}
                                    className="home-nav__anchor"
                                >
                                    Services
                                </a>
                            </li>

                            <li>
                                <a
                                    href="#about"
                                    onClick={closeMobile}
                                    className="home-nav__anchor"
                                >
                                    About Us
                                </a>
                            </li>

                            <li>
                                <a
                                    href="#contact"
                                    onClick={closeMobile}
                                    className="home-nav__anchor"
                                >
                                    Contact
                                </a>
                            </li>
                        </ul>

                        <Link
                            to="/login"
                            className="home-nav__login"
                            onClick={closeMobile}
                        >
                            Login
                        </Link>
                    </nav>
                </div>
            </header>
        </>
    );
}

/* =========================================================
   Hero
   ========================================================= */
function HeroSection() {
    return (
        <section className="hero">
            <div className="home-container">
                <p className="hero__eyebrow">
                    <span className="hero__eyebrow-line" />
                    Book Trusted Professionals
                    <span className="hero__eyebrow-line" />
                </p>

                <h1 className="hero__heading">
                    Skilled Professionals,
                    <br />
                    <em>Exceptional</em> Home Service
                </h1>

                <p className="hero__sub">
                    From repairs to installations — SmartServe connects you with
                    verified, background-checked experts near you. Transparent
                    pricing. Real reviews. On-time service.
                </p>

                <div className="hero__cta">
                    <a href="#popular-services" className="btn btn--primary">
                        Book a Service
                    </a>
                    <a href="#our-services" className="btn btn--ghost">
                        Explore Services →
                    </a>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Hero visual
   ========================================================= */
function HeroVisual() {
    return (
        <section className="hero-visual">
            <div className="home-container">
                <div className="hero-visual__grid">
                    <figure className="hero-visual__figure hero-visual__figure--primary">
                        <div
                            className="hero-visual__image hero-visual__image--primary"
                            style={{ backgroundImage: `url(${PHOTOS.heroPrimary})` }}
                            role="img"
                            aria-label="SmartServe professional at work"
                        />
                    </figure>

                    <figure className="hero-visual__figure hero-visual__figure--secondary">
                        <div
                            className="hero-visual__image hero-visual__image--secondary"
                            style={{ backgroundImage: `url(${PHOTOS.heroSecondary})` }}
                            role="img"
                            aria-label="SmartServe professional at work"
                        />
                    </figure>

                    <div className="hero-visual__caption">
                        <h3 className="hero-visual__caption-title">
                            Instant Home
                            <br />
                            Service Booking
                        </h3>
                        <p className="hero-visual__caption-text">
                            Choose a service, pick a slot, and a verified
                            professional is on the way — usually within 90
                            minutes.
                        </p>

                        <div className="hero-visual__stat">
                            <span className="hero-visual__stat-value">97%</span>
                            <span className="hero-visual__stat-label">
                                Customer Satisfaction
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Popular Services  (anchor target of navbar "Services")
   ========================================================= */
function PopularServices() {
    return (
        <section className="popular" id="popular-services">
            <div className="home-container">
                <div className="popular__grid">
                    <div className="popular__left">
                        <p className="section-label">Popular Services</p>
                        <h2 className="section-heading">
                            Explore Our Most
                            <br />
                            Trusted Services Today
                        </h2>
                    </div>

                    <div className="popular__right">
                        <p className="popular__copy">
                            Book reliable professionals for custom home
                            projects, maintenance tasks, energy-efficient
                            upgrades, and smart device installations — all
                            vetted, insured, and rated by real customers.
                        </p>
                        <a href="#our-services" className="link-arrow">
                            Explore Now
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Staggered Service Cards
   ========================================================= */
function StaggeredServiceCards() {
    const cards = [
        {
            id: "smart-home",
            title: "Smart Home Setup",
            description:
                "Connected lights, thermostats, hubs and voice assistants — installed and configured end-to-end.",
            tone: "blue",
            Icon: IconSmartHome
        },
        {
            id: "electrical",
            title: "Electrical Repairs",
            description:
                "Certified electricians for wiring, fuse boxes, switches, sockets and safety audits.",
            tone: "orange",
            Icon: IconElectrical
        },
        {
            id: "furniture",
            title: "Furniture Assembly",
            description:
                "Flat-pack, modular or custom — assembled, levelled and anchored by trained hands.",
            tone: "gold",
            Icon: IconFurniture
        },
        {
            id: "security",
            title: "Home Security Installation",
            description:
                "Cameras, smart locks, sensors and alarm panels — professionally mounted and tested.",
            tone: "plum",
            Icon: IconSecurity
        }
    ];

    return (
        <section className="stagger">
            <div className="home-container">
                <div className="stagger__grid">
                    {cards.map(({ Icon, ...card }) => (
                        <article
                            key={card.id}
                            className={`stagger__card stagger__card--${card.tone}`}
                        >
                            <div className="stagger__icon" aria-hidden="true">
                                <Icon className="stagger__icon-glyph" />
                            </div>
                            <h3 className="stagger__title">{card.title}</h3>
                            <p className="stagger__text">{card.description}</p>
                            <a
                                href="#our-services"
                                className="stagger__link"
                                aria-label={`Learn more about ${card.title}`}
                            >
                                Learn more →
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Our Services — image gallery
   ========================================================= */
function OurServices() {
    const services = [
        { name: "Electrical Repairs", tone: "slate", photo: PHOTOS.electrical },
        { name: "Burner Service", tone: "amber", photo: PHOTOS.burner },
        { name: "Interior Painting", tone: "terracotta", photo: PHOTOS.painting },
        { name: "Bathroom Cleaning", tone: "sea", photo: PHOTOS.bathroom },
        { name: "Wall Repair", tone: "ink", photo: PHOTOS.wallRepair }
    ];

    return (
        <section className="services" id="our-services">
            <div className="home-container">
                <header className="services__header">
                    <div>
                        <p className="section-label">Our Services</p>
                        <h2 className="section-heading">
                            Complete Home Care,
                            <br />
                            Made Simple
                        </h2>
                    </div>
                    <p className="services__lede">
                        A single, trusted place for every home task — from
                        a dripping tap to a full-room refresh.
                    </p>
                </header>

                <div className="services__gallery">
                    {services.map((service) => (
                        <a
                            href="#contact"
                            key={service.name}
                            className={`service-card service-card--${service.tone}`}
                        >
                            <div
                                className="service-card__image"
                                style={{ backgroundImage: `url(${service.photo})` }}
                                role="img"
                                aria-label={service.name}
                            />
                            <div className="service-card__overlay" />
                            <div className="service-card__body">
                                <h3 className="service-card__title">
                                    {service.name}
                                </h3>
                                <span className="service-card__meta">
                                    Book now →
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   About — anchor target of "About Us"
   ========================================================= */
function AboutSection() {
    return (
        <section className="about" id="about">
            <div className="home-container">
                <div className="about__grid">
                    <div className="about__left">
                        <p className="section-label">About SmartServe</p>
                        <h2 className="section-heading">
                            A home service platform
                            <br />
                            built on trust.
                        </h2>
                    </div>
                    <div className="about__right">
                        <p className="about__copy">
                            SmartServe brings verified, background-checked
                            professionals to your doorstep. Every provider
                            is vetted, every booking is tracked, and every
                            service is backed by transparent pricing and
                            real customer reviews.
                        </p>
                        <div className="about__stats">
                            <div className="about__stat">
                                <span className="about__stat-value">97%</span>
                                <span className="about__stat-label">
                                    Satisfaction
                                </span>
                            </div>
                            <div className="about__stat">
                                <span className="about__stat-value">10k+</span>
                                <span className="about__stat-label">
                                    Bookings
                                </span>
                            </div>
                            <div className="about__stat">
                                <span className="about__stat-value">24/7</span>
                                <span className="about__stat-label">
                                    Support
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Contact — anchor target of "Contact"
   ========================================================= */
function ContactSection() {
    return (
        <section className="contact" id="contact">
            <div className="home-container">
                <div className="contact__grid">
                    <div className="contact__left">
                        <p className="section-label">Get In Touch</p>
                        <h2 className="section-heading">
                            Questions?
                            <br />
                            We're here to help.
                        </h2>
                    </div>
                    <div className="contact__right">
                        <ul className="contact__list">
                            <li>
                                <span className="contact__label">Email</span>
                                <a href="mailto:hello@smartserve.app">
                                    hello@smartserve.app
                                </a>
                            </li>
                            <li>
                                <span className="contact__label">Phone</span>
                                <a href="tel:+910000000000">
                                    +91 00000 00000
                                </a>
                            </li>
                            <li>
                                <span className="contact__label">Hours</span>
                                <span>Mon–Sun · 8:00 AM – 10:00 PM</span>
                            </li>
                        </ul>
                        <a href="#popular-services" className="btn btn--primary">
                            Book a Service
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Closing CTA
   ========================================================= */
function HomeCTA() {
    return (
        <section className="home-cta">
            <div className="home-container">
                <div className="home-cta__panel">
                    <p className="section-label">Ready when you are</p>
                    <h2 className="section-heading home-cta__heading">
                        One booking away
                        <br />
                        from a better home.
                    </h2>
                    <div className="home-cta__actions">
                        <a href="#popular-services" className="btn btn--primary">
                            Book a Service
                        </a>
                        <Link to="/login" className="btn btn--ghost">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* =========================================================
   Footer
   ========================================================= */
function HomeFooter() {
    return (
        <footer className="home-footer">
            <div className="home-container">
                <div className="home-footer__top">
                    <div className="home-footer__brand">
                        <img
                            src={smartServeLogo}
                            alt="SmartServe"
                            className="home-footer__logo"
                        />
                        <span className="home-footer__brand-text">
                            SmartServe
                        </span>
                    </div>

                    <div className="home-footer__col">
                        <h4>Company</h4>
                        <ul>
                            <li><a href="#about">About</a></li>
                            <li><a href="#popular-services">Services</a></li>
                            <li><a href="#contact">Contact</a></li>
                        </ul>
                    </div>

                    <div className="home-footer__col">
                        <h4>Account</h4>
                        <ul>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/register">Register</Link></li>
                        </ul>
                    </div>

                    <div className="home-footer__col">
                        <h4>Support</h4>
                        <ul>
                            <li><a href="#contact">Help Center</a></li>
                            <li><a href="#contact">Report an Issue</a></li>
                        </ul>
                    </div>
                </div>

                <div className="home-footer__bottom">
                    <span>
                        © {new Date().getFullYear()} SmartServe. All rights reserved.
                    </span>
                    <span className="home-footer__legal">
                        <span>Privacy</span>
                        <span className="dot">·</span>
                        <span>Terms</span>
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default Home;