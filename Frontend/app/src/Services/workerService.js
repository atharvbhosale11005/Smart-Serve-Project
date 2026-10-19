import axios from "axios";

const BASE_URL = "http://localhost:3000/worker";


// ======================================================
// COMMON HEADERS
// ======================================================

const getHeaders = () => {

    const token = sessionStorage.getItem("token");

    return {
        headers: {
            token: token
        }
    };
};


// ======================================================
// WORKER DASHBOARD
// ======================================================
export const getWorkerDashboard = async (token) => {

    try {

        const response = await axios.get(
            `${BASE_URL}/dashboard`,
            {
                headers: {
                    token:
                        token ||
                        sessionStorage.getItem("token")
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "WORKER DASHBOARD ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;

    }

};

// ======================================================
// WORKER PROFILE
// ======================================================

export const getWorkerProfile = async () => {

    try {

        const response = await axios.get(
            `${BASE_URL}/profile`,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "WORKER PROFILE ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


export const updateWorkerProfile = async (data) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/profile`,
            data,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "UPDATE WORKER PROFILE ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// AVAILABILITY
// ======================================================

export const getAvailability = async () => {

    try {

        const response = await axios.get(
            `${BASE_URL}/availability`,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "GET AVAILABILITY ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


export const updateAvailability = async (data) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/availability`,
            data,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "UPDATE AVAILABILITY ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// ⭐ WORKER CURRENT LOCATION
// ======================================================
//
// This is different from:
//
// /service-requests/:requestId/location
//
// This API is used while the worker is AVAILABLE,
// before any service has started.
//
// ======================================================

export const updateWorkerCurrentLocation = async (
    latitude,
    longitude,
    accuracy
) => {
    const response = await axios.post(
        `${BASE_URL}/current-location`,
        {
            latitude: Number(latitude),
            longitude: Number(longitude),
            accuracy:
                accuracy !== undefined && accuracy !== null
                    ? Number(accuracy)
                    : null
        },
        getHeaders()
    );

    return response.data;
};

export const clearWorkerCurrentLocation = async () => {
    try {

        const response = await axios.delete(
            `${BASE_URL}/current-location`,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "CLEAR WORKER LOCATION ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// WORKER CATEGORIES
// ======================================================

export const getWorkerCategories = async () => {

    try {

        const response = await axios.get(
            `${BASE_URL}/categories`,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "GET WORKER CATEGORIES ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


export const updateWorkerCategories = async (categories) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/categories`,
            {
                categories
            },
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "UPDATE WORKER CATEGORIES ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// WORKER REQUESTS
// ======================================================

export const getWorkerRequests = async () => {

    try {

        const response = await axios.get(
            `${BASE_URL}/requests`,
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "WORKER REQUESTS ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// ACCEPT SERVICE REQUEST
// ======================================================

export const acceptServiceRequest = async (requestId) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/service-requests/${requestId}/accept`,
            {},
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "ACCEPT REQUEST ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// START SERVICE
// ======================================================

export const startService = async (requestId) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/service-requests/${requestId}/start`,
            {},
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "START SERVICE ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// SERVICE TRACKING LOCATION
// ======================================================
//
// Used ONLY after a service becomes IN_PROGRESS.
//
// ======================================================

export const updateWorkerLocation = async (
    requestId,
    latitude,
    longitude,
    accuracy
) => {

    try {

        if (
            latitude === undefined ||
            latitude === null ||
            longitude === undefined ||
            longitude === null
        ) {

            throw new Error(
                "Latitude and longitude are required"
            );
        }

        const response = await axios.post(
            `${BASE_URL}/service-requests/${requestId}/location`,
            {
                latitude: Number(latitude),
                longitude: Number(longitude),
                accuracy:
                    accuracy !== undefined &&
                    accuracy !== null
                        ? Number(accuracy)
                        : null
            },
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "WORKER LOCATION ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// WORKER ARRIVED
// ======================================================

export const markWorkerArrived = async (requestId) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/service-requests/${requestId}/arrived`,
            {},
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "ARRIVED ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};


// ======================================================
// COMPLETE SERVICE
// ======================================================

export const completeService = async (requestId) => {

    try {

        const response = await axios.put(
            `${BASE_URL}/service-requests/${requestId}/complete`,
            {},
            getHeaders()
        );

        return response.data;

    } catch (error) {

        console.error(
            "COMPLETE SERVICE ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
};

export const rejectWorkerRequest = async (
    token,
    requestId,
    reason
) => {
    const response = await axios.put(
        `${API_URL}/worker/service-requests/${requestId}/reject`,
        {
            reason: reason || "Rejected by worker"
        },
        {
            headers: {
                token: token
            }
        }
    );

    return response.data;
};

