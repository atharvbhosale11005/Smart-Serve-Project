import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

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

import WorkerNavbar from "../components/WorkerNavbar";

import {
    getWorkerRequests,
    startService,
    updateWorkerLocation,
    markWorkerArrived,
    completeService
} from "../Services/workerService";

import "leaflet/dist/leaflet.css";
import "./WorkerTracking.css";


// ======================================================
// LEAFLET ICON FIX
// ======================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
});


// ======================================================
// MAP UPDATER
// ======================================================

function MapUpdater({ position }) {

    const map = useMap();

    useEffect(() => {

        if (!position) {
            return;
        }

        map.setView(
            [
                position.latitude,
                position.longitude
            ],
            15,
            {
                animate: true
            }
        );

    }, [position, map]);

    return null;
}


// ======================================================
// WORKER TRACKING
// ======================================================

function WorkerTracking() {

    const { requestId } = useParams();

    const navigate = useNavigate();


    // ==================================================
    // GPS REFS
    // ==================================================

    const watchIdRef = useRef(null);

    const startingGpsRef = useRef(false);


    // ==================================================
    // STATE
    // ==================================================

    const [loading, setLoading] =
        useState(true);

    const [request, setRequest] =
        useState(null);

    // Live browser GPS
    const [workerLocation, setWorkerLocation] =
        useState(null);

    const [tracking, setTracking] =
        useState(false);

    const [startingService, setStartingService] =
        useState(false);

    const [arriving, setArriving] =
        useState(false);

    const [completing, setCompleting] =
        useState(false);


    // ==================================================
    // ERROR MESSAGE
    // ==================================================

    const getErrorMessage = (
        error,
        fallback
    ) => {

        if (
            typeof error?.response?.data ===
            "string"
        ) {
            return error.response.data;
        }

        if (
            typeof error?.response?.data?.data ===
            "string"
        ) {
            return error.response.data.data;
        }

        if (
            typeof error?.message ===
            "string"
        ) {
            return error.message;
        }

        return fallback;
    };


    // ==================================================
    // START GPS
    // ==================================================

    const startLocationTracking = () => {

        // ----------------------------------------------
        // Already running
        // ----------------------------------------------

        if (
            watchIdRef.current !== null
        ) {

            console.log(
                "GPS watcher already running"
            );

            return;
        }


        // ----------------------------------------------
        // Already starting
        // ----------------------------------------------

        if (
            startingGpsRef.current
        ) {
            return;
        }


        // ----------------------------------------------
        // Browser support
        // ----------------------------------------------

        if (
            !navigator.geolocation
        ) {

            toast.error(
                "Geolocation is not supported by your browser."
            );

            return;
        }


        startingGpsRef.current = true;

        setTracking(true);


        console.log(
            "================================"
        );

        console.log(
            "STARTING WORKER GPS"
        );

        console.log(
            "REQUEST:",
            requestId
        );

        console.log(
            "================================"
        );


        // ==================================================
        // WATCH POSITION
        // ==================================================

        const watchId =
            navigator.geolocation.watchPosition(

                async (position) => {

                    const latitude =
                        Number(
                            position.coords.latitude
                        );

                    const longitude =
                        Number(
                            position.coords.longitude
                        );

                    const accuracy =
                        Number(
                            position.coords.accuracy
                        );


                    if (
                        !Number.isFinite(
                            latitude
                        ) ||
                        !Number.isFinite(
                            longitude
                        )
                    ) {

                        console.warn(
                            "Invalid GPS coordinates"
                        );

                        return;
                    }


                    const location = {

                        latitude,

                        longitude,

                        accuracy

                    };


                    console.log(
                        "WORKER LIVE LOCATION:",
                        location
                    );


                    // ------------------------------------------
                    // UPDATE LOCAL MAP
                    // ------------------------------------------

                    setWorkerLocation(
                        location
                    );


                    // ------------------------------------------
                    // SEND LOCATION TO BACKEND
                    // ------------------------------------------

                    try {

                        const response =
                            await updateWorkerLocation(
                                requestId,
                                latitude,
                                longitude,
                                accuracy
                            );


                        console.log(
                            "LOCATION UPDATE:",
                            response
                        );

                    } catch (error) {

                        console.error(
                            "LOCATION SEND ERROR:",
                            error
                        );

                    }

                },


                // ==================================================
                // GPS ERROR
                // ==================================================

                (error) => {

                    console.error(
                        "GPS ERROR:",
                        error
                    );

                    setTracking(false);


                    if (
                        error.code ===
                        error.PERMISSION_DENIED
                    ) {

                        toast.error(
                            "Location permission denied. Please allow location access."
                        );

                    } else if (
                        error.code ===
                        error.POSITION_UNAVAILABLE
                    ) {

                        toast.error(
                            "Worker location is currently unavailable."
                        );

                    } else if (
                        error.code ===
                        error.TIMEOUT
                    ) {

                        console.warn(
                            "GPS timeout"
                        );

                    } else {

                        toast.error(
                            "Unable to get worker location."
                        );
                    }

                },


                // ==================================================
                // GPS OPTIONS
                // ==================================================

                {
                    enableHighAccuracy: true,

                    maximumAge: 3000,

                    timeout: 10000
                }
            );


        watchIdRef.current =
            watchId;

        startingGpsRef.current =
            false;


        console.log(
            "GPS WATCH ID:",
            watchId
        );
    };


    // ==================================================
    // STOP GPS
    // ==================================================

    const stopLocationTracking = () => {

        if (
            watchIdRef.current !== null
        ) {

            console.log(
                "STOPPING WORKER GPS"
            );


            navigator.geolocation.clearWatch(
                watchIdRef.current
            );


            watchIdRef.current =
                null;
        }


        startingGpsRef.current =
            false;

        setTracking(false);
    };


    // ==================================================
    // LOAD REQUEST
    // ==================================================

    useEffect(() => {

        let mounted = true;


        const initializeTracking =
            async () => {

                try {

                    setLoading(true);


                    console.log(
                        "================================"
                    );

                    console.log(
                        "WORKER TRACKING INITIALIZATION"
                    );

                    console.log(
                        "REQUEST ID:",
                        requestId
                    );

                    console.log(
                        "================================"
                    );


                    // ------------------------------------------
                    // LOAD WORKER REQUESTS
                    // ------------------------------------------

                    const response =
                        await getWorkerRequests();


                    console.log(
                        "WORKER REQUESTS RESPONSE:",
                        response
                    );


                    if (!mounted) {
                        return;
                    }


                    if (
                        !response ||
                        response.status !==
                        "success"
                    ) {

                        toast.error(
                            typeof response?.data ===
                            "string"
                                ? response.data
                                : "Unable to load request"
                        );

                        return;
                    }


                    const requests =
                        Array.isArray(
                            response.data
                        )
                            ? response.data
                            : [];


                    // ------------------------------------------
                    // FIND REQUEST
                    // ------------------------------------------

                    const foundRequest =
                        requests.find(
                            item =>
                                Number(
                                    item.request_id
                                ) ===
                                Number(
                                    requestId
                                )
                        );


                    if (!foundRequest) {

                        toast.error(
                            "Service request not found"
                        );

                        navigate(
                            "/worker/requests",
                            {
                                replace: true
                            }
                        );

                        return;
                    }


                    console.log(
                        "FOUND REQUEST:",
                        foundRequest
                    );


                    setRequest(
                        foundRequest
                    );


                    // ==================================================
                    // INITIAL WORKER LOCATION
                    //
                    // This comes from worker_profiles.
                    //
                    // It is NOT work_area.
                    // ==================================================

                    const initialWorkerLatitude =
                        Number(
                            foundRequest.worker_latitude
                        );

                    const initialWorkerLongitude =
                        Number(
                            foundRequest.worker_longitude
                        );

                    const initialWorkerAccuracy =
                        foundRequest.worker_accuracy !==
                        null &&
                        foundRequest.worker_accuracy !==
                        undefined
                            ? Number(
                                foundRequest.worker_accuracy
                            )
                            : null;


                    const hasInitialWorkerLocation =
                        Number.isFinite(
                            initialWorkerLatitude
                        ) &&
                        Number.isFinite(
                            initialWorkerLongitude
                        );


                    if (
                        hasInitialWorkerLocation
                    ) {

                        const initialLocation = {

                            latitude:
                                initialWorkerLatitude,

                            longitude:
                                initialWorkerLongitude,

                            accuracy:
                                Number.isFinite(
                                    initialWorkerAccuracy
                                )
                                    ? initialWorkerAccuracy
                                    : null
                        };


                        console.log(
                            "INITIAL WORKER LOCATION FROM DATABASE:",
                            initialLocation
                        );


                        setWorkerLocation(
                            initialLocation
                        );
                    }


                    // ==================================================
                    // STATUS
                    // ==================================================

                    const currentStatus =
                        String(
                            foundRequest.status ||
                            ""
                        ).toUpperCase();


                    console.log(
                        "CURRENT STATUS:",
                        currentStatus
                    );


                    // ==================================================
                    // ACCEPTED
                    //
                    // Start service here if user opened tracking
                    // directly after accepting.
                    // ==================================================

                    if (
                        currentStatus ===
                        "ACCEPTED"
                    ) {

                        setStartingService(true);

                        try {

                            const startResponse =
                                await startService(
                                    requestId
                                );


                            console.log(
                                "START RESPONSE:",
                                startResponse
                            );


                            if (
                                !startResponse ||
                                startResponse.status !==
                                "success"
                            ) {

                                toast.error(
                                    typeof startResponse?.data ===
                                    "string"
                                        ? startResponse.data
                                        : "Unable to start service"
                                );

                                return;
                            }


                            setRequest(
                                previous => ({
                                    ...previous,
                                    status:
                                        "IN_PROGRESS"
                                })
                            );


                            toast.success(
                                "Service started. Live tracking is active."
                            );


                            // Start GPS
                            startLocationTracking();

                        } catch (error) {

                            console.error(
                                "START SERVICE ERROR:",
                                error
                            );

                            toast.error(
                                getErrorMessage(
                                    error,
                                    "Unable to start service"
                                )
                            );

                        } finally {

                            setStartingService(
                                false
                            );
                        }

                        return;
                    }


                    // ==================================================
                    // IN_PROGRESS
                    //
                    // Start GPS.
                    // ==================================================

                    if (
                        currentStatus ===
                        "IN_PROGRESS"
                    ) {

                        console.log(
                            "SERVICE ALREADY IN PROGRESS"
                        );

                        startLocationTracking();

                        return;
                    }


                    // ==================================================
                    // ARRIVED
                    //
                    // GPS MUST NOT START.
                    // ==================================================

                    if (
                        currentStatus ===
                        "ARRIVED"
                    ) {

                        console.log(
                            "WORKER ALREADY ARRIVED"
                        );

                        console.log(
                            "GPS WILL REMAIN STOPPED"
                        );

                        stopLocationTracking();

                        setTracking(false);

                        return;
                    }


                    // ==================================================
                    // COMPLETED
                    //
                    // GPS MUST NOT START.
                    // ==================================================

                    if (
                        currentStatus ===
                        "COMPLETED"
                    ) {

                        console.log(
                            "SERVICE ALREADY COMPLETED"
                        );

                        stopLocationTracking();

                        setTracking(false);

                        return;
                    }


                    console.log(
                        "NO TRACKING FOR STATUS:",
                        currentStatus
                    );

                } catch (error) {

                    console.error(
                        "TRACKING INITIALIZATION ERROR:",
                        error
                    );


                    if (mounted) {

                        toast.error(
                            getErrorMessage(
                                error,
                                "Unable to load tracking details"
                            )
                        );
                    }

                } finally {

                    if (mounted) {
                        setLoading(false);
                    }

                }
            };


        initializeTracking();


        // ==================================================
        // CLEANUP
        // ==================================================

        return () => {

            mounted = false;

            stopLocationTracking();

        };

    }, [requestId]);


    // ==================================================
    // MARK ARRIVED
    // ==================================================

    const handleArrived = async () => {

        try {

            setArriving(true);


            console.log(
                "MARKING ARRIVED:",
                requestId
            );


            const response =
                await markWorkerArrived(
                    requestId
                );


            console.log(
                "ARRIVED RESPONSE:",
                response
            );


            if (
                !response ||
                response.status !==
                "success"
            ) {

                toast.error(
                    typeof response?.data ===
                    "string"
                        ? response.data
                        : "Unable to update arrival"
                );

                return;
            }


            // ------------------------------------------
            // STOP GPS
            // ------------------------------------------

            stopLocationTracking();


            // ------------------------------------------
            // UPDATE UI
            // ------------------------------------------

            setRequest(
                previous => ({
                    ...previous,
                    status: "ARRIVED"
                })
            );


            toast.success(
                "You reached the destination. Live tracking stopped."
            );

        } catch (error) {

            console.error(
                "ARRIVAL ERROR:",
                error
            );


            toast.error(
                getErrorMessage(
                    error,
                    "Unable to mark arrival"
                )
            );

        } finally {

            setArriving(false);
        }
    };


    // ==================================================
    // COMPLETE SERVICE
    // ==================================================

    const handleComplete = async () => {

        try {

            // ------------------------------------------
            // SAFETY CHECK
            // ------------------------------------------

            if (
                String(
                    request?.status || ""
                ).toUpperCase() !==
                "ARRIVED"
            ) {

                toast.error(
                    "You can complete the service only after reaching the destination."
                );

                return;
            }


            setCompleting(true);


            console.log(
                "================================"
            );

            console.log(
                "COMPLETING SERVICE"
            );

            console.log(
                "REQUEST:",
                requestId
            );

            console.log(
                "================================"
            );


            // ------------------------------------------
            // COMPLETE API
            // ------------------------------------------

            const response =
                await completeService(
                    requestId
                );


            console.log(
                "COMPLETE RESPONSE:",
                response
            );


            if (
                !response ||
                response.status !==
                "success"
            ) {

                toast.error(
                    typeof response?.data ===
                    "string"
                        ? response.data
                        : "Unable to complete service"
                );

                return;
            }


            // ------------------------------------------
            // MAKE SURE GPS IS STOPPED
            // ------------------------------------------

            stopLocationTracking();


            // ------------------------------------------
            // UPDATE STATUS
            // ------------------------------------------

            setRequest(
                previous => ({
                    ...previous,
                    status: "COMPLETED"
                })
            );


            toast.success(
                "Service completed successfully!"
            );

        } catch (error) {

            console.error(
                "COMPLETE SERVICE ERROR:",
                error
            );


            toast.error(
                getErrorMessage(
                    error,
                    "Unable to complete service"
                )
            );

        } finally {

            setCompleting(false);
        }
    };


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (

            <div className="worker-tracking-page">

                <WorkerNavbar />

                <main className="worker-tracking-main">

                    <div className="text-center py-5">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        />

                        <p className="mt-3">
                            Loading tracking...
                        </p>

                    </div>

                </main>

            </div>
        );
    }


    // ==================================================
    // NO REQUEST
    // ==================================================

    if (!request) {

        return (

            <div className="worker-tracking-page">

                <WorkerNavbar />

                <main className="worker-tracking-main">

                    <div className="text-center py-5">

                        <h4>
                            Tracking unavailable
                        </h4>

                        <p className="text-muted">
                            Unable to load this service request.
                        </p>

                        <button
                            className="btn btn-primary mt-3"
                            onClick={() =>
                                navigate(
                                    "/worker/requests"
                                )
                            }
                        >
                            Back to My Requests
                        </button>

                    </div>

                </main>

            </div>
        );
    }


    // ==================================================
    // WORKER INITIAL / DATABASE LOCATION
    //
    // worker_profiles.latitude
    // worker_profiles.longitude
    // ==================================================

    const databaseWorkerLatitude =
        Number(
            request.worker_latitude
        );

    const databaseWorkerLongitude =
        Number(
            request.worker_longitude
        );

    const databaseWorkerAccuracy =
        request.worker_accuracy !== null &&
        request.worker_accuracy !== undefined
            ? Number(
                request.worker_accuracy
            )
            : null;


    const validDatabaseWorkerLocation =
        Number.isFinite(
            databaseWorkerLatitude
        ) &&
        Number.isFinite(
            databaseWorkerLongitude
        );


    const databaseWorkerLocation =
        validDatabaseWorkerLocation
            ? {

                latitude:
                    databaseWorkerLatitude,

                longitude:
                    databaseWorkerLongitude,

                accuracy:
                    Number.isFinite(
                        databaseWorkerAccuracy
                    )
                        ? databaseWorkerAccuracy
                        : null

            }
            : null;


    // ==================================================
    // DISPLAYED WORKER LOCATION
    //
    // Priority:
    //
    // 1. Live browser GPS
    // 2. Last worker location from database
    //
    // NEVER use work_area.
    // ==================================================

    const displayedWorkerLocation =
        workerLocation ||
        databaseWorkerLocation;


    // ==================================================
    // CUSTOMER BOOKING DESTINATION
    //
    // IMPORTANT:
    //
    // This is the address selected by the user
    // while creating the service request.
    //
    // It comes from:
    //
    // service_requests.address_id
    //        ↓
    // addresses.latitude
    // addresses.longitude
    //
    // It is NOT user's current GPS.
    // ==================================================

    const destinationLatitude =
        Number(
            request.destination_latitude
        );

    const destinationLongitude =
        Number(
            request.destination_longitude
        );


    const validDestinationLocation =
        Number.isFinite(
            destinationLatitude
        ) &&
        Number.isFinite(
            destinationLongitude
        );


    const customerLocation =
        validDestinationLocation
            ? {

                latitude:
                    destinationLatitude,

                longitude:
                    destinationLongitude

            }
            : null;


    // ==================================================
    // MAP CENTER
    //
    // Worker first.
    // Destination second.
    // ==================================================

    const mapCenter =
        displayedWorkerLocation ||
        customerLocation ||
        {
            latitude: 16.682372,
            longitude: 74.47055
        };


    // ==================================================
    // STRAIGHT LINE
    //
    // This is only a visual connection between the
    // worker and destination.
    //
    // It is NOT a road route.
    // ==================================================

    const routePositions =
        displayedWorkerLocation &&
        customerLocation
            ? [

                [
                    displayedWorkerLocation.latitude,
                    displayedWorkerLocation.longitude
                ],

                [
                    customerLocation.latitude,
                    customerLocation.longitude
                ]

            ]
            : [];


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="worker-tracking-page">

            <WorkerNavbar />


            <main className="worker-tracking-main">

                <div className="tracking-container">


                    {/* ==================================================
                        HEADER
                    ================================================== */}

                    <div className="tracking-header">

                        <div>

                            <span className="tracking-label">
                                LIVE SERVICE
                            </span>

                            <h2>
                                {request.service_name}
                            </h2>

                            <p>
                                Request #
                                {request.request_code}
                            </p>

                        </div>


                        <div
                            className={
                                tracking
                                    ? "tracking-status active"
                                    : "tracking-status"
                            }
                        >

                            <span className="tracking-dot" />

                            {tracking
                                ? "Live Tracking"
                                : request.status}

                        </div>

                    </div>


                    {/* ==================================================
                        STARTING SERVICE
                    ================================================== */}

                    {startingService && (

                        <div className="alert alert-info mb-3">

                            <i className="bi bi-play-circle-fill me-2"></i>

                            Starting service and requesting
                            your current location...

                        </div>

                    )}


                    {/* ==================================================
                        MAIN GRID
                    ================================================== */}

                    <div className="tracking-grid">


                        {/* ==================================================
                            MAP
                        ================================================== */}

                        <div className="tracking-map-card">

                            <MapContainer

                                center={[
                                    mapCenter.latitude,
                                    mapCenter.longitude
                                ]}

                                zoom={15}

                                scrollWheelZoom={true}

                                style={{
                                    height: "520px",
                                    width: "100%"
                                }}

                            >

                                <TileLayer

                                    attribution="
                                        &copy; OpenStreetMap contributors
                                    "

                                    url="
                                        https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
                                    "

                                />


                                {/* ==================================================
                                    WORKER CURRENT LOCATION
                                ================================================== */}

                                {displayedWorkerLocation && (

                                    <Marker
                                        position={[
                                            displayedWorkerLocation.latitude,
                                            displayedWorkerLocation.longitude
                                        ]}
                                    >

                                        <Popup>

                                            <strong>
                                                Worker Current Location
                                            </strong>

                                            <br />

                                            Service Provider

                                            <br />

                                            Latitude:{" "}

                                            {displayedWorkerLocation.latitude.toFixed(
                                                6
                                            )}

                                            <br />

                                            Longitude:{" "}

                                            {displayedWorkerLocation.longitude.toFixed(
                                                6
                                            )}

                                            {displayedWorkerLocation.accuracy !==
                                                null &&
                                                displayedWorkerLocation.accuracy !==
                                                undefined && (

                                                    <>
                                                        <br />

                                                        Accuracy:{" "}

                                                        {Math.round(
                                                            displayedWorkerLocation.accuracy
                                                        )}

                                                        m
                                                    </>
                                                )}

                                        </Popup>

                                    </Marker>

                                )}


                                {/* ==================================================
                                    CUSTOMER BOOKING DESTINATION
                                ================================================== */}

                                {customerLocation && (

                                    <Marker

                                        position={[
                                            customerLocation.latitude,
                                            customerLocation.longitude
                                        ]}

                                    >

                                        <Popup>

                                            <strong>
                                                Customer Destination
                                            </strong>

                                            <br />

                                            {request.address_line1}

                                            <br />

                                            {request.address_line2 &&
                                                request.address_line2}

                                            {request.address_line2 && (
                                                <br />
                                            )}

                                            {request.area},{" "}
                                            {request.city}

                                            <br />

                                            {request.pincode}

                                        </Popup>

                                    </Marker>

                                )}


                                {/* ==================================================
                                    CONNECTION BETWEEN WORKER AND DESTINATION
                                ================================================== */}

                                {routePositions.length > 0 && (

                                    <Polyline
                                        positions={
                                            routePositions
                                        }
                                    />

                                )}


                                {/* ==================================================
                                    MAP CENTER
                                ================================================== */}

                                <MapUpdater
                                    position={
                                        displayedWorkerLocation
                                    }
                                />

                            </MapContainer>

                        </div>


                        {/* ==================================================
                            DETAILS
                        ================================================== */}

                        <div className="tracking-details-card">

                            <h4>
                                Service Details
                            </h4>


                            {/* CUSTOMER */}

                            <div className="tracking-info">

                                <span>
                                    Customer
                                </span>

                                <strong>
                                    {request.customer_name ||
                                        "Customer"}
                                </strong>

                            </div>


                            {/* PHONE */}

                            <div className="tracking-info">

                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {request.customer_phone ||
                                        "Not available"}
                                </strong>

                            </div>


                            {/* SERVICE */}

                            <div className="tracking-info">

                                <span>
                                    Service
                                </span>

                                <strong>
                                    {request.service_name}
                                </strong>

                            </div>


                            {/* STATUS */}

                            <div className="tracking-info">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {request.status}
                                </strong>

                            </div>


                            {/* GPS */}

                            <div className="tracking-info">

                                <span>
                                    GPS
                                </span>

                                <strong>
                                    {tracking
                                        ? "Active"
                                        : "Stopped"}
                                </strong>

                            </div>


                            {/* ==================================================
                                DESTINATION
                            ================================================== */}

                            <div className="destination-box">

                                <h5>

                                    <i className="bi bi-geo-alt-fill" />

                                    {" "}
                                    Destination

                                </h5>


                                <p>
                                    {request.address_line1}
                                </p>


                                {request.address_line2 && (

                                    <p>
                                        {request.address_line2}
                                    </p>

                                )}


                                <p>
                                    {request.area},{" "}
                                    {request.city}
                                </p>


                                <p>
                                    {request.pincode}
                                </p>


                                {request.landmark && (

                                    <p>
                                        Landmark:{" "}
                                        {request.landmark}
                                    </p>

                                )}

                            </div>


                            {/* ==================================================
                                CURRENT GPS
                            ================================================== */}

                            {displayedWorkerLocation && (

                                <div className="gps-box">

                                    <span>
                                        Current Worker GPS
                                    </span>


                                    <small>

                                        Latitude:{" "}

                                        {displayedWorkerLocation.latitude.toFixed(
                                            6
                                        )}

                                    </small>


                                    <small>

                                        Longitude:{" "}

                                        {displayedWorkerLocation.longitude.toFixed(
                                            6
                                        )}

                                    </small>


                                    {displayedWorkerLocation.accuracy !==
                                        null &&
                                        displayedWorkerLocation.accuracy !==
                                        undefined && (

                                            <small>

                                                Accuracy:{" "}

                                                {Math.round(
                                                    displayedWorkerLocation.accuracy
                                                )}

                                                {" "}m

                                            </small>

                                        )}

                                </div>

                            )}


                            {/* ==================================================
                                GPS WAITING
                            ================================================== */}

                            {!displayedWorkerLocation &&
                                request.status ===
                                "IN_PROGRESS" && (

                                    <div className="alert alert-warning mt-4">

                                        <i className="bi bi-geo-alt me-2"></i>

                                        Waiting for your GPS
                                        location...

                                    </div>

                                )}


                            {/* ==================================================
                                ARRIVED BUTTON
                            ================================================== */}

                            {request.status ===
                                "IN_PROGRESS" && (

                                    <button

                                        className="
                                            btn
                                            btn-success
                                            w-100
                                            mt-4
                                        "

                                        disabled={
                                            arriving ||
                                            startingService ||
                                            !displayedWorkerLocation
                                        }

                                        onClick={
                                            handleArrived
                                        }

                                    >

                                        {arriving ? (

                                            <>

                                                <span
                                                    className="
                                                        spinner-border
                                                        spinner-border-sm
                                                        me-2
                                                    "
                                                />

                                                Updating...

                                            </>

                                        ) : (

                                            <>

                                                <i className="
                                                    bi
                                                    bi-geo-alt-fill
                                                    me-2
                                                " />

                                                I've Reached Destination

                                            </>

                                        )}

                                    </button>

                                )}


                            {/* ==================================================
                                ARRIVED
                            ================================================== */}

                            {request.status ===
                                "ARRIVED" && (

                                    <div className="mt-4">

                                        <div className="
                                            alert
                                            alert-success
                                        ">

                                            <i className="
                                                bi
                                                bi-check-circle-fill
                                                me-2
                                            " />

                                            <strong>
                                                You have reached
                                                the destination.
                                            </strong>

                                            <br />

                                            <span>
                                                Live tracking has
                                                stopped.
                                            </span>

                                            <br />

                                            <span>
                                                Finish the work and
                                                complete the service.
                                            </span>

                                        </div>


                                        {/* ==================================================
                                            COMPLETE SERVICE
                                        ================================================== */}

                                        <button
                                            type="button"

                                            className="
                                                btn
                                                btn-primary
                                                w-100
                                                mt-3
                                            "

                                            onClick={
                                                handleComplete
                                            }

                                            disabled={
                                                completing
                                            }
                                        >

                                            {completing ? (

                                                <>

                                                    <span
                                                        className="
                                                            spinner-border
                                                            spinner-border-sm
                                                            me-2
                                                        "
                                                    />

                                                    Completing Service...

                                                </>

                                            ) : (

                                                <>

                                                    <i className="
                                                        bi
                                                        bi-check2-circle
                                                        me-2
                                                    " />

                                                    Complete Service

                                                </>

                                            )}

                                        </button>

                                    </div>

                                )}


                            {/* ==================================================
                                COMPLETED
                            ================================================== */}

                            {request.status ===
                                "COMPLETED" && (

                                    <div className="
                                        alert
                                        alert-success
                                        mt-4
                                    ">

                                        <i className="
                                            bi
                                            bi-check-circle-fill
                                            me-2
                                        " />

                                        <strong>
                                            Service Completed
                                        </strong>

                                        <br />

                                        <span>
                                            This service has been
                                            successfully completed.
                                        </span>

                                        <br />

                                        <button
                                            type="button"

                                            className="
                                                btn
                                                btn-outline-success
                                                mt-3
                                            "

                                            onClick={() =>
                                                navigate(
                                                    "/worker/requests"
                                                )
                                            }
                                        >

                                            <i className="
                                                bi
                                                bi-arrow-left
                                                me-2
                                            " />

                                            Back to My Requests

                                        </button>

                                    </div>

                                )}

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}


export default WorkerTracking;