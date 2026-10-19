import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    getUserRequests,
    cancelServiceRequest
} from "../Services/userService";

import {
    getUserFeedback
} from "../Services/feedbackService";

import "./UserRequests.css";


function UserRequests() {

    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cancel modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);


    // =====================================================
    // LOAD REQUESTS + FEEDBACK
    // =====================================================

    useEffect(() => {
        loadRequests();
    }, []);


    const loadRequests = async () => {

        try {

            setLoading(true);

            const token = sessionStorage.getItem("token");

            if (!token) {
                toast.error("Please login again");
                navigate("/login");
                return;
            }

            // Load requests
            const response = await getUserRequests(token);

            console.log("REQUESTS RESPONSE:", response);

            if (response?.status !== "success") {
                toast.error(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to load requests"
                );
                return;
            }

            const requestData =
                Array.isArray(response.data) ? response.data : [];

            setRequests(requestData);

            // Load feedback (non-blocking)
            try {

                const feedbackResponse = await getUserFeedback();

                console.log("USER FEEDBACK RESPONSE:", feedbackResponse);

                if (feedbackResponse?.status === "success") {
                    setFeedbackList(
                        Array.isArray(feedbackResponse.data)
                            ? feedbackResponse.data
                            : []
                    );
                } else {
                    setFeedbackList([]);
                }

            } catch (feedbackError) {

                console.error("FEEDBACK LOAD ERROR:", feedbackError);
                setFeedbackList([]);
            }

        } catch (error) {

            console.error(
                "REQUESTS ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.data ||
                error.response?.data ||
                "Unable to load requests"
            );

        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // CHECK WHETHER REQUEST HAS FEEDBACK
    // =====================================================

    const hasFeedback = (requestId) => {
        return feedbackList.some(
            feedback =>
                Number(feedback.request_id) === Number(requestId)
        );
    };


    // =====================================================
    // TRACKING
    // =====================================================

    const handleTracking = (request) => {

        if (!request.assigned_worker_id) {
            toast.warning("A worker has not been assigned yet.");
            return;
        }

        navigate(`/user/tracking/${request.request_id}`);
    };


    // =====================================================
    // FEEDBACK
    // =====================================================

    const handleFeedback = (request) => {
        navigate(`/user/feedback/${request.request_id}`);
    };


    // =====================================================
    // OPEN CANCEL MODAL
    // =====================================================

    const openCancelModal = (request) => {
        setSelectedRequest(request);
        setCancelReason("");
        setShowCancelModal(true);
    };


    // =====================================================
    // CLOSE CANCEL MODAL
    // =====================================================

    const closeCancelModal = () => {
        if (cancelling) return;
        setShowCancelModal(false);
        setSelectedRequest(null);
        setCancelReason("");
    };


    // =====================================================
    // CANCEL SERVICE
    // =====================================================

    const handleCancelService = async () => {

        if (!selectedRequest?.request_id) return;

        try {

            setCancelling(true);

            const token = sessionStorage.getItem("token");

            if (!token) {
                toast.error("Session expired. Please login again.");
                return;
            }

            const response = await cancelServiceRequest(
                token,
                selectedRequest.request_id,
                cancelReason
            );

            console.log("CANCEL RESPONSE:", response);

            if (response?.status === "success") {

                toast.success("Service request cancelled successfully.");

                // Update the request in the list immediately
                setRequests(previous =>
                    previous.map(req =>
                        req.request_id === selectedRequest.request_id
                            ? {
                                ...req,
                                status: "CANCELLED",
                                cancelled_reason:
                                    cancelReason || "Cancelled by user"
                            }
                            : req
                    )
                );

                closeCancelModal();

            } else {

                toast.error(
                    response?.data ||
                    response?.message ||
                    "Unable to cancel service."
                );
            }

        } catch (error) {

            console.error("CANCEL SERVICE ERROR:", error);

            toast.error(
                error.response?.data?.message ||
                error.response?.data?.data ||
                "Unable to cancel service."
            );

        } finally {
            setCancelling(false);
        }
    };


    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        switch (String(status || "").toUpperCase()) {
            case "ASSIGNED":    return "status-assigned";
            case "ACCEPTED":    return "status-accepted";
            case "IN_PROGRESS": return "status-progress";
            case "ARRIVED":     return "status-arrived";
            case "COMPLETED":   return "status-completed";
            case "CANCELLED":   return "status-cancelled";
            default:            return "status-pending";
        }
    };


    // =====================================================
    // STATUS DISPLAY
    // =====================================================

    const getStatusDisplay = (status) => {

        switch (String(status || "").toUpperCase()) {
            case "ASSIGNED":    return "Worker Assigned";
            case "ACCEPTED":    return "Worker Accepted";
            case "IN_PROGRESS": return "Worker On The Way";
            case "ARRIVED":     return "Worker Arrived";
            case "COMPLETED":   return "Service Completed";
            case "CANCELLED":   return "Cancelled";
            default:            return status || "Pending";
        }
    };


    // =====================================================
    // CHECK IF REQUEST CAN BE CANCELLED
    // =====================================================

    const canCancel = (status) => {
        const normalized = String(status || "").toUpperCase();
        return [
            "PENDING",
            "ASSIGNED",
            "ACCEPTED",
            "IN_PROGRESS"
        ].includes(normalized);
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="requests-page">
                <div className="requests-container text-center">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-3">Loading your requests...</p>
                </div>
            </div>
        );
    }


    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="requests-page">

            <div className="requests-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="requests-header">

                    <button
                        className="back-button"
                        onClick={() => navigate("/user/dashboard")}
                    >
                        <i className="bi bi-arrow-left"></i>
                        Dashboard
                    </button>

                    <div className="header-title-row">
                        <div>
                            <h1>My Requests</h1>
                            <p>View and track your booked services</p>
                        </div>

                        {requests.length > 0 && (
                            <div className="header-count">
                                <span>{requests.length}</span>
                                <small>
                                    {requests.length === 1
                                        ? "Request"
                                        : "Requests"}
                                </small>
                            </div>
                        )}
                    </div>

                </div>


                {/* =================================================
                    EMPTY
                ================================================= */}

                {requests.length === 0 ? (

                    <div className="empty-requests">

                        <div className="empty-icon">
                            <i className="bi bi-clipboard-x"></i>
                        </div>

                        <h3>No Requests Yet</h3>

                        <p>You haven't booked any services yet.</p>

                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/user/services")}
                        >
                            <i className="bi bi-search me-2"></i>
                            Browse Services
                        </button>

                    </div>

                ) : (

                    <div className="requests-list">

                        {requests.map((request) => {

                            const status =
                                String(request.status || "").toUpperCase();

                            const feedbackSubmitted =
                                hasFeedback(request.request_id);

                            const cancellable = canCancel(status);

                            return (
                                <div
                                    className="request-card"
                                    key={request.request_id}
                                >

                                    {/* =================================================
                                        HEADER
                                    ================================================= */}

                                    <div className="request-card-header">

                                        <div className="request-title-block">

                                            <span className="request-code">
                                                {request.request_code}
                                            </span>

                                            <h3>{request.service_name}</h3>

                                        </div>

                                        <span
                                            className={`request-status ${getStatusClass(status)}`}
                                        >
                                            {getStatusDisplay(status)}
                                        </span>

                                    </div>


                                    {/* =================================================
                                        DETAILS
                                    ================================================= */}

                                    <div className="request-details">

                                        <div className="detail-item">
                                            <span>Amount</span>
                                            <strong>
                                                ₹
                                                {Number(
                                                    request.estimated_price ||
                                                    request.final_price ||
                                                    0
                                                ).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div className="detail-item">
                                            <span>Booked On</span>
                                            <strong>
                                                {request.created_at
                                                    ? new Date(
                                                        request.created_at
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        }
                                                    )
                                                    : "-"}
                                            </strong>
                                        </div>

                                    </div>


                                    {/* =================================================
                                        DESCRIPTION
                                    ================================================= */}

                                    {request.description && (
                                        <div className="request-description">
                                            <strong>Problem</strong>
                                            <p>{request.description}</p>
                                        </div>
                                    )}


                                    {/* =================================================
                                        ASSIGNED WORKER
                                    ================================================= */}

                                    {request.assigned_worker_id ? (

                                        <div className="assigned-worker">

                                            <div className="worker-icon">
                                                <i className="bi bi-person-check-fill"></i>
                                            </div>

                                            <div className="worker-info">

                                                <span>Assigned Worker</span>

                                                <strong>
                                                    {request.worker_name ||
                                                        "Service Provider"}
                                                </strong>

                                                {(request.worker_city ||
                                                    request.worker_area) && (
                                                    <small>
                                                        {request.worker_city || ""}
                                                        {request.worker_city &&
                                                        request.worker_area
                                                            ? ", "
                                                            : ""}
                                                        {request.worker_area || ""}
                                                    </small>
                                                )}

                                            </div>

                                            <div className="worker-rating">
                                                <i className="bi bi-star-fill"></i>
                                                {Number(
                                                    request.worker_rating || 0
                                                ).toFixed(1)}
                                            </div>

                                        </div>

                                    ) : (

                                        <div className="worker-not-assigned">
                                            <i className="bi bi-hourglass-split"></i>
                                            <span>
                                                Waiting for a nearby worker
                                            </span>
                                        </div>

                                    )}


                                    {/* =================================================
                                        ACTION BUTTONS
                                    ================================================= */}

                                    <div className="request-actions">

                                        {/* Tracking button */}
                                        {request.assigned_worker_id &&
                                            (status === "ASSIGNED" ||
                                                status === "ACCEPTED" ||
                                                status === "IN_PROGRESS") && (
                                                <button
                                                    type="button"
                                                    className="btn btn-track"
                                                    onClick={() =>
                                                        handleTracking(request)
                                                    }
                                                >
                                                    <i className="bi bi-geo-alt-fill"></i>
                                                    {status === "IN_PROGRESS"
                                                        ? "Track Worker"
                                                        : "Start Tracking"}
                                                </button>
                                            )}

                                        {/* Cancel button */}
                                        {cancellable && (
                                            <button
                                                type="button"
                                                className="btn btn-cancel"
                                                onClick={() =>
                                                    openCancelModal(request)
                                                }
                                            >
                                                <i className="bi bi-x-circle"></i>
                                                Cancel Request
                                            </button>
                                        )}

                                        {/* Feedback button */}
                                        {status === "COMPLETED" &&
                                            !feedbackSubmitted && (
                                                <button
                                                    type="button"
                                                    className="btn btn-feedback"
                                                    onClick={() =>
                                                        handleFeedback(request)
                                                    }
                                                >
                                                    <i className="bi bi-star-fill"></i>
                                                    Give Feedback
                                                </button>
                                            )}

                                        {/* Feedback submitted */}
                                        {status === "COMPLETED" &&
                                            feedbackSubmitted && (
                                                <div className="feedback-submitted">
                                                    <i className="bi bi-star-fill"></i>
                                                    <span>
                                                        Feedback Submitted
                                                    </span>
                                                </div>
                                            )}

                                    </div>


                                    {/* =================================================
                                        ARRIVED
                                    ================================================= */}

                                    {status === "ARRIVED" && (
                                        <div className="request-arrived-message">
                                            <div className="arrival-icon">
                                                <i className="bi bi-check-circle-fill"></i>
                                            </div>
                                            <div>
                                                <strong>
                                                    Worker has arrived
                                                </strong>
                                                <span>
                                                    Live tracking has stopped.
                                                    The service is now in progress.
                                                </span>
                                            </div>
                                        </div>
                                    )}


                                    {/* =================================================
                                        CANCELLED
                                    ================================================= */}

                                    {status === "CANCELLED" && (
                                        <div className="request-cancelled-message">
                                            <i className="bi bi-x-circle-fill"></i>
                                            <span>
                                                This service request was cancelled.
                                            </span>
                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>


            {/* =================================================
                CANCEL MODAL
            ================================================= */}

            {showCancelModal && selectedRequest && (

                <div
                    className="cancel-modal-backdrop"
                    onClick={closeCancelModal}
                >

                    <div
                        className="cancel-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="cancel-modal-header">

                            <div className="cancel-modal-icon">
                                <i className="bi bi-exclamation-triangle-fill"></i>
                            </div>

                            <div>
                                <h3>Cancel Service Request</h3>
                                <p>
                                    Are you sure you want to cancel this
                                    request?
                                </p>
                            </div>

                        </div>

                        <div className="cancel-modal-body">

                            <div className="cancel-request-info">
                                <span>Service</span>
                                <strong>
                                    {selectedRequest.service_name}
                                </strong>
                                <small>
                                    {selectedRequest.request_code}
                                </small>
                            </div>

                            <label
                                className="cancel-reason-label"
                                htmlFor="cancel-reason"
                            >
                                Reason for cancellation{" "}
                                <span className="optional">(optional)</span>
                            </label>

                            <textarea
                                id="cancel-reason"
                                className="cancel-reason-input"
                                value={cancelReason}
                                onChange={(e) =>
                                    setCancelReason(e.target.value)
                                }
                                placeholder="Let us know why you're cancelling..."
                                rows="3"
                                maxLength="200"
                                disabled={cancelling}
                            />

                            <div className="cancel-reason-counter">
                                {cancelReason.length} / 200
                            </div>

                        </div>

                        <div className="cancel-modal-footer">

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={closeCancelModal}
                                disabled={cancelling}
                            >
                                Keep Request
                            </button>

                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleCancelService}
                                disabled={cancelling}
                            >
                                {cancelling ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-x-circle me-2"></i>
                                        Confirm Cancel
                                    </>
                                )}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default UserRequests;