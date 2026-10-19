import axios from "axios";
import config from "./config";

export async function login(email, password) {
    const URL = config.BASE_URL + "/auth/login";
    const BODY = {email,password};
    const response = await axios.post(URL, BODY);
    return response.data;
}

export async function registerUser(full_name, email, phone, password) {
    const URL = config.BASE_URL + "/auth/register/user";
    const BODY = {full_name,email,phone,password};
    const response = await axios.post(URL, BODY);
    return response.data;
}

export async function registerWorker(full_name,email,phone,password,categories) {
    const URL = config.BASE_URL + "/auth/register/worker";
    const BODY = {full_name,email,phone,password,categories};
    const response = await axios.post(URL,BODY);
    return response.data;
}

export async function getServiceCategories() {
    const URL = config.BASE_URL + "/auth/service-categories";
    const response = await axios.get(URL);
    return response.data;
}