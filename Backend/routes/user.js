const express = require("express");
const router = express.Router();
const pool = require("../Db/pool");
const result = require("../utils/result");
const cryptojs = require("crypto-js");
const { checkUserAuthorization } = require("../utils/auth");

router.put("/change-password", checkUserAuthorization, (req, res) => {
    const userId = req.headers.payload.userId;
    const {currentPassword,newPassword,confirmPassword} = req.body;

    if (newPassword !== confirmPassword) {
        return res.send(result.createResult("Passwords do not match"));
    }

    const currentHash = cryptojs.SHA256(currentPassword).toString();
    const sql =`SELECT password_hash FROM users WHERE user_id=?`;

    pool.query(sql, [userId], (error, data) => {

        if (error)
            return res.send(result.createResult(error));

        if (data.length === 0)
            return res.send(result.createResult("User not found"));

        if (data[0].password_hash !== currentHash)
            return res.send(result.createResult("Current password is incorrect"));

        const newHash = cryptojs.SHA256(newPassword).toString();
        const updateSql = `UPDATE users SET password_hash=? WHERE user_id=?`;
        pool.query(updateSql,[newHash,userId],(err, resultData) => {
                res.send(result.createResult(err, resultData));
        });
    });
});

router.get("/profile", checkUserAuthorization, (req, res) => {
    const userId = req.headers.payload.userId;
    const sql = `SELECT u.user_id,u.full_name,u.email,u.phone,u.created_at,a.address_id,a.label,a.address_line1,a.address_line2,a.city,a.area,a.pincode,
    a.landmark,a.latitude,a.longitude,a.is_default
    FROM users u LEFT JOIN addresses a 
    ON u.user_id = a.user_id AND a.is_default = 1
    WHERE u.user_id = ?`;

    pool.query(sql, [userId], (error, rows) => {

        if (error) {
            return res.send(result.createResult(error));
        }

        if (!rows || rows.length === 0) {
            return res.send(result.createResult("User not found"));
        }

        res.send(result.createResult(null, rows[0]));

    });
});

router.put("/profile", checkUserAuthorization, (req, res) => {
    const userId = req.headers.payload.userId;
    const {full_name,phone} = req.body;

    const sql = `UPDATE users SET full_name = ?,phone = ? WHERE user_id = ?`;

    pool.query(sql,[full_name,phone,userId],(error, data) => {
         res.send(result.createResult(error, data));
    });
});

router.post("/address", checkUserAuthorization, (req, res) => {
    const userId = req.headers.payload.userId;
    const {label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default} = req.body;

    const sql = `INSERT INTO addresses(user_id,label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default) VALUES(?,?,?,?,?,?,?,?,?,?,?)`;

    pool.query(sql,[userId,label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default],(error, data) => {
        res.send(result.createResult(error, data));
    });
});

router.put("/address", checkUserAuthorization, (req, res) => {
    const userId = req.headers.payload.userId;
    const {address_id,label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default} = req.body;

    const sql = `UPDATE addresses SET label=?,address_line1=?,address_line2=?,city=?,area=?,pincode=?,landmark=?,latitude=?,longitude=?,is_default=? 
                WHERE address_id=? AND user_id=?`;

    pool.query(sql,[label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default,address_id,userId],(error, data) => {
        res.send(result.createResult(error, data));
    });
});

