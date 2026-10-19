import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Polyline,
    useMap
} from "react-leaflet";

import L from "leaflet";

import UserNavbar from "../components/UserNavbar";

import {
    getRequestTracking
} from "../Services/userService";

import "leaflet/dist/leaflet.css";
import "./UserTracking.css";

/* =====================================================
   LEAFLET ICON FIX
===================================================== */

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});


/* =====================================================
   MAP UPDATER
===================================================== */

function MapUpdater({ location }) {

    const map = useMap();

    useEffect(() => {

        if (
            location &&
            Number.isFinite(location.latitude) &&
            Number.isFinite(location.longitude)
        ) {

            map.setView(
                [
                    location.latitude,
                    location.longitude
                ],
                15
            );
        }

    }, [location, map]);

    return null;
}


/* =====================================================
   USER TRACKING
===================================================== */

function UserTracking() {

    const { requestId } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [trackingData, setTrackingData] = useState(null);

    const [lastUpdated, setLastUpdated] = useState(null);


    /* =================================================
       ERROR MESSAGE
    ================================================= */

    const getErrorMessage = (error) => {

        if (!error) {
            return "Unable to load tracking data";
        }

        if (typeof error === "string") {
            return error;
        }

        if (error.response?.data) {

            const data = error.response.data;

            if (typeof data === "string") {
                return data;
            }

            if (typeof data.message === "string") {
                return data.message;
            }

            if (typeof data.data === "string") {
                return data.data;
            }

            if (
                typeof data.data?.message === "string"
            ) {
                return data.data.message;
            }

            if (
                typeof data.data?.sqlMessage === "string"
            ) {
                return data.data.sqlMessage;
            }

            if (
                typeof data.sqlMessage === "string"
            ) {
                return data.sqlMessage;
            }
        }

        if (error.message) {
            return error.message;
        }

        return "Unable to load tracking data";
    };


    /* =================================================
       LOAD TRACKING
    ================================================= */

    useEffect(() => {

        let cancelled = false;

        let timeoutId = null;


        const loadTracking = async () => {

            try {

                const token =
                    sessionStorage.getItem("token");


                if (!token) {

                    if (!cancelled) {

                        setError(
                            "Please login to continue"
                        );

                        setLoading(false);
                    }

                    return;
                }


                if (!requestId) {

                    if (!cancelled) {

                        setError(
                            "Invalid service request"
                        );

                        setLoading(false);
                    }

                    return;
                }


                console.log(
                    "Loading tracking for request:",
                    requestId
                );


                const response =
                    await getRequestTracking(
                        token,
                        requestId
                    );


                console.log(
                    "TRACKING RESPONSE:",
                    response
                );


                if (cancelled) {
                    return;
                }


                if (!response) {

                    setError(
                        "No response received from server"
                    );

                    setLoading(false);

                    return;
                }


                if (response.status !== "success") {

                    setError(
                        getErrorMessage(response.data)
                    );

                    setLoading(false);

                    return;
                }


                if (
                    !response.data ||
                    typeof response.data !== "object" ||
                    Array.isArray(response.data)
                ) {

                    setError(
                        "Invalid tracking data received from server"
                    );

                    setLoading(false);

                    return;
                }


                const data = response.data;


                /* =========================================
                   PREVENT MYSQL ERROR OBJECT FROM RENDERING
                ========================================= */

                if (
                    data.sqlMessage ||
                    data.sqlState ||
                    data.errno ||
                    data.code
                ) {

                    setError(
                        data.sqlMessage ||
                        "Database error while loading tracking"
                    );

                    setLoading(false);

                    return;
                }


                /* =========================================
                   NORMALIZE NUMERIC VALUES
                ========================================= */

                if (
                    data.worker_latitude !== null &&
                    data.worker_latitude !== undefined
                ) {

                    data.worker_latitude =
                        Number(data.worker_latitude);
                }


                if (
                    data.worker_longitude !== null &&
                    data.worker_longitude !== undefined
                ) {

                    data.worker_longitude =
                        Number(data.worker_longitude);
                }


                if (
                    data.worker_accuracy !== null &&
                    data.worker_accuracy !== undefined
                ) {

                    data.worker_accuracy =
                        Number(data.worker_accuracy);
                }


                if (
                    data.destination_latitude !== null &&
                    data.destination_latitude !== undefined
                ) {

                    data.destination_latitude =
                        Number(data.destination_latitude);
                }


                if (
                    data.destination_longitude !== null &&
                    data.destination_longitude !== undefined
                ) {

                    data.destination_longitude =
                        Number(data.destination_longitude);
                }


                setTrackingData(data);

                setError("");

                setLastUpdated(
                    new Date()
                );

                setLoading(false);


                /* =========================================
                   POLLING

                   ONLY IN_PROGRESS

                   ARRIVED = STOP
                   COMPLETED = STOP
                ========================================= */

                if (
                    data.status === "IN_PROGRESS"
                ) {

                    timeoutId =
                        setTimeout(
                            loadTracking,
                            5000
                        );
                }


            } catch (err) {

                console.error(
                    "TRACKING ERROR:",
                    err.response?.data || err
                );


                if (cancelled) {
                    return;
                }


                if (
                    err.response?.status === 404
                ) {

                    setError(
                        "Tracking data not found. The request may not exist."
                    );

                } else if (
                    err.code === "ERR_NETWORK"
                ) {

                    setError(
                        "Cannot connect to server. Please check that the backend is running."
                    );

                } else {

                    setError(
                        getErrorMessage(err)
                    );
                }


                setLoading(false);
            }
        };


        loadTracking();


        return () => {

            cancelled = true;

            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };


    }, [requestId]);


    /* =================================================
       LOADING
    ================================================= */

    if (loading) {

        return (
            <>
                <UserNavbar />

                <main className="user-tracking-main">

                    <div className="text-center py-5">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        />

                        <p className="mt-3">
                            Loading worker location...
                        </p>

                    </div>

                </main>
            </>
        );
    }


    /* =================================================
       ERROR
    ================================================= */

    if (error || !trackingData) {

        return (
            <>
                <UserNavbar />

                <main className="user-tracking-main">

                    <div className="error-container">

                        <div className="error-box">

                            <i className="bi bi-exclamation-circle error-icon"></i>

                            <h4>
                                Tracking unavailable
                            </h4>

                            <p>
                                {String(
                                    error ||
                                    "Unable to load tracking data"
                                )}
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary mt-3"
                                onClick={() =>
                                    navigate("/user/requests")
                                }
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Back to My Requests
                            </button>

                        </div>

                    </div>

                </main>
            </>
        );
    }


    /* =================================================
       DESTINATION LOCATION
       
       THIS IS THE ADDRESS SELECTED DURING BOOKING.
    ================================================= */

    const hasDestinationCoordinates =
        trackingData.destination_latitude !== null &&
        trackingData.destination_latitude !== undefined &&
        trackingData.destination_longitude !== null &&
        trackingData.destination_longitude !== undefined;


    const destinationLatitude =
        Number(
            trackingData.destination_latitude
        );


    const destinationLongitude =
        Number(
            trackingData.destination_longitude
        );


    const destinationLocation =
        hasDestinationCoordinates &&
        Number.isFinite(destinationLatitude) &&
        Number.isFinite(destinationLongitude)

            ? {
                latitude: destinationLatitude,
                longitude: destinationLongitude
            }

            : null;


    /* =================================================
       REAL WORKER GPS LOCATION
       
       IMPORTANT:
       This remains the worker's REAL GPS.
    ================================================= */

    const hasWorkerCoordinates =
        trackingData.worker_latitude !== null &&
        trackingData.worker_latitude !== undefined &&
        trackingData.worker_longitude !== null &&
        trackingData.worker_longitude !== undefined;


    const workerLatitude =
        Number(
            trackingData.worker_latitude
        );


    const workerLongitude =
        Number(
            trackingData.worker_longitude
        );


    const workerLocation =
        hasWorkerCoordinates &&
        Number.isFinite(workerLatitude) &&
        Number.isFinite(workerLongitude)

            ? {
                latitude: workerLatitude,
                longitude: workerLongitude
            }

            : null;


    /* =================================================
       STATUS
    ================================================= */

    const isLive =
        trackingData.status === "IN_PROGRESS";


    const isWaiting =
        trackingData.status === "ASSIGNED" ||
        trackingData.status === "ACCEPTED";


    const hasArrived =
        trackingData.status === "ARRIVED";


    const isCompleted =
        trackingData.status === "COMPLETED";


    /* =================================================
       IMPORTANT FINAL LOCATION LOGIC

       IN_PROGRESS:
           Use REAL worker GPS.

       ARRIVED:
           Use DESTINATION as worker's displayed
           final position.

       COMPLETED:
           Use DESTINATION as worker's final
           displayed position.

       We DO NOT modify worker_profiles GPS.
    ================================================= */

    const displayedWorkerLocation =
        hasArrived || isCompleted

            ? destinationLocation

            : workerLocation;


    /* =================================================
       MAP CENTER
    ================================================= */

    const mapCenter =
        displayedWorkerLocation ||
        destinationLocation || {

            latitude: 16.682372,
            longitude: 74.47055
        };


    /* =================================================
       ROUTE LINE

       Only show route while worker is actually
       travelling.

       ARRIVED:
           Worker and destination are already
           the same displayed point.

       Therefore NO line.
    ================================================= */

    const linePositions =
        isLive &&
        workerLocation &&
        destinationLocation

            ? [

                [
                    workerLocation.latitude,
                    workerLocation.longitude
                ],

                [
                    destinationLocation.latitude,
                    destinationLocation.longitude
                ]

            ]

            : [];


    /* =================================================
       STATUS TEXT
    ================================================= */

    let statusText =
        trackingData.status;


    if (
        trackingData.status === "ASSIGNED"
    ) {

        statusText =
            "Worker Assigned";

    } else if (
        trackingData.status === "ACCEPTED"
    ) {

        statusText =
            "Worker Accepted";

    } else if (
        trackingData.status === "IN_PROGRESS"
    ) {

        statusText =
            "Worker On The Way";

    } else if (
        trackingData.status === "ARRIVED"
    ) {

        statusText =
            "Worker Arrived";

    } else if (
        trackingData.status === "COMPLETED"
    ) {

        statusText =
            "Service Completed";
    }


    /* =================================================
       RENDER
    ================================================= */

    return (

        <div className="user-tracking-page">

            <UserNavbar />


            <main className="user-tracking-main">

                <div className="tracking-container">


                    {/* =================================
                        HEADER
                    ================================= */}

                    <div className="tracking-header">

                        <div>

                            <span className="tracking-label">
                                SERVICE TRACKING
                            </span>

                            <h2>
                                {trackingData.service_name}
                            </h2>

                            <p>
                                Request #
                                {trackingData.request_code}
                            </p>

                        </div>


                        <div
                            className={
                                isLive
                                    ? "tracking-status active"
                                    : "tracking-status"
                            }
                        >

                            <span className="tracking-dot" />

                            {statusText}

                        </div>

                    </div>


                    {/* =================================
                        WAITING
                    ================================= */}

                    {isWaiting && (

                        <div className="arrival-alert">

                            <i className="bi bi-hourglass-split" />

                            <div>

                                <strong>
                                    Waiting for worker to start service
                                </strong>

                                <p>
                                    Live tracking will begin when
                                    the worker starts the service.
                                </p>

                            </div>

                        </div>
                    )}


                    {/* =================================
                        IN PROGRESS
                    ================================= */}

                    {isLive && (

                        <div className="arrival-alert">

                            <i className="bi bi-geo-alt-fill" />

                            <div>

                                <strong>
                                    Worker is on the way
                                </strong>

                                <p>
                                    Live worker location is being
                                    updated every 5 seconds.
                                </p>

                            </div>

                        </div>
                    )}


                    {/* =================================
                        ARRIVED
                    ================================= */}

                    {hasArrived && (

                        <div className="arrival-alert">

                            <i className="bi bi-check-circle-fill" />

                            <div>

                                <strong>
                                    Worker has reached your location
                                </strong>

                                <p>
                                    Worker and destination are now
                                    at the same location.
                                </p>

                                <p className="mb-0">
                                    Live GPS tracking has stopped.
                                </p>

                            </div>

                        </div>
                    )}


                    {/* =================================
                        COMPLETED
                    ================================= */}

                    {isCompleted && (

                        <div className="completed-alert">

                            <i className="bi bi-check-circle-fill" />

                            <div>

                                <strong>
                                    Service Completed
                                </strong>

                                <p>
                                    This service has been completed successfully.
                                </p>

                            </div>

                        </div>
                    )}


                    <div className="tracking-grid">


                        {/* =================================
                            MAP
                        ================================= */}

                        <div className="tracking-map-card">

                            <MapContainer
                                center={[
                                    mapCenter.latitude,
                                    mapCenter.longitude
                                ]}
                                zoom={15}
                                style={{
                                    height: "520px",
                                    width: "100%"
                                }}
                            >

                                <TileLayer
                                    attribution="&copy; OpenStreetMap contributors"
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />


                                {/* =================================
                                    LIVE WORKER MARKER
                                    
                                    Only during IN_PROGRESS
                                ================================= */}

                                {isLive &&
                                    workerLocation && (

                                        <Marker
                                            position={[
                                                workerLocation.latitude,
                                                workerLocation.longitude
                                            ]}
                                        >

                                            <Popup>

                                                <strong>
                                                    {trackingData.worker_name ||
                                                        "Worker"}
                                                </strong>

                                                <br />

                                                Live Worker Location

                                            </Popup>

                                        </Marker>
                                    )}


                                {/* =================================
                                    DESTINATION MARKER
                                    
                                    During normal tracking.
                                ================================= */}

                                {!hasArrived &&
                                    !isCompleted &&
                                    destinationLocation && (

                                        <Marker
                                            position={[
                                                destinationLocation.latitude,
                                                destinationLocation.longitude
                                            ]}
                                        >

                                            <Popup>

                                                <strong>
                                                    Your Service Location
                                                </strong>

                                                <br />

                                                Booking destination

                                            </Popup>

                                        </Marker>
                                    )}


                                {/* =================================
                                    FINAL ARRIVED MARKER
                                    
                                    IMPORTANT:

                                    Only ONE marker.

                                    Worker is displayed at
                                    destination.
                                ================================= */}

                                {(hasArrived || isCompleted) &&
                                    destinationLocation && (

                                        <Marker
                                            position={[
                                                destinationLocation.latitude,
                                                destinationLocation.longitude
                                            ]}
                                        >

                                            <Popup>

                                                <strong>
                                                    {hasArrived
                                                        ? "Worker Arrived"
                                                        : "Service Completed"}
                                                </strong>

                                                <br />

                                                Your Service Location

                                            </Popup>

                                        </Marker>
                                    )}


                                {/* =================================
                                    ROUTE
                                    
                                    Only while IN_PROGRESS.
                                ================================= */}

                                {linePositions.length > 0 && (

                                    <Polyline
                                        positions={linePositions}
                                    />

                                )}


                                {/* =================================
                                    MAP CENTER
                                ================================= */}

                                <MapUpdater
                                    location={
                                        displayedWorkerLocation ||
                                        destinationLocation
                                    }
                                />

                            </MapContainer>


                            {/* =================================
                                NO LOCATION
                            ================================= */}

                            {!displayedWorkerLocation && (

                                <div className="p-3 text-center">

                                    <i className="bi bi-geo-alt fs-4"></i>

                                    <p className="mb-0 mt-2">

                                        {isLive
                                            ? "Waiting for worker GPS location..."
                                            : "Location is not available yet."
                                        }

                                    </p>

                                </div>
                            )}

                        </div>


                        {/* =================================
                            DETAILS
                        ================================= */}

                        <div className="tracking-details-card">

                            <h4>
                                Worker Details
                            </h4>


                            {/* WORKER */}

                            <div className="worker-profile-box">

                                <div className="worker-avatar">

                                    <i className="bi bi-person-fill" />

                                </div>


                                <div>

                                    <h5>

                                        {trackingData.worker_name ||
                                            "Assigned Worker"}

                                    </h5>

                                    <span>
                                        Service Provider
                                    </span>

                                </div>

                            </div>


                            {/* PHONE */}

                            <div className="tracking-info">

                                <span>
                                    Phone
                                </span>

                                <strong>

                                    {trackingData.worker_phone ||
                                        "Not available"}

                                </strong>

                            </div>


                            {/* STATUS */}

                            <div className="tracking-info">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {statusText}
                                </strong>

                            </div>


                            {/* DESTINATION */}

                            <div className="destination-box">

                                <h5>

                                    <i className="bi bi-house-fill" />

                                    Your Service Location

                                </h5>


                                {trackingData.address_line1 && (

                                    <p>
                                        {trackingData.address_line1}
                                    </p>

                                )}


                                {trackingData.address_line2 && (

                                    <p>
                                        {trackingData.address_line2}
                                    </p>

                                )}


                                {(trackingData.area ||
                                    trackingData.city) && (

                                    <p>

                                        {trackingData.area || ""}

                                        {trackingData.area &&
                                            trackingData.city
                                            ? ", "
                                            : ""}

                                        {trackingData.city || ""}

                                    </p>
                                )}


                                {trackingData.pincode && (

                                    <p>
                                        {trackingData.pincode}
                                    </p>
                                )}

                            </div>


                            {/* =================================
                                LIVE GPS
                            ================================= */}

                            {isLive &&
                                workerLocation && (

                                    <div className="gps-box">

                                        <span>
                                            Worker Live Location
                                        </span>

                                        <small>
                                            Latitude:{" "}
                                            {workerLocation.latitude.toFixed(6)}
                                        </small>

                                        <small>
                                            Longitude:{" "}
                                            {workerLocation.longitude.toFixed(6)}
                                        </small>

                                    </div>
                                )}


                            {/* =================================
                                ARRIVED LOCATION
                            ================================= */}

                            {hasArrived &&
                                destinationLocation && (

                                    <div className="gps-box">

                                        <span>
                                            Worker Reached Destination
                                        </span>

                                        <small>
                                            Latitude:{" "}
                                            {destinationLocation.latitude.toFixed(6)}
                                        </small>

                                        <small>
                                            Longitude:{" "}
                                            {destinationLocation.longitude.toFixed(6)}
                                        </small>

                                    </div>
                                )}


                            {/* =================================
                                COMPLETED LOCATION
                            ================================= */}

                            {isCompleted &&
                                destinationLocation && (

                                    <div className="gps-box">

                                        <span>
                                            Final Service Location
                                        </span>

                                        <small>
                                            Latitude:{" "}
                                            {destinationLocation.latitude.toFixed(6)}
                                        </small>

                                        <small>
                                            Longitude:{" "}
                                            {destinationLocation.longitude.toFixed(6)}
                                        </small>

                                    </div>
                                )}


                            {/* =================================
                                LIVE MESSAGE
                            ================================= */}

                            {isLive && (

                                <div className="live-message">

                                    <span className="pulse-dot" />

                                    Live location updates every
                                    5 seconds

                                </div>
                            )}


                            {/* =================================
                                LAST UPDATED
                            ================================= */}

                            {lastUpdated && (

                                <div className="text-muted small mt-2">

                                    Last updated:{" "}

                                    {lastUpdated.toLocaleTimeString()}

                                </div>
                            )}


                            {/* =================================
                                ARRIVED MESSAGE
                            ================================= */}

                            {hasArrived && (

                                <div className="alert alert-success mt-4">

                                    <i className="bi bi-check-circle-fill me-2" />

                                    Worker has reached your location.

                                    <br />

                                    <small>
                                        The worker marker is now shown
                                        at the booking destination.
                                    </small>

                                </div>
                            )}


                            {/* =================================
                                COMPLETED MESSAGE
                            ================================= */}

                            {isCompleted && (

                                <div className="alert alert-info mt-4">

                                    <i className="bi bi-check-circle-fill me-2" />

                                    Service completed successfully.

                                </div>
                            )}


                            {/* =================================
                                BACK
                            ================================= */}

                            <button
                                type="button"
                                className="btn btn-outline-primary w-100 mt-4"
                                onClick={() =>
                                    navigate("/user/requests")
                                }
                            >

                                <i className="bi bi-arrow-left me-2" />

                                Back to My Requests

                            </button>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default UserTracking;