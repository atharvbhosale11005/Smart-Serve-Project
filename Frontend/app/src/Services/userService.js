import axios from "axios";
import config from "./config";

const BASE_URL = config.BASE_URL;

const getConfig = (token) => ({
    headers: {
        token: token
    }
});

export async function getDashboard(token) {

    const response = await axios.get(
        `${BASE_URL}/user/dashboard`,
        getConfig(token)
    );

    return response.data;
}


export async function getProfile(token) {

    const response = await axios.get(
        `${BASE_URL}/user/profile`,
        getConfig(token)
    );

    return response.data;
}


export async function updateProfile(token, profile) {

    const response = await axios.put(
        `${BASE_URL}/user/profile`,
        profile,
        getConfig(token)
    );

    return response.data;
}

export async function addAddress(token, address) {

    const response = await axios.post(
        `${BASE_URL}/user/address`,
        address,
        getConfig(token)
    );

    return response.data;
}

export async function updateAddress(token, address) {

    const response = await axios.put(
        `${BASE_URL}/user/address`,
        address,
        getConfig(token)
    );

    return response.data;
}

export async function changePassword(token,currentPassword,newPassword,confirmPassword) {

    const response = await axios.put(
        `${BASE_URL}/user/change-password`,
        {
            currentPassword,
            newPassword,
            confirmPassword
        },
        getConfig(token)
    );

    return response.data;
}

export async function getAvailableServices() {

    const token = sessionStorage.getItem("token");

    const response = await axios.get(
        `${BASE_URL}/user/services`,
        getConfig(token)
    );

    return response.data;
}

export async function getServiceById(token, serviceId) {

    const response = await axios.get(
        `${BASE_URL}/user/services/${serviceId}`,
        getConfig(token)
    );

    return response.data;
}

export async function createServiceRequest(token,requestData) {

    const response = await axios.post(
        `${BASE_URL}/user/service-requests`,
        requestData,
        getConfig(token)
    );

    return response.data;
}

export async function getRequestHistory(token) {

    const response = await axios.get(
        `${BASE_URL}/user/history`,
        getConfig(token)
    );

    return response.data;
}

export async function getCurrentStatus(token) {

    const response = await axios.get(
        `${BASE_URL}/user/status`,
        getConfig(token)
    );

    return response.data;
}

export async function getFeedback(token) {

    const response = await axios.get(
        `${BASE_URL}/user/feedback`,
        getConfig(token)
    );

    return response.data;
}

export async function getUserAddresses(token) {

    const response = await axios.get(
        `${BASE_URL}/user/addresses`,
        getConfig(token)
    );

    return response.data;
}

export async function getUserRequests(token) {

    const response = await axios.get(
        `${BASE_URL}/user/requests`,
        getConfig(token)
    );

    return response.data;
}

export async function getCurrentRequest(token) {

    const response = await axios.get(
        `${BASE_URL}/user/current-request`,
        getConfig(token)
    );

    return response.data;
}

export async function getRequestTracking(token, requestId) {
    try {

        const response = await axios.get(
            `${BASE_URL}/user/service-requests/${requestId}/tracking`,
            getConfig(token)
        );

        return response.data;

    } catch (error) {

        console.error(
            "USER TRACKING ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
}

export async function cancelServiceRequest(token, requestId, reason) {
    try {

        const response = await axios.put(
            `${BASE_URL}/user/service-requests/${requestId}/cancel`,
            {
                reason: reason || "Cancelled by user"
            },
            getConfig(token)
        );

        return response.data;

    } catch (error) {

        console.error(
            "CANCEL SERVICE REQUEST ERROR:",
            error.response?.data ||
            error.message ||
            error
        );

        throw error;
    }
}