router.get("/dashboard",checkUserAuthorization,(req, res) => {
    const userId = req.headers.payload.userId;
    
    const statsSql = `SELECT 
    (SELECT COUNT(*) FROM services WHERE is_active = 1) AS availableServices,
    (SELECT COUNT(*) FROM service_requests WHERE user_id = ?) AS servicesUsed,
    (SELECT COUNT(*) FROM service_requests WHERE user_id = ? AND status IN ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','ARRIVED')) AS currentServices,
    (SELECT COUNT(*) FROM service_requests WHERE user_id = ? AND status = 'COMPLETED') AS completedServices
    `;

    pool.query(statsSql,[userId,userId,userId],(error, stats) => {

        if (error) {
            console.error("USER DASHBOARD STATS ERROR:",error);
            return res.send(result.createResult(error.sqlMessage || error.message || "Unable to load dashboard"));
        }
        
        // ACTIVE / ONGOING SERVICES ONLY
        const activitySql = `SELECT sr.request_id,sr.request_code,s.service_name AS title,sr.status,sr.estimated_price,sr.created_at,sr.updated_at FROM service_requests sr 
        INNER JOIN services s ON s.service_id = sr.service_id WHERE sr.user_id = ? AND sr.status IN ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS','ARRIVED')
        ORDER BY sr.updated_at DESC`;

        pool.query(activitySql,[userId],(activityError, activities) => {

            if (activityError) {
                console.error("USER DASHBOARD ACTIVITY ERROR:",activityError);
                return res.send(result.createResult(activityError.sqlMessage || activityError.message || "Unable to load current services"));
            }

            const dashboard = {
                availableServices:Number(stats[0].availableServices),
                servicesUsed:Number(stats[0].servicesUsed),
                currentServices:Number(stats[0].currentServices),
                completedServices:Number(stats[0].completedServices),
                // Only active services
                recentActivities:activities || []
            };

            return res.send(result.createResult(null,dashboard));
        });
    });
});

router.get("/current-request",checkUserAuthorization,(req, res) => {
    const userId = req.headers.payload.userId;

    const sql = `SELECT sr.request_id,sr.request_code,sr.status,sr.estimated_price,sr.created_at,s.service_name,u.full_name AS worker_name,u.phone AS worker_phone,wp.primary_city AS worker_city,wp.primary_area AS worker_area,wp.avg_rating AS worker_rating
        FROM service_requests sr INNER JOIN services s ON s.service_id = sr.service_id LEFT JOIN users u ON u.user_id = sr.assigned_worker_id LEFT JOIN worker_profiles wp ON wp.worker_id = sr.assigned_worker_id
        WHERE sr.user_id = ? AND sr.status IN ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS') ORDER BY sr.created_at DESC LIMIT 1
        `;

    pool.query(sql,[userId],(err, data) => {
        if (err) {
            console.log("CURRENT REQUEST ERROR:",err)
            return res.send(result.createResult(err));
        }
        res.send(result.createResult(null,data.length > 0 ? data[0] : null));
    });
});



router.get("/services",checkUserAuthorization,(req, res) => {
    const sql = `SELECT service_id,category_id,service_name,description,base_price,price_unit FROM services WHERE is_active = 1 ORDER BY service_name`;

    pool.query(sql, (err, data) => {
        if (err) {
            return res.send(result.createResult(err));
        }
        res.send(result.createResult(null, data));
    });
});

router.get("/services/:serviceId",checkUserAuthorization,(req, res) => {
    const serviceId = req.params.serviceId;

    const sql = `SELECT service_id,category_id,service_name,description,base_price,price_unit
    FROM services WHERE service_id = ? AND is_active = 1
    `;

    pool.query(sql,[serviceId],(err, data) => {
        if (err) {
            console.log("Get Service Error:", err);
            return res.send(result.createResult(err));
        }

        if (data.length === 0) {
            return res.send(result.createResult("Service not found"));
        }
        
        res.send(result.createResult(null,data[0]));
    });
});

router.get("/addresses",checkUserAuthorization,(req, res) => {
    const userId = req.headers.payload.userId;

    const sql = `SELECT address_id,label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude,is_default
    FROM addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC
    `;

    pool.query(sql,[userId],(err, data) => {
        if (err) {
            return res.send(result.createResult(err));
        }
        res.send(result.createResult(null,data));
    });
});

router.get("/requests",checkUserAuthorization,(req, res) => {

    const userId = req.headers.payload.userId;

    const sql = `SELECT sr.request_id,sr.request_code,sr.service_id,sr.category_id,sr.address_id,sr.assigned_worker_id,sr.description,sr.status,sr.estimated_price,sr.final_price,sr.created_at,s.service_name,s.price_unit,u.full_name AS worker_name,u.phone AS worker_phone,wp.primary_city AS worker_city,wp.primary_area AS worker_area,wp.avg_rating AS worker_rating
    FROM service_requests sr INNER JOIN services s ON s.service_id = sr.service_id 
    LEFT JOIN users u ON u.user_id = sr.assigned_worker_id 
    LEFT JOIN worker_profiles wp ON wp.worker_id = sr.assigned_worker_id WHERE sr.user_id = ? ORDER BY sr.created_at DESC
    `;

    pool.query(sql,[userId],(err, data) => {
        if (err) {
            console.log("GET REQUESTS ERROR:",err);
            return res.send(result.createResult(err));
        }
        res.send(result.createResult(null,data));
    });
});

