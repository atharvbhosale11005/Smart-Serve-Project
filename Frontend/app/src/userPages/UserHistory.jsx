import { useEffect, useState } from "react";
import UserNavbar from "../components/UserNavbar";
import { getRequestHistory } from "../Services/userService";
import "./UserHistory.css";

function UserHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  // The API can hand back a string, an object, or nothing at all.
  // Rendering an object as a React child throws, so everything is
  // funnelled through here before it reaches state.
  const toMessage = (value, fallback) => {
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value.message === "string") return value.message;
    return fallback;
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      if (!token) {
        setError("Session expired. Please login again.");
        return;
      }

      const response = await getRequestHistory(token);

      if (response?.status === "success") {
        setHistory(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(toMessage(response?.data, "Unable to load history."));
      }
    } catch (err) {
      // Renamed from `error` — it shadowed the state variable of the
      // same name, so the value read inside this block was never the
      // one the component renders.
      console.error(
        "USER HISTORY ERROR:",
        err.response?.data || err.message || err
      );
      setError("Unable to load service history.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Single normalized lookup instead of a chain of strict comparisons,
  // so "completed", " COMPLETED " and "Completed" all match, and the
  // statuses the API actually returns for in-flight jobs are covered.
  const STATUS_MAP = {
    COMPLETED: { className: "completed", icon: "✓" },
    CANCELLED: { className: "cancelled", icon: "✕" },
    CANCELED: { className: "cancelled", icon: "✕" },
    PENDING: { className: "pending", icon: "⏳" },
    IN_PROGRESS: { className: "in-progress", icon: "🔄" },
    ACCEPTED: { className: "accepted", icon: "◆" },
    ASSIGNED: { className: "assigned", icon: "◆" },
  };

  const getStatus = (status) => {
    const key = String(status || "").trim().toUpperCase().replace(/\s+/g, "_");
    return STATUS_MAP[key] || { className: "", icon: "" };
  };

  const formatPrice = (item) => {
    const value = item.final_price ?? item.estimated_price ?? 0;
    const numeric = Number(value);
    return Number.isNaN(numeric) ? "₹0" : `₹${numeric.toLocaleString("en-IN")}`;
  };

  return (
    <div className="user-history-page">
      <UserNavbar />

      <main className="history-main">
        <div className="history-header">
          <div>
            <h1>
              <i className="bi bi-clock-history"></i>
              Service History
            </h1>
            <p>View your completed and cancelled services</p>
          </div>
          {history.length > 0 && (
            <div className="history-count">
              <span>{history.length}</span>
              <small>Total Records</small>
            </div>
          )}
        </div>

        {loading && (
          <div className="history-loading">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading service history...</p>
          </div>
        )}

        {!loading && error && (
          <div className="history-error" role="alert">
            <div className="history-error-icon">
              <i className="bi bi-exclamation-circle"></i>
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="btn-retry" onClick={loadHistory}>
              <i className="bi bi-arrow-clockwise"></i>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">
              <i className="bi bi-clock-history"></i>
            </div>
            <h3>No Service History</h3>
            <p>Your completed services will appear here</p>
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <div className="history-list">
            {history.map((item, index) => {
              const status = getStatus(item.status);

              return (
                <div
                  className="history-card"
                  key={item.request_id ?? index}
                >
                  <div className="history-card-main">
                    <div className="history-info">
                      <h3>{item.service_name || "Service"}</h3>
                      <p className="history-date">
                        <i className="bi bi-calendar3"></i>
                        {formatDate(item.updated_at || item.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="history-card-right">
                    <span className={`history-status ${status.className}`}>
                      <span aria-hidden="true">{status.icon}</span>{" "}
                      {item.status || "UNKNOWN"}
                    </span>
                    <div className="history-price">{formatPrice(item)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default UserHistory;