import axios from "axios";
import config from "./config";

const BASE_URL = `${config.BASE_URL}/feedback`;

const getHeaders = () => {
    const token = sessionStorage.getItem("token");
    return {
        headers: {token: token}
    };
};

export const submitFeedback = async (requestId,rating,comment) => {

    try {
        const response = await axios.post(`${BASE_URL}`,
            {
                requestId: Number(requestId),
                rating: Number(rating),
                comment: comment || ""
            },
            getHeaders()
        );
        console.log("SUBMIT FEEDBACK RESPONSE:",response.data);
        return response.data;
    } catch (error) {
        console.error("SUBMIT FEEDBACK ERROR:",error.response?.data || error.message || error);
        throw error;
    }
};

export const getUserFeedback = async () => {

    try {
        const response = await axios.get(`${BASE_URL}/user`,getHeaders());
        console.log("USER FEEDBACK RESPONSE:",response.data);
        return response.data;
    } catch (error) {
        console.error("GET USER FEEDBACK ERROR:",error.response?.data || error.message || error);
        throw error;
    }
};


export const getRequestFeedback = async (requestId) => {

    try {
        const response = await axios.get(`${BASE_URL}/user/request/${requestId}`,getHeaders());
        console.log("REQUEST FEEDBACK RESPONSE:",response.data);
        return response.data;
    } catch (error) {
        console.error("GET REQUEST FEEDBACK ERROR:",error.response?.data || error.message || error);
        throw error;
    }
};

export const getWorkerFeedback = async () => {

    try {
        const response = await axios.get(`${BASE_URL}/worker`,getHeaders());
        console.log("WORKER FEEDBACK RESPONSE:",response.data);
        return response.data;
    } catch (error) {
        console.error("GET WORKER FEEDBACK ERROR:",error.response?.data || error.message || error);
        throw error;
    }
};

export const getWorkerFeedbackSummary = async () => {

    try {
        const response = await axios.get(`${BASE_URL}/worker/summary`,getHeaders());
        console.log("WORKER FEEDBACK SUMMARY RESPONSE:",response.data);
        return response.data;
    } catch (error) {
        console.error("GET WORKER FEEDBACK SUMMARY ERROR:",error.response?.data || error.message || error);
        throw error;
    }
};