import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import WorkerNavbar from "../components/WorkerNavbar";
import { getWorkerDashboard } from "../Services/workerService";

import "./WorkerDashboard.css";

function WorkerDashboard() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [workerName, setWorkerName] = useState("Worker");

    const [dashboardData, setDashboardData] = useState({

        worker: {

            fullName: "Worker",
            email: "",
            phone: "",
            bio: "",
            city: "",
            experienceYears: 0,

            available: false,

            approvalStatus: "PENDING",

            latitude: null,
            longitude: null,
            locationAccuracy: null,
            locationUpdatedAt: null

        },

        stats: {

            totalCategories: 0,
            completedJobs: 0,
            averageRating: 0,
            pendingRequests: 0,
            activeJobs: 0

        },

        recentActivities: []

    });


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    const fetchDashboardData = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const token = sessionStorage.getItem("token");

            if (!token) {
                setError("Session expired. Please login again.");
                return;
            }

            const response = await getWorkerDashboard(token);

            if (response && response.status === "success") {

                setDashboardData(response.data || {});

                const name = response.data?.worker?.fullName;

                if (name) {
                    setWorkerName(name);
                }

            } else {
                setError(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to load dashboard"
                );
            }

        } catch (err) {

            console.error(
                "WORKER DASHBOARD ERROR:",
                err.response?.data || err.message || err
            );

            setError("Unable to load dashboard data.");

        } finally {

            setLoading(false);
        }

    }, []);


    useEffect(() => {

        const user = JSON.parse(sessionStorage.getItem("user") || "{}");

        setWorkerName(
            user.full_name ||
            user.fullName ||
            user.name ||
            "Worker"
        );

        fetchDashboardData();

        const handleStorageChange = (e) => {
            if (e.key === "workerAvailability" || e.key === "user") {
                fetchDashboardData();
            }
        };

        // Named handler so the SAME reference can be removed. The
        // previous version registered an inline arrow for "focus"
        // but removed fetchDashboardData — a different reference —
        // so the listener survived unmount and stacked up on every
        // remount, firing a duplicate request per mount.
        const handleRefresh = () => {
            fetchDashboardData();
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("workerAvailabilityUpdated", handleRefresh);
        window.addEventListener("focus", handleRefresh);

        const intervalId = setInterval(handleRefresh, 30000);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("workerAvailabilityUpdated", handleRefresh);
            window.removeEventListener("focus", handleRefresh);
            clearInterval(intervalId);
        };

    }, [fetchDashboardData]);


    // =====================================================
    // STATS
    // =====================================================

    const stats = [

        {
            icon: "bi-tags-fill",
            color: "blue",
            value: dashboardData?.stats?.totalCategories ?? 0,
            label: "Categories"
        },

        {
            icon: "bi-check-circle-fill",
            color: "orange",
            value: dashboardData?.stats?.completedJobs ?? 0,
            label: "Jobs Completed"
        },

        {
            icon: "bi-star-fill",
            color: "purple",
            value: Number(dashboardData?.stats?.averageRating ?? 0).toFixed(1),
            label: "Average Rating"
        },

        {
            icon: "bi-hourglass-split",
            color: "red",
            value: dashboardData?.stats?.pendingRequests ?? 0,
            label: "Pending Requests"
        },

        {
            icon: "bi-briefcase-fill",
            color: "green",
            value: dashboardData?.stats?.activeJobs ?? 0,
            label: "Active Jobs"
        }

    ];


    // =====================================================
    // QUICK ACTIONS
    // =====================================================

    const quickActions = [

        {
            icon: "bi-inbox-fill",
            color: "orange",
            title: "My Requests",
            description: "View service requests assigned to you.",
            button: "View Requests",
            path: "/worker/requests"
        },

        {
            icon: "bi-person-gear",
            color: "purple",
            title: "Profile Management",
            description: "Manage your profile, categories and availability.",
            button: "Open Profile",
            path: "/worker/profile"
        }

    ];


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        const normalized = String(status || "").toUpperCase();

        if (normalized === "COMPLETED") return "badge-success";
        if (normalized === "IN_PROGRESS") return "badge-warning";
        if (normalized === "ARRIVED") return "badge-info";
        if (normalized === "ACCEPTED") return "badge-primary";

        return "badge-secondary";

    };


    const hasLocation =
        dashboardData?.worker?.latitude != null &&
        dashboardData?.worker?.longitude != null;


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="worker-dashboard-wrapper">

                <div className="dashboard-shell">

                    <WorkerNavbar />

                    <main className="dashboard-main">

                        <div className="dashboard-content">

                            <div className="text-center mt-5">

                                <div
                                    className="spinner-border text-primary"
                                    role="status"
                                />

                                <p className="mt-2 text-muted">
                                    Loading dashboard...
                                </p>

                            </div>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div className="worker-dashboard-wrapper">

            <div className="dashboard-shell">

                <WorkerNavbar />

                <main className="dashboard-main">

                    <div className="dashboard-content">


                        {error && (

                            <div className="alert alert-danger" role="alert">

                                <i className="bi bi-exclamation-triangle-fill me-2"></i>

                                {error}

                            </div>

                        )}


                        {/* ======================================
                            WELCOME
                        ====================================== */}

                        <section className="welcome-section">

                            <div className="welcome-left">

                                <h1 className="welcome-title">

                                    Welcome back,{" "}

                                    <span className="worker-name-highlight">
                                        {workerName}
                                    </span>

                                </h1>


                                <div className="worker-badges">

                                    <span className="wd-badge badge-role">
                                        <i className="bi bi-briefcase-fill"></i>
                                        Service Provider
                                    </span>

                                    <span
                                        className={`wd-badge badge-status ${
                                            dashboardData?.worker?.available === true
                                                ? "available"
                                                : "unavailable"
                                        }`}
                                    >
                                        <span className="status-dot"></span>
                                        {dashboardData?.worker?.available === true
                                            ? "Available"
                                            : "Unavailable"}
                                    </span>

                                    <span className="wd-badge badge-location">
                                        <i className="bi bi-shield-check"></i>
                                        {dashboardData?.worker?.approvalStatus || "PENDING"}
                                    </span>

                                </div>

                            </div>


                            <div className="welcome-actions">

                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => navigate("/worker/requests")}
                                >
                                    <i className="bi bi-inbox-fill"></i>
                                    View Requests
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-refresh"
                                    onClick={fetchDashboardData}
                                    title="Refresh dashboard"
                                    aria-label="Refresh dashboard"
                                >
                                    <i className="bi bi-arrow-clockwise me-2"></i> Refresh
                                </button>

                            </div>

                        </section>


                        {/* ======================================
                            STATS
                        ====================================== */}

                        <div className="stats-grid">

                            {stats.map((stat, index) => (

                                <div className="stat-card" key={index}>

                                    <div className={`stat-icon ${stat.color}`}>
                                        <i className={`bi ${stat.icon}`}></i>
                                    </div>

                                    <div className="stat-info">
                                        <h3>{stat.value}</h3>
                                        <span>{stat.label}</span>
                                    </div>

                                </div>

                            ))}

                        </div>


                        {/* ======================================
                            CURRENT LOCATION
                        ====================================== */}

                        <div className="dashboard-location-card">

                            <div className="dashboard-section-title">

                                <div>

                                    <h3>
                                        <i className="bi bi-geo-alt-fill"></i>
                                        Current Location
                                    </h3>

                                    <p>
                                        Your current GPS location used for service tracking.
                                    </p>

                                </div>

                                <span
                                    className={
                                        hasLocation
                                            ? "location-active"
                                            : "location-inactive"
                                    }
                                >
                                    <span className="status-dot"></span>
                                    {hasLocation ? "GPS Active" : "Location Unavailable"}
                                </span>

                            </div>


                            <div className="location-details-grid">

                                <div>
                                    <span>Latitude</span>
                                    <strong>
                                        {dashboardData?.worker?.latitude != null
                                            ? Number(dashboardData.worker.latitude).toFixed(6)
                                            : "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Longitude</span>
                                    <strong>
                                        {dashboardData?.worker?.longitude != null
                                            ? Number(dashboardData.worker.longitude).toFixed(6)
                                            : "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Accuracy</span>
                                    <strong>
                                        {dashboardData?.worker?.locationAccuracy != null
                                            ? `${Number(
                                                dashboardData.worker.locationAccuracy
                                            ).toFixed(0)} meters`
                                            : "N/A"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Last Updated</span>
                                    <strong>
                                        {formatDate(dashboardData?.worker?.locationUpdatedAt)}
                                    </strong>
                                </div>

                            </div>

                        </div>


                        {/* ======================================
                            QUICK ACTIONS
                        ====================================== */}

                        <div className="quick-actions">

                            <h3>
                                <i className="bi bi-lightning-fill"></i>
                                Quick Actions
                            </h3>

                            <div className="actions-grid">

                                {quickActions.map((action, index) => (

                                    <div className="worker-action" key={index}>

                                        <div className={`action-icon ${action.color}`}>
                                            <i className={`bi ${action.icon}`}></i>
                                        </div>

                                        <h5>{action.title}</h5>

                                        <p>{action.description}</p>

                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => navigate(action.path)}
                                        >
                                            {action.button}
                                            <i className="bi bi-arrow-right"></i>
                                        </button>

                                    </div>

                                ))}

                            </div>

                        </div>


                        {/* ======================================
                            RECENT ACTIVITY
                        ====================================== */}

                        <div className="recent-activity">

                            <h3>
                                <i className="bi bi-clock-history"></i>
                                Recent Activity
                            </h3>

                            <div className="activity-card">

                                {dashboardData?.recentActivities?.length > 0 ? (

                                    dashboardData.recentActivities.map((activity, index) => (

                                        <div
                                            className="activity-item"
                                            key={activity.request_id || index}
                                        >

                                            <div className="activity-item-info">

                                                <strong>
                                                    {activity.service_name || "Service"}
                                                </strong>

                                                <small>
                                                    {formatDate(
                                                        activity.updated_at ||
                                                        activity.created_at
                                                    )}
                                                </small>

                                            </div>

                                            <span
                                                className={`badge ${getStatusClass(
                                                    activity.status
                                                )}`}
                                            >
                                                {activity.status}
                                            </span>

                                        </div>

                                    ))

                                ) : (

                                    <div className="empty-activity">

                                        <i className="bi bi-inbox"></i>

                                        <h5>No Recent Activity</h5>

                                        <p>Your service activity will appear here.</p>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>

                </main>

            </div>

        </div>

    );

}

export default WorkerDashboard;