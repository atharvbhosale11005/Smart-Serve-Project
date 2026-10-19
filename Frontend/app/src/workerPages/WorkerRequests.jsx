import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import WorkerNavbar from "../components/WorkerNavbar";

import {
    getWorkerRequests,
    acceptServiceRequest,
    startService,
    completeService,
    rejectWorkerRequest
} from "../Services/workerService";

import "./WorkerRequests.css";

function WorkerRequests() {

    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // ======================================================
    // LOAD REQUESTS
    // ======================================================

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {

        try {

            setLoading(true);

            const response = await getWorkerRequests();

            console.log(
                "WORKER REQUESTS RESPONSE:",
                response
            );

            if (response?.status === "success") {

                setRequests(
                    Array.isArray(response.data)
                        ? response.data
                        : []
                );

            } else {

                toast.error(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to load requests"
                );
            }

        } catch (error) {

            console.error(
                "WORKER REQUESTS ERROR:",
                error
            );

            toast.error(
                error?.response?.data?.data ||
                error?.response?.data ||
                error?.message ||
                "Unable to load requests"
            );

        } finally {

            setLoading(false);

        }
    };


    // ======================================================
    // STATUS CLASS
    // ======================================================

    const getStatusClass = (status) => {

        switch (String(status || "").toUpperCase()) {

            case "ASSIGNED":
                return "status-assigned";

            case "ACCEPTED":
                return "status-accepted";

            case "IN_PROGRESS":
                return "status-progress";

            case "ARRIVED":
                return "status-arrived";

            case "COMPLETED":
                return "status-completed";

            case "CANCELLED":
                return "status-cancelled";

            default:
                return "status-pending";
        }
    };


    // ======================================================
    // STATUS DISPLAY
    // ======================================================

    const getStatusDisplay = (status) => {

        switch (String(status || "").toUpperCase()) {

            case "ASSIGNED":
                return "ASSIGNED";

            case "ACCEPTED":
                return "ACCEPTED";

            case "IN_PROGRESS":
                return "IN PROGRESS";

            case "ARRIVED":
                return "ARRIVED";

            case "COMPLETED":
                return "COMPLETED ✓";

            case "CANCELLED":
                return "CANCELLED";

            default:
                return status || "UNKNOWN";
        }
    };


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ======================================================
    // FORMAT TIME
    // ======================================================

    const formatTime = (date) => {

        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // ======================================================
    // ACCEPT REQUEST
    // ======================================================

    const handleAcceptRequest = async (requestId) => {

        try {

            setProcessingId(requestId);

            console.log(
                "ACCEPTING REQUEST:",
                requestId
            );

            const response =
                await acceptServiceRequest(
                    requestId
                );

            console.log(
                "ACCEPT RESPONSE:",
                response
            );

            if (
                response?.status === "success"
            ) {

                toast.success(
                    "Request accepted successfully!"
                );

                setRequests(previous =>
                    previous.map(request =>
                        Number(request.request_id) ===
                        Number(requestId)
                            ? {
                                ...request,
                                status: "ACCEPTED"
                            }
                            : request
                    )
                );

            } else {

                toast.error(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to accept request"
                );
            }

        } catch (error) {

            console.error(
                "ACCEPT REQUEST ERROR:",
                error
            );

            toast.error(
                error?.response?.data?.data ||
                error?.response?.data ||
                error?.message ||
                "Unable to accept request"
            );

        } finally {

            setProcessingId(null);

        }
    };


    // ======================================================
    // START SERVICE
    // ======================================================

    const handleStartService = async (requestId) => {

        try {

            setProcessingId(requestId);

            console.log(
                "STARTING SERVICE:",
                requestId
            );

            const response =
                await startService(
                    requestId
                );

            console.log(
                "START SERVICE RESPONSE:",
                response
            );

            if (
                response?.status === "success"
            ) {

                toast.success(
                    "Service started successfully!"
                );

                setRequests(previous =>
                    previous.map(request =>
                        Number(request.request_id) ===
                        Number(requestId)
                            ? {
                                ...request,
                                status: "IN_PROGRESS"
                            }
                            : request
                    )
                );

                // Navigate to tracking
                navigate(
                    `/worker/tracking/${requestId}`
                );

            } else {

                toast.error(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to start service"
                );
            }

        } catch (error) {

            console.error(
                "START SERVICE ERROR:",
                error
            );

            toast.error(
                error?.response?.data?.data ||
                error?.response?.data ||
                error?.message ||
                "Unable to start service"
            );

        } finally {

            setProcessingId(null);

        }
    };


    // ======================================================
    // OPEN TRACKING
    //
    // IMPORTANT:
    // Do NOT call startService again when status is
    // IN_PROGRESS.
    // ======================================================

    const handleTrackService = (requestId) => {

        navigate(
            `/worker/tracking/${requestId}`
        );

    };


    // ======================================================
    // COMPLETE SERVICE
    // ======================================================

    const handleCompleteService = async (requestId) => {

        try {

            setProcessingId(requestId);

            console.log(
                "COMPLETING SERVICE FROM REQUESTS:",
                requestId
            );

            const response =
                await completeService(
                    requestId
                );

            console.log(
                "COMPLETE SERVICE RESPONSE:",
                response
            );

            if (
                response?.status === "success"
            ) {

                toast.success(
                    "Service completed successfully!"
                );

                /*
                 * Update local request immediately.
                 */
                setRequests(previous =>
                    previous.map(request =>
                        Number(request.request_id) ===
                        Number(requestId)
                            ? {
                                ...request,
                                status: "COMPLETED"
                            }
                            : request
                    )
                );

            } else {

                toast.error(
                    typeof response?.data === "string"
                        ? response.data
                        : "Unable to complete service"
                );
            }

        } catch (error) {

            console.error(
                "COMPLETE SERVICE ERROR:",
                error
            );

            toast.error(
                error?.response?.data?.data ||
                error?.response?.data ||
                error?.message ||
                "Unable to complete service"
            );

        } finally {

            setProcessingId(null);

        }
    };

    const handleReject = async (requestId) => {
    try {
        const token = sessionStorage.getItem("token");

        const response = await rejectWorkerRequest(
            token,
            requestId,
            "Unable to accept this request"
        );

        if (response.status === "success") {
            alert(response.data.message);

            fetchRequests();
        } else {
            alert(response.error || "Unable to reject request");
        }

    } catch (error) {
        console.error("REJECT REQUEST ERROR:", error);
        alert("Something went wrong");
    }
};


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <div className="dashboard-shell">

                <WorkerNavbar />

                <main className="dashboard-main">

                    <div className="worker-requests-loading">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        />

                        <p>
                            Loading assigned requests...
                        </p>

                    </div>

                </main>

            </div>
        );
    }


    // ======================================================
    // PAGE
    // ======================================================

    return (

        <div className="dashboard-shell">

            <WorkerNavbar />

            <main className="dashboard-main">

                <div className="worker-requests-container">


                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="worker-requests-header">

                        <div>

                            <h1>
                                My Requests
                            </h1>

                            <p>
                                Service requests assigned to you
                            </p>

                        </div>


                        <button
                            className="worker-back-button"
                            onClick={() =>
                                navigate(
                                    "/worker/dashboard"
                                )
                            }
                        >

                            <i className="bi bi-arrow-left"></i>

                            Dashboard

                        </button>

                    </div>


                    {/* ==================================================
                        REQUEST COUNT
                    ================================================== */}

                    <div className="worker-request-summary">

                        <div className="summary-icon">

                            <i className="bi bi-clipboard-check"></i>

                        </div>

                        <div>

                            <span>
                                Assigned Requests
                            </span>

                            <strong>
                                {requests.length}
                            </strong>

                        </div>

                    </div>


                    {/* ==================================================
                        EMPTY STATE
                    ================================================== */}

                    {requests.length === 0 ? (

                        <div className="worker-empty-state">

                            <div className="empty-icon">

                                <i className="bi bi-clipboard-x"></i>

                            </div>

                            <h3>
                                No Assigned Requests
                            </h3>

                            <p>
                                You currently don't have any
                                service requests assigned to you.
                            </p>

                            <button
                                className="btn btn-primary"
                                onClick={() =>
                                    navigate(
                                        "/worker/dashboard"
                                    )
                                }
                            >
                                Go to Dashboard
                            </button>

                        </div>

                    ) : (

                        <div className="worker-requests-list">

                            {requests.map((request) => {

                                const status =
                                    String(
                                        request.status || ""
                                    ).toUpperCase();

                                const isProcessing =
                                    processingId ===
                                    request.request_id;

                                return (

                                    <div
                                        className="worker-request-card"
                                        key={request.request_id}
                                    >


                                        {/* ==================================================
                                            CARD HEADER
                                        ================================================== */}

                                        <div className="request-card-top">

                                            <div>

                                                <span className="request-code">
                                                    {request.request_code}
                                                </span>

                                                <h2>
                                                    {request.service_name}
                                                </h2>

                                            </div>


                                            <span
                                                className={`request-status ${getStatusClass(
                                                    status
                                                )}`}
                                            >
                                                {getStatusDisplay(
                                                    status
                                                )}
                                            </span>

                                        </div>


                                        {/* ==================================================
                                            SERVICE DETAILS
                                        ================================================== */}

                                        <div className="request-section">

                                            <h4>

                                                <i className="bi bi-tools"></i>

                                                Service Details

                                            </h4>


                                            <div className="request-info-grid">

                                                <div className="request-info-item">

                                                    <span>
                                                        Service
                                                    </span>

                                                    <strong>
                                                        {request.service_name}
                                                    </strong>

                                                </div>


                                                <div className="request-info-item">

                                                    <span>
                                                        Amount
                                                    </span>

                                                    <strong>
                                                        ₹
                                                        {Number(
                                                            request.estimated_price ||
                                                            request.final_price ||
                                                            0
                                                        ).toFixed(2)}
                                                    </strong>

                                                </div>


                                                <div className="request-info-item">

                                                    <span>
                                                        Booked Date
                                                    </span>

                                                    <strong>
                                                        {formatDate(
                                                            request.created_at
                                                        )}
                                                    </strong>

                                                </div>


                                                <div className="request-info-item">

                                                    <span>
                                                        Booked Time
                                                    </span>

                                                    <strong>
                                                        {formatTime(
                                                            request.created_at
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>

                                        </div>


                                        {/* ==================================================
                                            CUSTOMER
                                        ================================================== */}

                                        <div className="request-section">

                                            <h4>

                                                <i className="bi bi-person"></i>

                                                Customer Details

                                            </h4>


                                            <div className="customer-box">

                                                <div className="customer-avatar">

                                                    <i className="bi bi-person-fill"></i>

                                                </div>


                                                <div className="customer-info">

                                                    <strong>
                                                        {request.customer_name ||
                                                            "Customer"}
                                                    </strong>

                                                    <span>

                                                        <i className="bi bi-telephone"></i>

                                                        {request.customer_phone ||
                                                            "Phone unavailable"}

                                                    </span>

                                                </div>

                                            </div>

                                        </div>


                                        {/* ==================================================
                                            SERVICE LOCATION
                                        ================================================== */}

                                        <div className="request-section">

                                            <h4>

                                                <i className="bi bi-geo-alt"></i>

                                                Service Location

                                            </h4>


                                            <div className="address-box">

                                                <strong>
                                                    {request.address_label ||
                                                        "Service Address"}
                                                </strong>

                                                <p>

                                                    {request.address_line1}

                                                    {request.address_line2 &&
                                                        `, ${request.address_line2}`}

                                                    {request.area &&
                                                        `, ${request.area}`}

                                                    {request.city &&
                                                        `, ${request.city}`}

                                                    {request.pincode &&
                                                        ` - ${request.pincode}`}

                                                </p>


                                                {request.landmark && (

                                                    <small>

                                                        <i className="bi bi-signpost-2"></i>

                                                        Landmark:{" "}
                                                        {request.landmark}

                                                    </small>

                                                )}

                                            </div>

                                        </div>


                                        {/* ==================================================
                                            CUSTOMER REQUIREMENT
                                        ================================================== */}

                                        {request.description && (

                                            <div className="request-section">

                                                <h4>

                                                    <i className="bi bi-chat-left-text"></i>

                                                    Customer Requirement

                                                </h4>


                                                <div className="description-box">

                                                    {request.description}

                                                </div>

                                            </div>

                                        )}


                                        {/* ==================================================
                                            ACTIONS
                                        ================================================== */}

                                        <div className="request-actions">


                                            {/* ------------------------------------------
                                                ASSIGNED
                                            ------------------------------------------ */}

                                            {status === "ASSIGNED" && (

                                                <button
                                                    type="button"
                                                    className="btn btn-accept"
                                                    onClick={() =>
                                                        handleAcceptRequest(
                                                            request.request_id
                                                        )
                                                    }
                                                    disabled={
                                                        isProcessing
                                                    }
                                                >

                                                    {isProcessing ? (

                                                        <>

                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                            />

                                                            Accepting...

                                                        </>

                                                    ) : (

                                                        <>

                                                            <i className="bi bi-check-circle me-2"></i>

                                                            Accept Request

                                                        </>

                                                    )}

                                                </button>

                                            )}


                                            {/* ------------------------------------------
                                                ACCEPTED
                                            ------------------------------------------ */}

                                            {status === "ACCEPTED" && (

                                                <button
                                                    type="button"
                                                    className="btn btn-start"
                                                    onClick={() =>
                                                        handleStartService(
                                                            request.request_id
                                                        )
                                                    }
                                                    disabled={
                                                        isProcessing
                                                    }
                                                >

                                                    {isProcessing ? (

                                                        <>

                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                            />

                                                            Starting...

                                                        </>

                                                    ) : (

                                                        <>

                                                            <i className="bi bi-play-circle me-2"></i>

                                                            Start Service

                                                        </>

                                                    )}

                                                </button>

                                            )}


                                            {/* ------------------------------------------
                                                IN PROGRESS
                                            ------------------------------------------ */}

                                            {status === "IN_PROGRESS" && (

                                                <button
                                                    type="button"
                                                    className="btn btn-track"
                                                    onClick={() =>
                                                        handleTrackService(
                                                            request.request_id
                                                        )
                                                    }
                                                >

                                                    <i className="bi bi-geo-alt-fill me-2"></i>

                                                    Track Service

                                                </button>

                                            )}


                                            {/* ------------------------------------------
                                                ARRIVED
                                            ------------------------------------------ */}

                                            {status === "ARRIVED" && (

                                                <>

                                                    <div className="alert alert-success w-100 mb-3">

                                                        <i className="bi bi-check-circle-fill me-2"></i>

                                                        <strong>
                                                            Worker has arrived
                                                            at the destination.
                                                        </strong>

                                                        <br />

                                                        <small>
                                                            Live GPS tracking
                                                            has stopped.
                                                            Complete the service
                                                            after finishing the
                                                            work and receiving
                                                            payment.
                                                        </small>

                                                    </div>


                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={() =>
                                                            handleCompleteService(
                                                                request.request_id
                                                            )
                                                        }
                                                        disabled={
                                                            isProcessing
                                                        }
                                                    >

                                                        {isProcessing ? (

                                                            <>

                                                                <span
                                                                    className="spinner-border spinner-border-sm me-2"
                                                                />

                                                                Completing...

                                                            </>

                                                        ) : (

                                                            <>

                                                                <i className="bi bi-check2-circle me-2"></i>

                                                                Complete Service

                                                            </>

                                                        )}

                                                    </button>

                                                </>

                                            )}


                                            {/* ------------------------------------------
                                                COMPLETED
                                            ------------------------------------------ */}

                                            {status === "COMPLETED" && (

                                                <div className="alert alert-success w-100 mb-0">

                                                    <i className="bi bi-check-circle-fill me-2"></i>

                                                    <strong>
                                                        Service Completed
                                                    </strong>

                                                    <br />

                                                    <small>
                                                        This service has been
                                                        successfully completed.
                                                    </small>

                                                </div>

                                            )}


                                            {/* ------------------------------------------
                                                CANCELLED
                                            ------------------------------------------ */}

                                            {status === "CANCELLED" && (

                                                <div className="alert alert-danger w-100 mb-0">

                                                    <i className="bi bi-x-circle-fill me-2"></i>

                                                    <strong>
                                                        Request Cancelled
                                                    </strong>

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    )}

                </div>

            </main>

        </div>
    );
}

export default WorkerRequests;