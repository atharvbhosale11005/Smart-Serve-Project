import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import WorkerNavbar from "../components/WorkerNavbar";

import {
    getWorkerProfile,
    updateWorkerProfile,
    getWorkerCategories,
    getAvailability,
    updateAvailability,
    updateWorkerCurrentLocation,
    clearWorkerCurrentLocation
} from "../Services/workerService";

import "./WorkerProfile.css";

function WorkerProfile() {

    // =========================================================
    // LOADING / UI STATE
    // =========================================================

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [activeTab, setActiveTab] = useState("profile");

    // =========================================================
    // CATEGORIES
    // =========================================================

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // =========================================================
    // AVAILABILITY
    // =========================================================

    const [availability, setAvailability] = useState({
        is_available: false
    });

    const [loadingAvailability, setLoadingAvailability] =
        useState(false);

    // =========================================================
    // CURRENT GPS LOCATION
    // =========================================================

    const [locationStatus, setLocationStatus] =
        useState("Location tracking inactive");

    const [workerLocation, setWorkerLocation] =
        useState(null);

    // Browser Geolocation watch ID
    const locationWatchRef = useRef(null);

    // Prevent state updates after component unmount
    const isMountedRef = useRef(true);

    // =========================================================
    // PROFILE
    // =========================================================

    const [profile, setProfile] = useState({
        user_id: "",
        full_name: "",
        email: "",
        phone: "",
        professionalSummary: "",
        experienceYears: "",
        primaryCity: "",
        primaryArea: "",
        approvalStatus: ""
    });

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        isMountedRef.current = true;

        loadProfile();
        loadCategories();
        loadAvailability();

        return () => {

            isMountedRef.current = false;

            // Stop browser GPS watcher
            if (locationWatchRef.current !== null) {

                navigator.geolocation.clearWatch(
                    locationWatchRef.current
                );

                locationWatchRef.current = null;

                console.log(
                    "GPS WATCH CLEANED UP"
                );
            }
        };

    }, []);

    // =========================================================
    // PROFILE
    // =========================================================

    const loadProfile = async () => {

        try {

            setLoading(true);

            const response =
                await getWorkerProfile();

            console.log(
                "WORKER PROFILE:",
                response
            );

            if (response.status !== "success") {

                toast.error(
                    response.data ||
                    "Unable to load profile"
                );

                return;
            }

            const data =
                response.data || {};

            setProfile({

                user_id:
                    data.user_id || "",

                full_name:
                    data.full_name || "",

                email:
                    data.email || "",

                phone:
                    data.phone || "",

                professionalSummary:
                    data.professional_summary || "",

                experienceYears:
                    data.experience_years ?? "",

                primaryCity:
                    data.primary_city || "",

                primaryArea:
                    data.primary_area || "",

                approvalStatus:
                    data.approval_status || ""

            });

        } catch (error) {

            console.error(
                "LOAD PROFILE ERROR:",
                error
            );

            toast.error(
                "Unable to load worker profile"
            );

        } finally {

            setLoading(false);
        }
    };

    // =========================================================
    // PROFILE INPUT
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setProfile(previous => ({
            ...previous,
            [name]: value
        }));
    };

    // =========================================================
    // SAVE PROFILE
    // =========================================================

    const saveProfile = async () => {

        try {

            setSaving(true);

            const response =
                await updateWorkerProfile({

                    fullName:
                        profile.full_name,

                    phone:
                        profile.phone,

                    professionalSummary:
                        profile.professionalSummary,

                    experienceYears:
                        profile.experienceYears,

                    primaryCity:
                        profile.primaryCity,

                    primaryArea:
                        profile.primaryArea

                });

            console.log(
                "UPDATE PROFILE RESPONSE:",
                response
            );

            if (
                response.status === "success"
            ) {

                toast.success(
                    "Profile updated successfully"
                );

                // Update session user name
                try {

                    const existingUser =
                        JSON.parse(
                            sessionStorage.getItem(
                                "user"
                            ) || "{}"
                        );

                    sessionStorage.setItem(
                        "user",
                        JSON.stringify({

                            ...existingUser,

                            full_name:
                                profile.full_name

                        })
                    );

                } catch (storageError) {

                    console.error(
                        "SESSION UPDATE ERROR:",
                        storageError
                    );
                }

                await loadProfile();

            } else {

                toast.error(
                    response.data ||
                    "Failed to update profile"
                );
            }

        } catch (error) {

            console.error(
                "UPDATE PROFILE ERROR:",
                error
            );

            toast.error(
                error.response?.data ||
                error.message ||
                "Unable to update profile"
            );

        } finally {

            setSaving(false);
        }
    };

    // =========================================================
    // CATEGORIES
    // =========================================================

    const loadCategories = async () => {

        try {

            setLoadingCategories(true);

            const response =
                await getWorkerCategories();

            console.log(
                "WORKER CATEGORIES:",
                response
            );

            if (
                response.status === "success"
            ) {

                setCategories(
                    response.data || []
                );

            } else {

                toast.error(
                    response.data ||
                    "Unable to load service categories"
                );
            }

        } catch (error) {

            console.error(
                "LOAD CATEGORIES ERROR:",
                error
            );

            toast.error(
                "Unable to load service categories"
            );

        } finally {

            setLoadingCategories(false);
        }
    };

    // =========================================================
    // AVAILABILITY
    // =========================================================

    const loadAvailability = async () => {

        try {

            setLoadingAvailability(true);

            const response =
                await getAvailability();

            console.log(
                "AVAILABILITY RESPONSE:",
                response
            );

            if (
                response.status !== "success"
            ) {

                toast.error(
                    response.data ||
                    "Unable to load availability"
                );

                return;
            }

            const data =
                response.data || {};

            const isAvailable =
                Boolean(data.is_available);

            if (isMountedRef.current) {

                setAvailability({

                    ...data,

                    is_available:
                        isAvailable

                });
            }

            // -------------------------------------------------
            // IMPORTANT
            // If worker is already available,
            // start current GPS tracking.
            // -------------------------------------------------

            if (isAvailable) {

                startLocationTracking();
            }

        } catch (error) {

            console.error(
                "LOAD AVAILABILITY ERROR:",
                error
            );

            toast.error(
                "Unable to load availability"
            );

        } finally {

            if (isMountedRef.current) {

                setLoadingAvailability(false);
            }
        }
    };

    // =========================================================
    // START CURRENT LOCATION TRACKING
    // =========================================================

    const startLocationTracking = () => {

        // Prevent duplicate GPS watches
        if (
            locationWatchRef.current !== null
        ) {

            console.log(
                "GPS tracking already running"
            );

            return;
        }

        // Browser support
        if (
            !navigator.geolocation
        ) {

            setLocationStatus(
                "Geolocation is not supported by this browser"
            );

            toast.error(
                "Your browser does not support location services."
            );

            return;
        }

        setLocationStatus(
            "Requesting your current location..."
        );

        const watchId =
            navigator.geolocation.watchPosition(

                async (position) => {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;

                    const accuracy =
                        position.coords.accuracy;

                    const timestamp =
                        new Date().toISOString();

                    console.log(
                        "WORKER CURRENT LOCATION:",
                        {
                            latitude,
                            longitude,
                            accuracy,
                            timestamp
                        }
                    );

                    // -----------------------------------------
                    // UPDATE FRONTEND
                    // -----------------------------------------

                    if (
                        isMountedRef.current
                    ) {

                        setWorkerLocation({

                            latitude,
                            longitude,
                            accuracy,
                            timestamp

                        });

                        setLocationStatus(
                            "Live location active"
                        );
                    }

                    // -----------------------------------------
                    // UPDATE BACKEND
                    // -----------------------------------------

                    try {

                        const response =
                            await updateWorkerCurrentLocation(
                                latitude,
                                longitude,
                                accuracy
                            );

                        console.log(
                            "WORKER LOCATION SERVER RESPONSE:",
                            response
                        );

                    } catch (error) {

                        console.error(
                            "CURRENT LOCATION API ERROR:",
                            error.response?.data ||
                            error.message ||
                            error
                        );
                    }
                },

                // -----------------------------------------
                // GPS ERROR
                // -----------------------------------------

                (error) => {

                    console.error(
                        "WORKER GPS ERROR:",
                        error
                    );

                    if (
                        !isMountedRef.current
                    ) {
                        return;
                    }

                    switch (error.code) {

                        case error.PERMISSION_DENIED:

                            setLocationStatus(
                                "Location permission denied"
                            );

                            toast.error(
                                "Please allow location permission."
                            );

                            break;

                        case error.POSITION_UNAVAILABLE:

                            setLocationStatus(
                                "Location unavailable"
                            );

                            break;

                        case error.TIMEOUT:

                            setLocationStatus(
                                "Location request timed out"
                            );

                            break;

                        default:

                            setLocationStatus(
                                "Unable to get location"
                            );
                    }
                },

                // -----------------------------------------
                // GPS OPTIONS
                // -----------------------------------------

                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
                }
            );

        locationWatchRef.current =
            watchId;

        console.log(
            "GPS WATCH STARTED:",
            watchId
        );
    };

    // =========================================================
    // STOP CURRENT LOCATION TRACKING
    // =========================================================

    const stopLocationTracking = async () => {

        // -----------------------------------------
        // STOP BROWSER GPS
        // -----------------------------------------

        if (
            locationWatchRef.current !== null
        ) {

            navigator.geolocation.clearWatch(
                locationWatchRef.current
            );

            console.log(
                "GPS WATCH STOPPED:",
                locationWatchRef.current
            );

            locationWatchRef.current =
                null;
        }

        // -----------------------------------------
        // CLEAR SERVER LOCATION
        // -----------------------------------------

        try {

            const response =
                await clearWorkerCurrentLocation();

            console.log(
                "WORKER LOCATION CLEARED:",
                response
            );

        } catch (error) {

            console.error(
                "CLEAR SERVER LOCATION ERROR:",
                error.response?.data ||
                error.message ||
                error
            );
        }

        // -----------------------------------------
        // CLEAR FRONTEND LOCATION
        // -----------------------------------------

        if (
            isMountedRef.current
        ) {

            setWorkerLocation(null);

            setLocationStatus(
                "Location tracking inactive"
            );
        }
    };

    // =========================================================
    // AVAILABILITY TOGGLE
    // =========================================================

    const handleAvailability = async () => {

        const newAvailability =
            !availability.is_available;

        try {

            setLoadingAvailability(true);

            // -----------------------------------------
            // UPDATE BACKEND FIRST
            // -----------------------------------------

            const response =
                await updateAvailability({

                    isAvailable:
                        newAvailability

                });

            console.log(
                "AVAILABILITY UPDATE:",
                response
            );

            if (
                response.status !== "success"
            ) {

                toast.error(
                    response.data ||
                    "Unable to update availability"
                );

                return;
            }

            // -----------------------------------------
            // AVAILABLE
            // -----------------------------------------

            if (
                newAvailability
            ) {

                setAvailability(
                    previous => ({

                        ...previous,

                        is_available:
                            true

                    })
                );

                toast.success(
                    "You are now available for work"
                );

                // Start GPS
                startLocationTracking();
            }

            // -----------------------------------------
            // UNAVAILABLE
            // -----------------------------------------

            else {

                setAvailability(
                    previous => ({

                        ...previous,

                        is_available:
                            false

                    })
                );

                // Stop GPS immediately
                await stopLocationTracking();

                toast.info(
                    "You are now unavailable"
                );
            }

        } catch (error) {

            console.error(
                "AVAILABILITY UPDATE ERROR:",
                error
            );

            toast.error(
                error.response?.data ||
                error.message ||
                "Unable to update availability"
            );

        } finally {

            setLoadingAvailability(false);
        }
    };

    // =========================================================
    // FORMAT GPS VALUES
    // =========================================================

    const formatLatitude = () => {
        if (workerLocation?.latitude == null) return "N/A";
        return Number(workerLocation.latitude).toFixed(6);
    };

    const formatLongitude = () => {
        if (workerLocation?.longitude == null) return "N/A";
        return Number(workerLocation.longitude).toFixed(6);
    };

    const formatAccuracy = () => {
        if (workerLocation?.accuracy == null) return "N/A";
        return `${Math.round(Number(workerLocation.accuracy))} meters`;
    };

    const formatLastUpdated = () => {
        if (!workerLocation?.timestamp) return "Not available";
        return new Date(workerLocation.timestamp).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // =========================================================
    // LOADING SCREEN
    // =========================================================

    if (loading) {

        return (

            <div className="dashboard-shell">

                <WorkerNavbar />

                <main className="dashboard-main">

                    <div className="container-fluid p-4">

                        <div className="text-center mt-5">

                            <div
                                className="spinner-border text-primary"
                            ></div>

                            <p className="mt-3">
                                Loading Worker Profile...
                            </p>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="worker-profile-wrapper">

            <div className="dashboard-shell">

                <WorkerNavbar />

                <main className="dashboard-main">

                    <div className="container-fluid p-4">

                        {/* =================================================
                            PAGE HEADER
                        ================================================= */}

                        <div className="page-header">

                            <div>

                                <h2 className="page-title">

                                    <i className="bi bi-person-workspace"></i>

                                    Worker Profile

                                </h2>

                                <p className="page-subtitle">

                                    Manage your professional profile,
                                    services and availability.

                                </p>

                            </div>

                            <span
                                className={`status-badge ${
                                    availability.is_available
                                        ? "status-badge-available"
                                        : "status-badge-unavailable"
                                }`}
                            >

                                <span className="status-dot"></span>

                                {availability.is_available
                                    ? "Available"
                                    : "Unavailable"}

                            </span>

                        </div>

                        {/* =================================================
                            TABS
                        ================================================= */}

                        <ul className="profile-tabs">

                            <li className="nav-item">

                                <button
                                    className={`nav-link ${
                                        activeTab === "profile"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setActiveTab("profile")
                                    }
                                >

                                    <i className="bi bi-person"></i>

                                    Profile

                                </button>

                            </li>

                            <li className="nav-item">

                                <button
                                    className={`nav-link ${
                                        activeTab === "availability"
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setActiveTab("availability")
                                    }
                                >

                                    <i className="bi bi-geo-alt"></i>

                                    Availability & Location

                                </button>

                            </li>

                        </ul>

                        {/* =================================================
                            PROFILE TAB
                        ================================================= */}

                        {activeTab === "profile" && (

                            <div className="profile-card">

                                <div className="card-header card-header-primary">

                                    <h5>

                                        <i className="bi bi-person-circle"></i>

                                        Profile Information

                                    </h5>

                                </div>

                                <div className="card-body">

                                    {/* ---------------------------------
                                        PERSONAL INFORMATION
                                    --------------------------------- */}

                                    <h6 className="section-title">

                                        Personal Information

                                    </h6>

                                    <div className="form-grid">

                                        <div className="form-group">

                                            <label className="form-label">

                                                Full Name

                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="full_name"
                                                value={
                                                    profile.full_name || ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter your full name"
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label className="form-label">

                                                Email

                                            </label>

                                            <input
                                                type="email"
                                                className="form-control form-control-readonly"
                                                value={
                                                    profile.email || ""
                                                }
                                                disabled
                                                readOnly
                                            />

                                            <small className="form-hint">

                                                Email cannot be changed.

                                            </small>

                                        </div>

                                    </div>

                                    <div className="form-grid">

                                        <div className="form-group">

                                            <label className="form-label">

                                                Phone Number

                                            </label>

                                            <input
                                                type="tel"
                                                className="form-control"
                                                name="phone"
                                                maxLength="10"
                                                value={
                                                    profile.phone || ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter your phone number"
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label className="form-label">

                                                Experience

                                                <span className="form-label-hint">
                                                    {" "}(Years)
                                                </span>

                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                name="experienceYears"
                                                min="0"
                                                value={
                                                    profile.experienceYears ?? ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="e.g. 5"
                                            />

                                        </div>

                                    </div>

                                    {/* ---------------------------------
                                        PROFESSIONAL INFORMATION
                                    --------------------------------- */}

                                    <hr className="section-divider" />

                                    <h6 className="section-title">

                                        Professional Information

                                    </h6>

                                    <div className="form-group-full">

                                        <label className="form-label">

                                            Professional Summary

                                        </label>

                                        <textarea
                                            className="form-control form-control-textarea"
                                            name="professionalSummary"
                                            rows="4"
                                            value={
                                                profile.professionalSummary || ""
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Tell customers about your expertise and experience..."
                                        />

                                    </div>

                                    <div className="form-grid">

                                        <div className="form-group">

                                            <label className="form-label">

                                                Primary City

                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="primaryCity"
                                                value={
                                                    profile.primaryCity || ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter your city"
                                            />

                                        </div>

                                        <div className="form-group">

                                            <label className="form-label">

                                                Primary Area

                                                <span className="form-label-hint">
                                                    {" "}(Profile Information)
                                                </span>

                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                name="primaryArea"
                                                value={
                                                    profile.primaryArea || ""
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter your primary area"
                                            />

                                            <small className="form-hint">

                                                This is profile information only.
                                                It is not used for live tracking
                                                or worker assignment.

                                            </small>

                                        </div>

                                    </div>


                                    {/* ---------------------------------
                                        SAVE
                                    --------------------------------- */}

                                    <div className="form-actions">

                                        <button
                                            className="btn btn-primary"
                                            onClick={saveProfile}
                                            disabled={saving}
                                        >

                                            {saving ? (

                                                <>

                                                    <span
                                                        className="spinner-border spinner-border-sm"
                                                    ></span>

                                                    Saving...

                                                </>

                                            ) : (

                                                <>

                                                    <i className="bi bi-save"></i>

                                                    Update Profile

                                                </>

                                            )}

                                        </button>

                                    </div>

                                    {/* =================================================
                                        SERVICE CATEGORIES
                                    ================================================= */}

                                    <hr className="section-divider" />

                                    <div className="section-header">

                                        <h5>

                                            <i className="bi bi-grid"></i>

                                            Service Categories

                                        </h5>

                                    </div>

                                    {loadingCategories ? (

                                        <div className="loading-state">

                                            <div className="spinner-border"></div>

                                            <p>Loading categories...</p>

                                        </div>

                                    ) : categories.length === 0 ? (

                                        <div className="empty-state">

                                            <i className="bi bi-grid display-4"></i>

                                            <p>

                                                No service categories assigned.

                                            </p>

                                        </div>

                                    ) : (

                                        <div className="categories-container">

                                            <div className="categories-grid">

                                                {categories.map(
                                                    category => (

                                                        <div
                                                            key={
                                                                category.category_id
                                                            }
                                                            className="category-badge"
                                                        >

                                                            <i className="bi bi-tools"></i>

                                                            <span>

                                                                {
                                                                    category.category_name
                                                                }

                                                            </span>

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>
                                    )}

                                    <div className="info-alert">

                                        <i className="bi bi-info-circle"></i>

                                        Service categories are assigned during
                                        worker registration.

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* =================================================
                            AVAILABILITY TAB
                        ================================================= */}

                        {activeTab === "availability" && (

                            <div className="profile-card">

                                <div className="card-header card-header-warning">

                                    <h5>

                                        <i className="bi bi-geo-alt-fill"></i>

                                        Availability & Live Location

                                    </h5>

                                </div>

                                <div className="card-body">

                                    {/* ---------------------------------
                                        AVAILABILITY
                                    --------------------------------- */}

                                    <div className="availability-card">

                                        <div className="availability-info">

                                            <h5>

                                                <i className="bi bi-person-check"></i>

                                                Work Availability

                                            </h5>

                                            <p>

                                                {availability.is_available

                                                    ? "You are currently available to receive service requests."

                                                    : "You are currently unavailable for new service requests."}

                                            </p>

                                        </div>

                                        <div className="availability-toggle">

                                            <div className="toggle-switch">

                                                <input
                                                    type="checkbox"
                                                    id="availability-toggle"
                                                    checked={
                                                        availability.is_available ||
                                                        false
                                                    }
                                                    onChange={
                                                        handleAvailability
                                                    }
                                                    disabled={
                                                        loadingAvailability
                                                    }
                                                />

                                                <label 
                                                    htmlFor="availability-toggle"
                                                    className="toggle-label"
                                                >
                                                    <span className="toggle-slider"></span>
                                                    <span className="toggle-text">
                                                        {availability.is_available ? "ON" : "OFF"}
                                                    </span>
                                                </label>

                                            </div>

                                        </div>

                                    </div>

                                    {/* ---------------------------------
                                        LIVE LOCATION
                                    --------------------------------- */}

                                    <div
                                        className={`location-alert ${
                                            availability.is_available
                                                ? "location-alert-active"
                                                : "location-alert-inactive"
                                        }`}
                                    >

                                        <div className="location-alert-content">

                                            <i
                                                className={`bi ${
                                                    availability.is_available
                                                        ? "bi-broadcast-pin"
                                                        : "bi-geo-alt"
                                                }`}
                                            ></i>

                                            <div>

                                                <h6>

                                                    {availability.is_available
                                                        ? "Live Location Active"
                                                        : "Live Location Inactive"}

                                                </h6>

                                                <p>

                                                    {locationStatus}

                                                </p>

                                            </div>

                                        </div>

                                        {/* ---------------------------------
                                            GPS LOCATION CARD - FIXED
                                        --------------------------------- */}

                                        {workerLocation && (

                                            <div className="gps-location-card">

                                                <div className="gps-card-header">

                                                    <i className="bi bi-crosshair"></i>

                                                    <span>Current GPS Location</span>

                                                    <span className="gps-status-dot gps-status-active"></span>

                                                </div>

                                                <div className="gps-details-grid">

                                                    {/* Latitude - FIXED */}
                                                    <div className="gps-detail">

                                                        <span className="gps-label">

                                                            Latitude

                                                        </span>

                                                        <strong className="gps-value">

                                                            {formatLatitude()}

                                                        </strong>

                                                    </div>

                                                    {/* Longitude - FIXED */}
                                                    <div className="gps-detail">

                                                        <span className="gps-label">

                                                            Longitude

                                                        </span>

                                                        <strong className="gps-value">

                                                            {formatLongitude()}

                                                        </strong>

                                                    </div>

                                                    {/* Accuracy - FIXED */}
                                                    <div className="gps-detail">

                                                        <span className="gps-label">

                                                            Accuracy

                                                        </span>

                                                        <strong className="gps-value">

                                                            {formatAccuracy()}

                                                        </strong>

                                                    </div>

                                                    {/* Last Updated - FIXED */}
                                                    <div className="gps-detail">

                                                        <span className="gps-label">

                                                            Last Updated

                                                        </span>

                                                        <strong className="gps-value">

                                                            {formatLastUpdated()}

                                                        </strong>

                                                    </div>

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                    {/* ---------------------------------
                                        HOW LOCATION WORKS
                                    --------------------------------- */}

                                    <div className="info-alert info-alert-primary">

                                        <i className="bi bi-info-circle"></i>

                                        <div>

                                            <h6>

                                                How Live Location Works

                                            </h6>

                                            <ul>

                                                <li>

                                                    Your browser GPS is activated
                                                    when you become available.

                                                </li>

                                                <li>

                                                    Your current coordinates are
                                                    continuously sent to SmartServe.

                                                </li>

                                                <li>

                                                    Your <strong>current GPS location</strong>
                                                    is used as the starting point
                                                    for service tracking.

                                                </li>

                                                <li>

                                                    Your profile's primary area is
                                                    <strong> not used</strong> for
                                                    live tracking.

                                                </li>

                                                <li>

                                                    The customer's destination is
                                                    the exact address selected
                                                    during booking.

                                                </li>

                                                <li>

                                                    Live location tracking stops
                                                    when you become unavailable.

                                                </li>

                                            </ul>

                                        </div>

                                    </div>

                                    {/* ---------------------------------
                                        CURRENT STATE
                                    --------------------------------- */}

                                    <div className="state-cards">

                                        <div className="state-card">

                                            <i className="bi bi-person-check-fill text-success"></i>

                                            <h6>

                                                Availability

                                            </h6>

                                            <strong>

                                                {availability.is_available
                                                    ? "AVAILABLE"
                                                    : "UNAVAILABLE"}

                                            </strong>

                                        </div>

                                        <div className="state-card">

                                            <i className="bi bi-geo-alt-fill text-primary"></i>

                                            <h6>

                                                GPS Status

                                            </h6>

                                            <strong>

                                                {workerLocation
                                                    ? "ACTIVE"
                                                    : "INACTIVE"}

                                            </strong>

                                        </div>

                                        <div className="state-card">

                                            <i className="bi bi-shield-check text-success"></i>

                                            <h6>

                                                Tracking Mode

                                            </h6>

                                            <strong>

                                                GPS BASED

                                            </strong>

                                        </div>

                                    </div>

                                    {/* ---------------------------------
                                        WEEKLY SCHEDULE
                                    --------------------------------- */}

                                    <hr className="section-divider" />

                                    <h5 className="section-title">

                                        <i className="bi bi-calendar-week"></i>

                                        Weekly Schedule

                                    </h5>

                                    <div className="info-alert info-alert-info">

                                        <i className="bi bi-info-circle"></i>

                                        Weekly availability schedules are
                                        managed by the administrator.

                                    </div>

                                </div>

                            </div>
                        )}

                    </div>

                </main>

            </div>

        </div>
    );
}

export default WorkerProfile;