router.get("/service-requests/:requestId/tracking",checkUserAuthorization,(req, res) => {

    const userId = req.headers.payload.userId;
    const {requestId} = req.params;
    
    const sql = `SELECT sr.request_id,sr.request_code,sr.service_id,sr.status,sr.assigned_worker_id,CASE WHEN sr.status IN ('ASSIGNED','ACCEPTED','IN_PROGRESS')
    AND sr.assigned_worker_id IS NOT NULL AND wp.latitude IS NOT NULL AND wp.longitude IS NOT NULL 
    THEN 1 ELSE 0 END AS tracking_active,s.service_name,u.full_name AS worker_name,u.phone AS worker_phone,
    wp.latitude AS worker_latitude,wp.longitude AS worker_longitude,wp.location_accuracy AS worker_accuracy,wp.location_updated_at AS worker_location_updated_at,
    a.address_id,a.label,a.address_line1,a.address_line2,a.city,a.area,a.pincode,a.landmark,a.latitude AS destination_latitude,a.longitude AS destination_longitude
    FROM service_requests sr INNER JOIN services s ON sr.service_id = s.service_id
    LEFT JOIN users u ON u.user_id = sr.assigned_worker_id
    LEFT JOIN worker_profiles wp ON wp.worker_id = sr.assigned_worker_id
    LEFT JOIN addresses a ON a.address_id = sr.address_id
    WHERE sr.request_id = ? AND sr.user_id = ?
    `;

    pool.query(sql,[requestId,userId],(err, data) => {

        if (err) {
            console.error("USER TRACKING ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to load tracking data"));
        }

        if (data.length === 0) {
            return res.send(result.createResult("Tracking data not found"));
        }

        const tracking = data[0];

        tracking.tracking_active = Boolean(tracking.tracking_active);

        if (tracking.worker_latitude !== null) {
            tracking.worker_latitude = Number(tracking.worker_latitude);
        }

        if (tracking.worker_longitude !== null) {
            tracking.worker_longitude = Number(tracking.worker_longitude);
        }

        if (tracking.worker_accuracy !== null) {
            tracking.worker_accuracy = Number(tracking.worker_accuracy);
        }

        if (tracking.destination_latitude !== null) {
            tracking.destination_latitude = Number(tracking.destination_latitude);
        }

        if (tracking.destination_longitude !== null) {
            tracking.destination_longitude = Number(tracking.destination_longitude);
        }

        return res.send(result.createResult(null,tracking));
    });
});

router.get("/history",checkUserAuthorization,(req, res) => {

    const userId = req.headers.payload.userId;
    console.log("LOADING USER HISTORY:",userId);
    const sql = `SELECT sr.request_id,sr.request_code,sr.service_id,s.service_name,sr.status,sr.estimated_price,sr.final_price,sr.created_at,sr.updated_at FROM service_requests sr
    LEFT JOIN services s ON s.service_id = sr.service_id WHERE sr.user_id = ? AND sr.status IN ('COMPLETED','CANCELLED') ORDER BY COALESCE(sr.updated_at,sr.created_at) DESC
    `;

    pool.query(sql,[userId],(error, data) => {

        if (error) {
            console.error("USER HISTORY SQL ERROR:",error);
            return res.send(result.createResult(error.sqlMessage || error.message || "Unable to load history"));
        }
        console.log("USER HISTORY FOUND:",data.length);

        return res.send(result.createResult(null,data || []));
    });
});

// ==========================================================
// CREATE SERVICE REQUEST
// POST /service-requests
// ==========================================================

