const jwt = require("jsonwebtoken");

const config = require("./config");
const result = require("./result");


//Authentication Middleware
function authUser(req, res, next) {

    const allowedUrls = ["/auth/login","/auth/register/user","/auth/register/worker","/auth/service-categories"];

    if (allowedUrls.includes(req.path)) {
        return next();
    }

    const token = req.headers.token;

    if (!token) {
        return res.send(result.createResult("Token Missing"));
    }
    try {
        const payload = jwt.verify(token, config.SECRET);
        req.user = payload;
        req.headers.payload = payload;
        next();
    } catch (err) {
        return res.send(result.createResult("Invalid Token"));
    }
}


//User Authorization Middleware
function checkUserAuthorization(req, res, next) {

    if (!req.user) {
        return res.send(result.createResult("Unauthorized"));
    }

    if (req.user.role === "USER") {
        return next();
    }

    return res.send(result.createResult("Unauthorized"));
}

//Worker Authorization Middleware
function checkWorkerAuthorization(req, res, next) {

    if (!req.user) {
        return res.send(result.createResult("Unauthorized"));
    }

    if (req.user.role === "WORKER") {
        return next();
    }

    return res.send(result.createResult("Unauthorized"));
}

//Admin Authorization Middleware
function checkAdminAuthorization(req, res, next) {

    if (!req.user) {
        return res.send(result.createResult("Unauthorized"));
    }

    if (req.user.role === "ADMIN") {
        return next();
    }

    return res.send(result.createResult("Unauthorized"));
}

module.exports = {authUser,checkUserAuthorization,checkWorkerAuthorization,checkAdminAuthorization};