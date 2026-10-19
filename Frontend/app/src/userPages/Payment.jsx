import { useEffect, useState } from "react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import { toast } from "react-toastify";

import {
    getServiceById,
    getUserAddresses,
    createServiceRequest
} from "../Services/userService";

import "./Payment.css";


function Payment() {

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    /*
    =====================================================
    SERVICE ID FROM URL
    Example:
    /user/payment?serviceId=12
    =====================================================
    */

    const serviceId = searchParams.get("serviceId");


    /*
    =====================================================
    STATE
    =====================================================
    */

    const [service, setService] = useState(null);

    const [addresses, setAddresses] = useState([]);

    const [addressId, setAddressId] = useState("");

    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(true);

    const [booking, setBooking] = useState(false);


    /*
    =====================================================
    LOAD SERVICE + ADDRESSES
    =====================================================
    */

    useEffect(() => {

        if (!serviceId) {

            toast.error("Service not selected");

            navigate("/user/services");

            return;
        }

        loadData();

    }, [serviceId]);


    /*
    =====================================================
    LOAD DATA
    =====================================================
    */

    const loadData = async () => {

        try {

            setLoading(true);

            const token =
                sessionStorage.getItem("token");


            /*
            ==============================================
            CHECK LOGIN
            ==============================================
            */

            if (!token) {

                toast.error("Please login first");

                navigate("/login");

                return;
            }


            /*
            ==============================================
            GET SELECTED SERVICE
            ==============================================
            */

            const serviceResponse =
                await getServiceById(
                    token,
                    serviceId
                );

            console.log(
                "SERVICE RESPONSE:",
                serviceResponse
            );


            if (serviceResponse.status !== "success") {

                toast.error(
                    serviceResponse.data ||
                    "Unable to load service"
                );

                navigate("/user/services");

                return;
            }


            setService(serviceResponse.data);


            /*
            ==============================================
            GET USER ADDRESSES
            ==============================================
            */

            const addressResponse =
                await getUserAddresses(token);

            console.log(
                "ADDRESS RESPONSE:",
                addressResponse
            );


            if (addressResponse.status === "success") {

                const userAddresses =
                    addressResponse.data || [];

                setAddresses(userAddresses);


                /*
                ==========================================
                SELECT DEFAULT ADDRESS
                ==========================================
                */

                const defaultAddress =
                    userAddresses.find(
                        address =>
                            Number(address.is_default) === 1
                    );


                if (defaultAddress) {

                    setAddressId(
                        String(defaultAddress.address_id)
                    );

                }

            } else {

                toast.error(
                    addressResponse.data ||
                    "Unable to load addresses"
                );

            }

        } catch (error) {

            console.error(
                "PAYMENT PAGE ERROR:",
                error
            );

            console.error(
                "SERVER RESPONSE:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.data ||
                "Unable to load service"
            );

        } finally {

            setLoading(false);

        }

    };


    /*
    =====================================================
    CONFIRM BOOKING
    =====================================================
    */

    const handleConfirmBooking = async () => {

        /*
        ==============================================
        ADDRESS VALIDATION
        ==============================================
        */

        if (!addressId) {

            toast.warning(
                "Please select an address"
            );

            return;
        }


        /*
        ==============================================
        SERVICE VALIDATION
        ==============================================
        */

        if (!serviceId) {

            toast.error(
                "Service ID is missing"
            );

            return;
        }


        try {

            setBooking(true);

            const token =
                sessionStorage.getItem("token");


            /*
            ==============================================
            CREATE SERVICE REQUEST
            ==============================================
            */

            const requestData = {

                serviceId:
                    Number(serviceId),

                addressId:
                    Number(addressId),

                description:
                    description.trim() || null

            };


            console.log(
                "BOOKING REQUEST:",
                requestData
            );


            const response =
                await createServiceRequest(
                    token,
                    requestData
                );


            console.log(
                "BOOKING RESPONSE:",
                response
            );

            if (response.status === "success") {

    if (response.data?.workerAssigned) {

        toast.success(
            `Service booked successfully! Worker assigned: ${response.data.worker.name}`
        );

    } else {

        toast.info(
            "Service booked successfully, but no nearby worker is currently available."
        );

    }

    navigate("/user/dashboard");

} else {

    toast.error(
        response.data ||
        "Booking failed"
    );

}

        } catch (error) {

            console.error(
                "BOOKING ERROR:",
                error
            );

            console.error(
                "SERVER RESPONSE:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.data ||
                "Unable to book service"
            );

        } finally {

            setBooking(false);

        }

    };


    /*
    =====================================================
    LOADING
    =====================================================
    */

    if (loading) {

        return (

            <div className="payment-page">

                <div className="payment-container">

                    <div className="payment-card text-center">

                        <div
                            className="spinner-border text-primary"
                            role="status"
                        ></div>

                        <p className="mt-3">
                            Loading service details...
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    SERVICE NOT FOUND
    =====================================================
    */

    if (!service) {

        return (

            <div className="payment-page">

                <div className="payment-container">

                    <div className="payment-card text-center">

                        <span className="payment-error-icon">!</span>

                        <h3>
                            Service Not Found
                        </h3>

                        <p className="text-muted">
                            The selected service is no longer available.
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() =>
                                navigate("/user/services")
                            }
                        >
                            Browse Services
                        </button>

                    </div>

                </div>

            </div>

        );

    }


    /*
    =====================================================
    CURRENT DATE & TIME
    =====================================================
    */

    const currentDate =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const currentTime =
        new Date().toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    /*
    =====================================================
    PRICE
    =====================================================
    */

    const servicePrice =
        Number(service.base_price) || 0;


    /*
    =====================================================
    SELECTED ADDRESS
    =====================================================
    */

    const selectedAddress =
        addresses.find(
            address =>
                String(address.address_id) ===
                String(addressId)
        );


    /*
    =====================================================
    UI
    =====================================================
    */

    return (

        <div className="payment-page">

            <div className="payment-container">

                {/* ======================================
                    PAYMENT CARD
                ====================================== */}

                <div className="payment-card">

                    {/* ==================================
                        HEADER - Removed "Confirm Service"
                    ================================== */}

                    <div className="payment-header text-center">

                        <p className="payment-subtitle">
                            Review your service details before booking
                        </p>

                    </div>


                    {/* ==================================
                        SERVICE DETAILS
                    ================================== */}

                    <div className="service-summary">

                        <div className="service-summary-icon">

                            <span>🔧</span>

                        </div>

                        <div className="service-summary-details">

                            <h2>
                                {service.service_name}
                            </h2>

                            <p>
                                {service.description ||
                                    `Professional ${service.service_name} service`
                                }
                            </p>

                        </div>

                        <span className="service-status">
                            Available
                        </span>

                    </div>


                    {/* ==================================
                        DATE & TIME
                    ================================== */}

                    <div className="booking-info-grid">


                        <div className="booking-info-box">

                           

                            <div>

                                <span>
                                    DATE
                                </span>

                                <strong>
                                    {currentDate}
                                </strong>

                            </div>

                        </div>


                        <div className="booking-info-box">

                            

                            <div>

                                <span>
                                    TIME
                                </span>

                                <strong>
                                    {currentTime}
                                </strong>

                            </div>

                        </div>


                    </div>


                    {/* ==================================
                        PROBLEM DESCRIPTION
                    ================================== */}

                    <div className="form-section">

                        <label className="form-label">

                            Problem Description

                        </label>

                        <textarea
                            className="form-control"
                            rows="4"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            placeholder="Describe your problem in detail..."
                        />

                    </div>


                    {/* ==================================
                        SERVICE ADDRESS
                    ================================== */}

                    <div className="form-section">

                        <label className="form-label">

                            Service Address

                        </label>

                        {selectedAddress ? (

                            <div className="selected-address">

                                <div className="selected-address-icon">

                                    <span>📍</span>

                                </div>

                                <div>

                                    <strong>
                                        {selectedAddress.label}
                                    </strong>

                                    <p>

                                        {selectedAddress.address_line1}

                                        {selectedAddress.address_line2 &&
                                            `, ${selectedAddress.address_line2}`
                                        }

                                        {`, ${selectedAddress.area}, ${selectedAddress.city}`}

                                        {`, ${selectedAddress.pincode}`}

                                    </p>

                                </div>

                            </div>

                        ) : (

                            <div className="no-address">

                                <span>📍</span>

                                <div>

                                    <strong>
                                        No service address found
                                    </strong>

                                    <p>
                                        Please add an address from your profile.
                                    </p>

                                </div>

                            </div>

                        )}

                    </div>


                    {/* ==================================
                        PRICE
                    ================================== */}

                    <div className="price-section">

                        <div className="price-row">

                            <span>
                                Service Amount
                            </span>

                            <strong>
                                ₹{servicePrice.toFixed(2)}
                            </strong>

                        </div>


                        <div className="price-row">

                            <span>
                                Price Unit
                            </span>

                            <span>
                                {service.price_unit || "per visit"}
                            </span>

                        </div>


                        <div className="price-row">

                            <span>
                                Service Fee
                            </span>

                            <span className="free">
                                Free
                            </span>

                        </div>


                        <hr />


                        <div className="total-row">

                            <div>

                                <strong>
                                    Total Amount
                                </strong>

                                <small>
                                    Including all charges
                                </small>

                            </div>

                            <strong>
                                ₹{servicePrice.toFixed(2)}
                            </strong>

                        </div>

                    </div>


                    {/* ==================================
                        CONFIRM BOOKING
                    ================================== */}

                    <button
                        type="button"
                        className="confirm-booking-button"
                        onClick={handleConfirmBooking}
                        disabled={
                            booking ||
                            addresses.length === 0
                        }
                    >

                        {booking ? (

                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                ></span>

                                Booking...

                            </>

                        ) : (

                            <>
                                Confirm Booking
                            </>

                        )}

                    </button>


                    {/* ==================================
                        BACK BUTTON - Moved Below
                    ================================== */}

                    <button
                        type="button"
                        className="back-button"
                        onClick={() =>
                            navigate("/user/services")
                        }
                    >

                        ← Back to Services

                    </button>


                    {/* ==================================
                        PAYMENT NOTE
                    ================================== */}

                    <div className="payment-note">

                        <span>ℹ️</span>

                        <span>
                            Payment integration will be added later.
                            Currently this page displays the service
                            amount only.
                        </span>

                    </div>


                </div>

            </div>

        </div>

    );

}

export default Payment;