router.post("/service-requests",checkUserAuthorization,(req, res) => {
    const userId = req.headers.payload.userId;
    const {serviceId,addressId,description} = req.body;

    if (!serviceId) {
        return res.send(result.createResult("Service is required"));
    }
    if (!addressId) {
        return res.send(result.createResult("Address is required"));
    }

    const serviceSql = `SELECT service_id,category_id,service_name,base_price,price_unit FROM services WHERE service_id = ? AND is_active = 1`;

    pool.query(serviceSql,[serviceId],(serviceError, serviceData) => {
        if (serviceError) {
            console.error("SERVICE LOOKUP ERROR:",serviceError);
            return res.send(result.createResult(serviceError.sqlMessage || serviceError.message || "Unable to load service"));
        }
        if (!serviceData || serviceData.length === 0) {
            return res.send(result.createResult("Service not found"));
        }

        const service = serviceData[0];
        const addressSql = `SELECT address_id,label,address_line1,address_line2,city,area,pincode,landmark,latitude,longitude
        FROM addresses WHERE address_id = ? AND user_id = ?`;

        pool.query(addressSql,[addressId,userId],(addressError, addressData) => {

            if (addressError) {
                console.error("ADDRESS LOOKUP ERROR:",addressError);
                return res.send(result.createResult(addressError.sqlMessage || addressError.message || "Unable to load address"));
            }
            if (!addressData || addressData.length === 0) {
                return res.send(result.createResult("Invalid address"));
            }

            const userAddress = addressData[0];
            const userLatitude = Number(userAddress.latitude);
            const userLongitude = Number(userAddress.longitude);

            if (!Number.isFinite(userLatitude) || !Number.isFinite(userLongitude)) {
                return res.send(result.createResult("Selected address does not have valid GPS coordinates"));
            }

            const MAX_WORKER_DISTANCE_KM = 5;
            const workerSql = `SELECT wp.worker_id,u.full_name,u.phone,wp.avg_rating,wp.total_jobs_completed,wp.latitude AS worker_latitude,wp.longitude AS worker_longitude,wp.location_accuracy,wp.location_updated_at,wp.primary_city,wp.primary_area,
            (6371 * ACOS(LEAST(1,GREATEST(-1,COS(RADIANS(?)) * COS(RADIANS(wp.latitude)) * COS(RADIANS(wp.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(wp.latitude)))))) AS distance_km
            FROM worker_profiles wp INNER JOIN users u ON u.user_id = wp.worker_id INNER JOIN worker_categories wc ON wc.worker_id = wp.worker_id 
            WHERE wc.category_id = ? AND wp.approval_status = 'APPROVED' AND wp.is_available = 1 AND u.is_active = 1 AND u.is_blocked = 0 AND wp.latitude IS NOT NULL AND wp.longitude IS NOT NULL
            HAVING distance_km <= ? ORDER BY distance_km ASC,wp.avg_rating DESC,wp.total_jobs_completed DESC LIMIT 1`;            

            pool.query(workerSql,[userLatitude,userLongitude,userLatitude,service.category_id,MAX_WORKER_DISTANCE_KM],(workerError, workerData) => {
                if (workerError) {
                    console.error("WORKER SEARCH ERROR:",workerError);
                    return res.send(result.createResult(workerError.sqlMessage || workerError.message || "Unable to find nearby worker"));
                }

                let assignedWorker = null;

                if (workerData && workerData.length > 0) {
                    assignedWorker = workerData[0];
                }
                else {
                    console.log("NO AVAILABLE WORKER WITHIN",MAX_WORKER_DISTANCE_KM,"KM");
                }

                const requestStatus = assignedWorker ? "ASSIGNED" : "PENDING";
                const assignedWorkerId = assignedWorker ? assignedWorker.worker_id : null;


                const requestCode = "SR-" + Date.now() + "-" + Math.floor(Math.random() * 1000);

                const insertSql = `INSERT INTO service_requests (request_code,user_id,category_id,service_id,address_id,assigned_worker_id,description,status,estimated_price) VALUES (?,?,?,?,?,?,?,?,?)`;

                pool.query(insertSql,[requestCode,userId,service.category_id,service.service_id,addressId,assignedWorkerId,description || null,requestStatus,service.base_price],(insertError, insertData) => {

                    if (insertError) {
                       console.error("REQUEST INSERT ERROR:",insertError);                     
                       return res.send(result.createResult(insertError.sqlMessage || insertError.message || "Unable to create service request"));
                    }
                    if (assignedWorker) {

                        const updateWorkerSql = `UPDATE worker_profiles SET is_available = 0,updated_at = CURRENT_TIMESTAMP WHERE worker_id = ? AND is_available = 1`;
                        pool.query(updateWorkerSql,[assignedWorker.worker_id],(workerUpdateError) => {
                            if (workerUpdateError) {
                                console.error("WORKER AVAILABILITY UPDATE ERROR:",workerUpdateError);
                            }
                            return sendResponse();
                        });

                    }
                    else {
                        return sendResponse();
                    }

                    function sendResponse() {

                        return res.send(result.createResult(null,{
                            message:assignedWorker ? "Service booked and worker assigned successfully" : "Service booked successfully, but no nearby worker is currently available",
                            requestId:insertData.insertId,
                            requestCode:requestCode,
                            serviceId:service.service_id,
                            serviceName:service.service_name,
                            categoryId:service.category_id,
                            estimatedPrice:service.base_price,
                            status:requestStatus,
                            workerAssigned:Boolean(assignedWorker),
                            worker:assignedWorker ? {
                                workerId:assignedWorker.worker_id,
                                name:assignedWorker.full_name,
                                phone:assignedWorker.phone,
                                city:assignedWorker.primary_city,
                                area:assignedWorker.primary_area,
                                rating:Number(assignedWorker.avg_rating),
                                distanceKm:Number(assignedWorker.distance_km),
                                latitude:Number(assignedWorker.worker_latitude),
                                longitude:Number(assignedWorker.worker_longitude)
                            } : null
                        }));
                    }
                });
            });
        });
    });
});

