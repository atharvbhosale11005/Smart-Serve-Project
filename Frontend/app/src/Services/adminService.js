import axios from "axios";
import config from "./config";

const BASE_URL = `${config.BASE_URL}/admin`;

const getHeaders = (token) => {
  const authToken = token || sessionStorage.getItem("token");
  return {
    headers: {
      token: authToken
    }
  };
};

/*
=====================================================
1. ADMIN DASHBOARD
=====================================================
*/
export const getAdminDashboard = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/dashboard`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN DASHBOARD API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
2. MANAGE USERS (CUSTOMERS)
=====================================================
*/
export const getAdminUsers = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/users`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN USERS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateUserStatus = async (userId, statusData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/users/${userId}/status`, statusData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE USER STATUS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
3. MANAGE WORKERS & APPROVALS
=====================================================
*/
export const getAdminWorkers = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/workers`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN WORKERS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateWorkerApproval = async (workerId, status, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/workers/${workerId}/approval`, { status }, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE WORKER APPROVAL API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateWorkerStatus = async (workerId, statusData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/workers/${workerId}/status`, statusData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE WORKER STATUS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
4. MANAGE SERVICE CATEGORIES
=====================================================
*/
export const getAdminCategories = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/categories`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN CATEGORIES API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const createCategory = async (categoryData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/categories`, categoryData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("CREATE CATEGORY API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateCategory = async (categoryId, categoryData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/categories/${categoryId}`, categoryData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE CATEGORY API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteCategory = async (categoryId, token) => {
  try {
    const response = await axios.delete(`${BASE_URL}/categories/${categoryId}`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("DELETE CATEGORY API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
5. MANAGE SERVICES
=====================================================
*/
export const getAdminServices = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/services`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN SERVICES API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const createService = async (serviceData, token) => {
  try {
    const response = await axios.post(`${BASE_URL}/services`, serviceData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("CREATE SERVICE API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateService = async (serviceId, serviceData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/services/${serviceId}`, serviceData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE SERVICE API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteService = async (serviceId, token) => {
  try {
    const response = await axios.delete(`${BASE_URL}/services/${serviceId}`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("DELETE SERVICE API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
6. GLOBAL SERVICE REQUESTS & BOOKINGS
=====================================================
*/
export const getAdminRequests = async (status = "ALL", token) => {
  try {
    const query = status && status !== "ALL" ? `?status=${status}` : "";
    const response = await axios.get(`${BASE_URL}/requests${query}`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN REQUESTS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const assignWorkerToRequest = async (requestId, workerId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/requests/${requestId}/assign`, { workerId }, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ASSIGN WORKER API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const cancelAdminRequest = async (requestId, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/requests/${requestId}/cancel`, {}, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("CANCEL REQUEST API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
7. PLATFORM ANALYTICS & REPORTS
=====================================================
*/
export const getAdminAnalytics = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/analytics`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN ANALYTICS API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

/*
=====================================================
8. ADMIN PROFILE & SETTINGS
=====================================================
*/
export const getAdminProfile = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/profile`, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("ADMIN PROFILE API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const updateAdminProfile = async (profileData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/profile`, profileData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("UPDATE ADMIN PROFILE API ERROR:", error.response?.data || error.message);
    throw error;
  }
};

export const changeAdminPassword = async (passwordData, token) => {
  try {
    const response = await axios.put(`${BASE_URL}/change-password`, passwordData, getHeaders(token));
    return response.data;
  } catch (error) {
    console.error("CHANGE ADMIN PASSWORD API ERROR:", error.response?.data || error.message);
    throw error;
  }
};
