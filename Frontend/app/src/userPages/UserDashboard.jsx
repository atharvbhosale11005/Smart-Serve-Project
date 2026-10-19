import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import UserNavbar from "../components/UserNavbar";
import { getDashboard } from "../Services/userService";

import "./UserDashboard.css";

function UserDashboard() {

    const navigate = useNavigate();

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");

    const userName =
        user.fullName ||
        user.full_name ||
        user.name ||
        "User";

    const [loading, setLoading] = useState(true);

    const [dashboard, setDashboard] = useState({

        availableServices: 0,

        servicesUsed: 0,

        currentServices: 0,

        completedServices: 0,

        recentActivities: []

    });

    useEffect(() => {

        loadDashboard();

    }, []);

    const loadDashboard = async () => {

        try {

            const token = sessionStorage.getItem("token");

            const result = await getDashboard(token);

            if (result.status === "success") {

                setDashboard(result.data);

            }

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    };

    // Returns the correct badge class regardless of casing/whitespace from the API
    const getBadgeClass = (status) => {
        const normalized = (status || "").trim().toLowerCase();
        if (normalized === "completed") return "bg-success";
        if (normalized === "pending") return "bg-warning";
        if (normalized === "cancelled" || normalized === "canceled") return "bg-danger";
        return "bg-info-status";
    };

    // Formats raw ISO timestamps (e.g. 2026-08-09T19:45:52.000Z) into readable text
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    return (
        <div className="dashboard-shell">
            <UserNavbar />
            <main className="dashboard-main">
                <div className="dashboard-content">
                    {/* Welcome Section */}
                    <div className="welcome-section">
                        <div>
                            <h2>
                                Welcome,
                                <span className="highlight">
                                    {userName}
                                </span>
                            </h2>
                            <p>Help you find the best services for your needs.</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/user/services")}
                        >
                            Book New Service
                        </button>
                    </div>

                    {/* Statistics
                        `stats-row` distinguishes this grid from the quick-access
                        grid below — previously both were plain `.row.mt-4`, which
                        made the per-button colour rules impossible to target. */}
                    <div className="row mt-4 stats-row">
                        <div className="col-md-3">
                            <div className="stat-card">
                                <i className="bi bi-grid-fill stat-icon text-primary"></i>
                                <h3>{dashboard.availableServices}</h3>
                                <p>Available Services</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="stat-card">
                                <i className="bi bi-check-circle stat-icon text-success"></i>
                                <h3>{dashboard.servicesUsed}</h3>
                                <p>Services Used</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="stat-card">
                                <i className="bi bi-clock-history stat-icon text-warning"></i>
                                <h3>{dashboard.currentServices}</h3>
                                <p>Current Services</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="stat-card">
                                <i className="bi bi-award stat-icon text-danger"></i>
                                <h3>{dashboard.completedServices}</h3>
                                <p>Completed Services</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="card shadow mt-5">
                        <div className="card-header">
                            <h5>
                                <i className="bi bi-clock-history"></i>
                                Recent Activities
                            </h5>
                        </div>
                        <div className="card-body">
                            {dashboard.recentActivities.length === 0 ? (
                                <div className="text-center empty-state">
                                    <i className="bi bi-inbox"></i>
                                    No services requested yet.
                                </div>
                            ) : (
                                dashboard.recentActivities.map((activity, index) => (
                                    <div className="activity-item" key={index}>
                                        <div>
                                            <strong>{activity.title}</strong>
                                            <br />
                                            <small>{formatDate(activity.updated_at)}</small>
                                        </div>
                                        <span className={`badge ${getBadgeClass(activity.status)}`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Access */}
                    <div className="row mt-4 quick-row">
                        <div className="col-md-3">
                            <button
                                className="quick-btn"
                                onClick={() => navigate("/user/services")}
                            >
                                <i className="bi bi-grid-fill"></i>
                                Browse Services
                            </button>
                        </div>
                        <div className="col-md-3">
                            <button
                                className="quick-btn"
                                onClick={() => navigate("/user/requests")}
                            >
                                <i className="bi bi-file-earmark-text-fill"></i>
                                My Requests
                            </button>
                        </div>
                        <div className="col-md-3">
                            {/* Was /user/status, which is not in UserNavbar's route
                                list — History replaced Current Status. Change back
                                if /user/status is genuinely still routed. */}
                            <button
                                className="quick-btn"
                                onClick={() => navigate("/user/history")}
                            >
                                <i className="bi bi-clock-history"></i>
                                Request Status
                            </button>
                        </div>
                        <div className="col-md-3">
                            <button
                                className="quick-btn"
                                onClick={() => navigate("/user/profile")}
                            >
                                <i className="bi bi-person-circle"></i>
                                Profile
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );

}

export default UserDashboard;