// ==========================================================
// USER CANCEL SERVICE REQUEST
// PUT /service-requests/:requestId/cancel
// ==========================================================

router.put("/service-requests/:requestId/cancel",checkUserAuthorization,(req, res) => {

    const userId = req.headers.payload.userId;
    const requestId = req.params.requestId;
    const {reason} = req.body;

    const getRequestSql = `SELECT request_id,assigned_worker_id,status FROM service_requests WHERE request_id = ? AND user_id = ?`;

    pool.query(getRequestSql,[requestId,userId],(error, data) => {
        if (error) {
            console.error("GET REQUEST FOR CANCELLATION ERROR:",error);
            return res.send(result.createResult(error.sqlMessage || error.message || "Unable to find service request"));
        }

        if (data.length === 0) {
            return res.send(result.createResult("Service request not found"));
        }

        const request = data[0];    
        const cancellableStatuses = ["PENDING","ASSIGNED","ACCEPTED","IN_PROGRESS"];

        if (!cancellableStatuses.includes(request.status)) {
            return res.send(result.createResult("This service cannot be cancelled in its current status"));
        }

        const cancelSql = `UPDATE service_requests SET status = 'CANCELLED',cancelled_reason = ?,updated_at = CURRENT_TIMESTAMP WHERE request_id = ? AND user_id = ? AND status IN ('PENDING','ASSIGNED','ACCEPTED','IN_PROGRESS')`;

        pool.query(cancelSql,[reason || "Cancelled by user",requestId,userId],(cancelError, cancelResult) => {

            if (cancelError) {
                console.error("CANCEL REQUEST ERROR:",cancelError);
                return res.send(result.createResult(cancelError.sqlMessage || cancelError.message || "Unable to cancel service"));
            }
            if (cancelResult.affectedRows === 0) {
                return res.send(result.createResult("Service could not be cancelled"));
            }
            if (request.assigned_worker_id) {
                const releaseWorkerSql = `UPDATE worker_profiles SET is_available = 1,updated_at = CURRENT_TIMESTAMP WHERE worker_id = ?`;
                pool.query(releaseWorkerSql,[request.assigned_worker_id],(workerError) => {
                    if (workerError) {
                        console.error("RELEASE WORKER ERROR:", workerError);
                    }
                    sendCancelResponse();
                })
            } 
            else {
                sendCancelResponse();
            }

            function sendCancelResponse() {
                return res.send(result.createResult(null,{
                    requestId:Number(requestId),
                    status:"CANCELLED",
                    message:"Service request cancelled successfully"
                }));
            }

        });
    });
});
module.exports = router;