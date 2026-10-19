const express = require("express");
const router = express.Router();
const pool = require("../Db/pool");
const result = require("../utils/result");
const {authUser,checkWorkerAuthorization} = require("../utils/auth");

router.get("/dashboard",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    console.log("LOADING WORKER DASHBOARD:",workerId);

    const workerSql = `SELECT u.user_id,u.full_name,u.email,u.phone,wp.experience_years,wp.professional_summary,wp.primary_city,wp.is_available,wp.approval_status,
    wp.avg_rating,wp.total_jobs_completed,wp.latitude,wp.longitude,wp.location_accuracy,wp.location_updated_at
    FROM users u INNER JOIN worker_profiles wp ON wp.worker_id = u.user_id WHERE u.user_id = ?
    `;

    const categorySql = `SELECT COUNT(*) AS totalCategories FROM worker_categories WHERE worker_id = ?`;

    const completedSql = ` SELECT COUNT(*) AS completedJobs FROM service_requests WHERE assigned_worker_id = ? AND status = 'COMPLETED'`;

    const pendingSql = `SELECT COUNT(*) AS pendingRequests FROM service_requests WHERE assigned_worker_id = ? AND status = 'ASSIGNED'`;

    const activeSql = `SELECT COUNT(*) AS activeJobs FROM service_requests WHERE assigned_worker_id = ? AND status IN ('ACCEPTED','IN_PROGRESS','ARRIVED')`;

    const activitySql = `SELECT sr.request_id,sr.request_code,sr.status,sr.created_at,sr.updated_at,s.service_name,u.full_name AS customer_name,
    sr.estimated_price,sr.final_price FROM service_requests sr INNER JOIN services s ON s.service_id = sr.service_id
    INNER JOIN users u ON u.user_id = sr.user_id WHERE sr.assigned_worker_id = ? ORDER BY COALESCE(sr.updated_at,sr.created_at) DESC LIMIT 5
    `;

    pool.query(workerSql,[workerId],(workerError, workerData) => {

        if (workerError) {
            console.error("WORKER DASHBOARD WORKER ERROR:",workerError);
            return res.send(result.createResult(workerError.sqlMessage || workerError.message || "Unable to load worker dashboard"));
        }

        if (!workerData || workerData.length === 0) {
            return res.send(result.createResult("Worker profile not found"));
        }

        pool.query(categorySql,[workerId],(categoryError, categoryData) => {

            if (categoryError) {
                console.error("WORKER DASHBOARD CATEGORY ERROR:",categoryError);
                return res.send(result.createResult(categoryError.sqlMessage || categoryError.message || "Unable to load worker categories"));
            }

            pool.query(completedSql,[workerId],(completedError, completedData) => {

                if (completedError) {
                    console.error("WORKER DASHBOARD COMPLETED ERROR:",completedError);               
                    return res.send(result.createResult(completedError.sqlMessage || completedError.message || "Unable to load completed jobs"));
                }

                pool.query(pendingSql,[workerId],(pendingError, pendingData) => {

                    if (pendingError) {
                        console.error("WORKER DASHBOARD PENDING ERROR:",pendingError);
                        return res.send(result.createResult(pendingError.sqlMessage || pendingError.message || "Unable to load pending requests"));
                    }

                    pool.query(activeSql,[workerId],(activeError, activeData) => {

                        if (activeError) {
                            console.error("WORKER DASHBOARD ACTIVE ERROR:",activeError);
                            return res.send(
                                result.createResult(activeError.sqlMessage || activeError.message || "Unable to load active jobs"));
                        }

                        pool.query(activitySql,[workerId],(activityError, activityData) => {

                            if (activityError) {
                                console.error("WORKER DASHBOARD ACTIVITY ERROR:",activityError);
                                return res.send(result.createResult(activityError.sqlMessage || activityError.message || "Unable to load recent activities"));
                            }


                            const worker = workerData[0];

                            const dashboardData = {
                                worker: {
                                    userId:worker.user_id,
                                    fullName:worker.full_name,
                                    email:worker.email,
                                    phone:worker.phone,
                                    bio:worker.professional_summary,
                                    city:worker.primary_city,
                                    experienceYears:worker.experience_years,
                                    available:Boolean(worker.is_available),
                                    approvalStatus:worker.approval_status,
                                    latitude:worker.latitude !== null ? Number(worker.latitude) : null,
                                    longitude:worker.longitude !== null ? Number(worker.longitude) : null,
                                    locationAccuracy:worker.location_accuracy !== null ? Number(worker.location_accuracy) : null,
                                    locationUpdatedAt:worker.location_updated_at
                                },
                                stats: {
                                    totalCategories:Number(categoryData[0]?.totalCategories || 0),
                                    completedJobs:Number(completedData[0]?.completedJobs || 0),
                                    averageRating:Number(worker.avg_rating || 0),
                                    pendingRequests:Number(pendingData[0]?.pendingRequests || 0),
                                    activeJobs:Number(activeData[0] ?.activeJobs || 0)
                                },
                                recentActivities:activityData || []

                            };

                            return res.send(result.createResult(null,dashboardData));
                        });
                    });
                });
            });
        });
    });
});

router.get("/profile",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;

    const sql = `SELECT u.user_id,u.full_name,u.email,u.phone,u.profile_photo,wp.experience_years,wp.professional_summary,wp.primary_city,wp.primary_area,wp.is_available,
    wp.latitude,wp.longitude,wp.location_accuracy,wp.location_updated_at,wp.avg_rating,wp.total_jobs_completed FROM users u
    INNER JOIN worker_profiles wp ON u.user_id = wp.worker_id WHERE u.user_id = ?`;

    pool.query(sql,[workerId],(error, rows) => {

        if (error) {
            console.error("WORKER PROFILE ERROR:",error);
            return res.send(result.createResult(error.sqlMessage || error.message || "Unable to load worker profile"));
        }

        if (rows.length === 0) {
            return res.send(result.createResult("Worker profile not found"));
        }

        const worker = rows[0];

        worker.is_available = Boolean(worker.is_available);

        if (worker.latitude !== null) {
            worker.latitude = Number(worker.latitude);
        }

        if (worker.longitude !== null) {
            worker.longitude = Number(worker.longitude);
        }

        if (worker.location_accuracy !== null) {
            worker.location_accuracy = Number(worker.location_accuracy);
        }
        
        return res.send(result.createResult(null,worker));
    });
});

router.put("/profile",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const {fullName,phone,professionalSummary,experienceYears,primaryCity,primaryArea} = req.body;
    
    const userSql = `UPDATE users SET full_name = ?,phone = ? WHERE user_id = ?`;

    pool.query(userSql,[fullName,phone,workerId],(userError) => {

        if (userError) {
            console.error("UPDATE WORKER USER ERROR:",userError);
            return res.send(result.createResult(userError.sqlMessage || userError.message));
        }

        const profileSql = `UPDATE worker_profiles SET professional_summary = ?,experience_years = ?,primary_city = ?,primary_area = ? WHERE worker_id = ?`;


        pool.query(profileSql,[professionalSummary,experienceYears,primaryCity,primaryArea,workerId],(profileError) => {

            if (profileError) {
                console.error("UPDATE WORKER PROFILE ERROR:",profileError);
                return res.send(result.createResult(profileError.sqlMessage || profileError.message));
            }

            return res.send(result.createResult(null,"Profile Updated Successfully"));
        });
    });
});

router.get("/categories",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;

    const sql = `SELECT sc.category_id,sc.category_name FROM worker_categories wc
    INNER JOIN service_categories sc ON wc.category_id = sc.category_id WHERE wc.worker_id = ? ORDER BY sc.category_name`;

    pool.query(sql,[workerId],(err, data) => {

        if (err) {
            console.error("GET WORKER CATEGORIES ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message));
        }

        return res.send(result.createResult(null,data));
    });
});

router.get("/availability",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;

    const sql = `SELECT is_available,latitude,longitude,location_accuracy,location_updated_at FROM worker_profiles WHERE worker_id = ?`;

    pool.query(sql,[workerId],(err, rows) => {

        if (err) {
            console.error("GET AVAILABILITY ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message));
        }
        if (rows.length === 0) {
            return res.send(result.createResult("Worker not found"));
        }

        const data = rows[0];
        data.is_available = Boolean(data.is_available);

        if (data.latitude !== null) {
            data.latitude = Number(data.latitude);
        }
        if (data.longitude !== null) {
            data.longitude = Number(data.longitude);
        }
        if (data.location_accuracy !== null) {
            data.location_accuracy = Number(data.location_accuracy);
        }

        return res.send(result.createResult(null,data));
    });
});

router.put("/availability",authUser,checkWorkerAuthorization,(req, res) => {
    const workerId = req.headers.payload.userId;
    const {isAvailable} = req.body;

    if (typeof isAvailable !== "boolean") {
        return res.send(result.createResult("isAvailable must be true or false"));
    }
    if (isAvailable) {
        const sql = `UPDATE worker_profiles SET is_available = 1 WHERE worker_id = ?`;
        
        pool.query(sql,[workerId],(err, dbResult) => {

            if (err) {
                console.error("UPDATE AVAILABILITY ERROR:",err);
                return res.send(result.createResult(err.sqlMessage || err.message || "Unable to update availability"));
            }
            if (dbResult.affectedRows === 0) {
                return res.send(result.createResult("Worker profile not found"));
            }

            return res.send(result.createResult(null,{
                isAvailable: true,
                message:"Worker is now available. Please allow location access."
            }));
        });
    }
    else {
        const sql = `UPDATE worker_profiles SET is_available = 0,latitude = NULL,longitude = NULL,location_accuracy = NULL,location_updated_at = NULL WHERE worker_id = ?`;

        pool.query(sql,[workerId],(err, dbResult) => {
            if (err) {
                console.error("UPDATE AVAILABILITY ERROR:",err);
                return res.send(result.createResult(err.sqlMessage || err.message || "Unable to update availability"));
            }
            if (dbResult.affectedRows === 0) {
                return res.send(result.createResult("Worker profile not found"));
            }
            return res.send(result.createResult(null,{
                isAvailable: false,
                message:"Worker is now unavailable."
            }));
        });
    }
});

router.get("/availability/schedule",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;

    const sql = `SELECT availability_id,day_of_week,start_time,end_time,is_active FROM worker_availability
    WHERE worker_id = ? ORDER BY FIELD(day_of_week,'MON','TUE','WED','THU','FRI','SAT','SUN')`;

    pool.query(sql,[workerId],(err, rows) => {

        if (err) {
            return res.send(result.createResult(err.sqlMessage || err.message));
        }

        return res.send(result.createResult(null,rows));
    });
});

router.put("/service-requests/:requestId/accept",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;

    const sql = `UPDATE service_requests SET status = 'ACCEPTED' WHERE request_id = ? AND assigned_worker_id = ? AND status = 'ASSIGNED'`;

    pool.query(sql,[requestId,workerId],(err, data) => {

        if (err) {
            console.error("ACCEPT REQUEST ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to accept request"));
        }

        if (data.affectedRows === 0) {
            return res.send(result.createResult("Request cannot be accepted"));
        }

        return res.send(result.createResult(null,"Request Accepted Successfully"));
    });
});

router.put("/service-requests/:requestId/start",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;

    const sql = `UPDATE service_requests SET status = 'IN_PROGRESS' WHERE request_id = ? AND assigned_worker_id = ? AND status = 'ACCEPTED'`;

    pool.query(sql,[requestId,workerId],(err, data) => {

        if (err) {
            console.error("START SERVICE ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to start service"));
        }

        if (data.affectedRows === 0) {
            return res.send(result.createResult("Request cannot be started. Request must be accepted first."));
        }
        
        return res.send(result.createResult(null,"Service Started Successfully"));
    });
});

router.post("/service-requests/:requestId/location",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;

    const {latitude,longitude,accuracy} = req.body;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return res.send(result.createResult("Latitude and longitude are required"));
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const acc = accuracy !== undefined && accuracy !== null ? Number(accuracy) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.send(result.createResult("Invalid latitude or longitude"));
    }

    const verifySql = `SELECT request_id,status,address_id FROM service_requests WHERE request_id = ? AND assigned_worker_id = ?`;

    pool.query(verifySql,[requestId,workerId],(verifyError, verifyData) => {

        if (verifyError) {
            console.error("VERIFY LOCATION ERROR:",verifyError);
            return res.send(result.createResult(verifyError.sqlMessage || verifyError.message || "Unable to verify service request"));
        }

        if (verifyData.length === 0) {
            return res.send(result.createResult("Service request not found"));
        }

        if (verifyData[0].status !== "IN_PROGRESS") {
            return res.send(result.createResult("Location tracking is not active"));
        }

        const updateSql = `UPDATE worker_profiles SET latitude = ?,longitude = ?,location_accuracy = ?,location_updated_at = CURRENT_TIMESTAMP WHERE worker_id = ?`;

        pool.query(updateSql,[lat,lng,acc,workerId],(updateError) => {

            if (updateError) {
                console.error("WORKER LOCATION UPDATE ERROR:",updateError);
                return res.send(result.createResult(updateError.sqlMessage || updateError.message || "Unable to update worker location"));
            }
            
            return res.send(result.createResult(null,
                {
                    requestId:Number(requestId),
                    latitude:lat,
                    longitude:lng,
                    accuracy:acc,
                    message:"Worker location updated successfully"
                }
            ));
        });
    });
});

router.put("/service-requests/:requestId/arrived",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;
    
    const sql = `UPDATE service_requests SET status = 'ARRIVED' WHERE request_id = ? AND assigned_worker_id = ? AND status = 'IN_PROGRESS'`;

    pool.query(sql,[requestId,workerId],(err, data) => {

        if (err) {
            console.error("ARRIVED SERVICE ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to update arrival status"));
        }

        if (data.affectedRows === 0) {
            return res.send(result.createResult("Request cannot be marked as arrived"));
        }

        return res.send(result.createResult(null,
            {
                requestId:Number(requestId),
                status:"ARRIVED",
                trackingActive:false,
                message:"Worker reached destination. Live tracking stopped."
            }
        ));
    });
});

router.get("/requests",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    console.log("LOADING WORKER REQUESTS FOR:",workerId);

    const sql = `SELECT sr.request_id,sr.request_code,sr.user_id,sr.service_id,sr.category_id,sr.address_id,sr.assigned_worker_id,sr.description,sr.status,sr.estimated_price,
    sr.final_price,sr.created_at,sr.updated_at,s.service_name,s.price_unit,u.full_name AS customer_name,u.phone AS customer_phone,a.label AS address_label,a.address_line1,
    a.address_line2,a.city,a.area,a.pincode,a.landmark,a.latitude AS destination_latitude,a.longitude AS destination_longitude,wp.latitude AS worker_latitude,wp.longitude AS worker_longitude,
    wp.location_accuracy AS worker_accuracy,wp.location_updated_at AS worker_location_updated_at,wp.is_available AS worker_available FROM service_requests sr
    INNER JOIN services s ON s.service_id = sr.service_id
    INNER JOIN users u ON u.user_id = sr.user_id
    INNER JOIN addresses a ON a.address_id = sr.address_id
    LEFT JOIN worker_profiles wp ON wp.worker_id = sr.assigned_worker_id
    WHERE sr.assigned_worker_id = ? ORDER BY sr.created_at DESC
    `;


    pool.query(sql,[workerId],(err, data) => {

        if (err) {
            console.error("WORKER REQUESTS SQL ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to load worker requests"));
        }


        const requests = data.map(request => {

            return {
                 ...request,
                 request_id:Number(request.request_id),
                user_id:Number(request.user_id),
                service_id:Number(request.service_id),
                category_id:Number(request.category_id),
                address_id:Number(request.address_id),
                assigned_worker_id:Number(request.assigned_worker_id),
                estimated_price:request.estimated_price !== null ? Number(request.estimated_price) : null,
                final_price:request.final_price !== null ? Number(request.final_price) : null,
                worker_latitude:request.worker_latitude !== null ? Number(request.worker_latitude) : null,
                worker_longitude:request.worker_longitude !== null ? Number(request.worker_longitude) : null,
                worker_accuracy:request.worker_accuracy !== null ? Number(request.worker_accuracy) : null,
                destination_latitude:request.destination_latitude !== null ? Number(request.destination_latitude) : null,
                destination_longitude:request.destination_longitude !== null ? Number(request.destination_longitude) : null,
                worker_available:Boolean(request.worker_available)
            };
        });
        
        return res.send(result.createResult(null,requests));
    });
});

router.put("/service-requests/:requestId/complete",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;

    const sql = `UPDATE service_requests SET status = 'COMPLETED' WHERE request_id = ? AND assigned_worker_id = ? AND status = 'ARRIVED'`;

    pool.query(sql,[requestId,workerId],(err, dbResult) => {

        if (err) {
            console.error("COMPLETE SERVICE SQL ERROR:",err);
            return res.send(result.createResult(err.sqlMessage || err.message || "Unable to complete service"));
        }

        if (dbResult.affectedRows === 0) {
            console.log("SERVICE NOT COMPLETED - INVALID STATE");
            return res.send(result.createResult("Service cannot be completed. Request must be ARRIVED and assigned to you."));
        }

        return res.send(result.createResult(null,
            {
                request_id:Number(requestId),
                status:"COMPLETED"
            }
        ));
    });
});

router.post("/current-location",authUser,checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const {latitude,longitude,accuracy} = req.body;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        return res.send(result.createResult("Latitude and longitude are required"));
    }
    
    const lat = Number(latitude);
    const lng = Number(longitude);
    const acc = accuracy !== undefined && accuracy !== null ? Number(accuracy) : null;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.send(result.createResult("Invalid latitude or longitude"));
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.send(result.createResult("Invalid GPS coordinates"));
    }

    const checkSql = `SELECT worker_id,is_available FROM worker_profiles WHERE worker_id = ?`;

    pool.query(checkSql,[workerId],(checkError, workerData) => {

        if (checkError) {
            console.error("CURRENT LOCATION CHECK ERROR:",checkError);
            return res.send(result.createResult(checkError.sqlMessage || checkError.message || "Unable to verify worker"));
        }
        
        if (workerData.length === 0) {
            return res.send(result.createResult("Worker profile not found"));
        }

        if (!workerData[0].is_available) {
            return res.send(result.createResult("Worker is currently unavailable"));
        }

        const updateSql = `UPDATE worker_profiles SET latitude = ?,longitude = ?,location_accuracy = ?,location_updated_at = CURRENT_TIMESTAMP WHERE worker_id = ?`;

        pool.query(updateSql,[lat,lng,acc,workerId],(updateError) => {

            if (updateError) {
                console.error("CURRENT LOCATION UPDATE ERROR:",updateError);
                return res.send(result.createResult(updateError.sqlMessage || updateError.message || "Unable to update current location"));
            }

            return res.send(result.createResult(null,
                {
                    workerId:Number(workerId),
                    latitude:lat,
                    longitude:lng,
                    accuracy:acc,
                    locationUpdatedAt:new Date(),
                    message:"Current location updated successfully"
                }
            ));
        });
    });
});

router.delete("/current-location",checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;

    const sql = ` UPDATE worker_profiles SET latitude = NULL,longitude = NULL,location_accuracy = NULL,location_updated_at = NULL WHERE worker_id = ?`;

    pool.query(sql,[workerId],(err, data) => {

        if (err) {
            console.error("CLEAR WORKER LOCATION ERROR:",err);
            return res.send(result.createResult(err));
        }

        return res.send(result.createResult(null,
            {
                message:"Worker current location cleared"
            }
        ));
    });
});

// ==========================================================
// WORKER REJECT SERVICE REQUEST
// PUT /service-requests/:requestId/reject
// ==========================================================

router.put("/service-requests/:requestId/reject",checkWorkerAuthorization,(req, res) => {

    const workerId = req.headers.payload.userId;
    const requestId = req.params.requestId;
    const { reason } = req.body;

    const getRequestSql = `SELECT request_id,user_id,category_id,service_id,address_id,assigned_worker_id,status FROM service_requests
    WHERE request_id = ? AND assigned_worker_id = ?`;

    pool.query(getRequestSql,[requestId, workerId],(requestError, requestData) => {

        if (requestError) {
            console.error("GET REQUEST ERROR:", requestError);
            return res.send(result.createResult(requestError.sqlMessage || requestError.message || "Unable to find service request"));
        }
        if (!requestData || requestData.length === 0) {
            return res.send(result.createResult("Service request is not assigned to you"));
        }

        const request = requestData[0];
       
        if (request.status !== "ASSIGNED") {
            return res.send(result.createResult("This request cannot be rejected in its current status"));
        }


        const rejectionSql = `INSERT INTO service_request_worker_rejections (request_id,worker_id,reason) VALUES (?, ?, ?)`;

        pool.query(rejectionSql,[requestId,workerId,reason || "Rejected by worker"],(rejectionError) => {

            if (rejectionError) {

                if (rejectionError.code === "ER_DUP_ENTRY") {
                    return res.send(result.createResult("You have already rejected this request"));
                }
                console.error("REJECTION INSERT ERROR:",rejectionError);
                return res.send(result.createResult(rejectionError.sqlMessage || rejectionError.message || "Unable to save rejection"));
            }

            const releaseWorkerSql = `UPDATE worker_profiles SET is_available = 1 WHERE worker_id = ?`;

            pool.query(releaseWorkerSql,[workerId],(releaseError) => {

                if (releaseError) {
                    console.error("RELEASE WORKER ERROR:",releaseError);
                    return res.send(result.createResult(releaseError.sqlMessage || releaseError.message || "Unable to release worker"));
                }

                 findNextWorker();
            });
        });


        function findNextWorker() {
            
            const addressSql = `SELECT latitude,longitude FROM addresses WHERE address_id = ? AND user_id = ?`;

            pool.query(addressSql,[request.address_id,request.user_id],(addressError, addressData) => {

                if (addressError) {
                    console.error("ADDRESS ERROR:",addressError);
                    return res.send(result.createResult(addressError.sqlMessage || addressError.message || "Unable to load service address"));
                }
                if (!addressData || addressData.length === 0) {
                    return res.send(result.createResult("Service address not found"));
                }

                const userLatitude = Number(addressData[0].latitude);
                const userLongitude = Number(addressData[0].longitude);

                if (!Number.isFinite(userLatitude) || !Number.isFinite(userLongitude)) {
                     return res.send(result.createResult("Service address does not have valid GPS coordinates"));
                }

                const MAX_WORKER_DISTANCE_KM = 5;

                const workerSql = `SELECT wp.worker_id,u.full_name,u.phone,wp.avg_rating,wp.total_jobs_completed,wp.latitude AS worker_latitude,wp.longitude AS worker_longitude,wp.location_accuracy,wp.location_updated_at,
                (6371 * ACOS(LEAST(1,GREATEST(-1,COS(RADIANS(?)) * COS(RADIANS(wp.latitude)) * COS(RADIANS(wp.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(wp.latitude)))))) AS distance_km
                FROM worker_profiles wp INNER JOIN users u ON u.user_id = wp.worker_id INNER JOIN worker_categories wc ON wc.worker_id = wp.worker_id WHERE wc.category_id = ?
                AND wp.approval_status = 'APPROVED' AND wp.is_available = 1 AND u.is_active = 1 AND u.is_blocked = 0 AND wp.latitude IS NOT NULL AND wp.longitude IS NOT NULL
                AND NOT EXISTS (SELECT 1 FROM service_request_worker_rejections r WHERE r.request_id = ? AND r.worker_id = wp.worker_id)               
                AND NOT EXISTS (SELECT 1 FROM service_requests sr WHERE sr.assigned_worker_id = wp.worker_id AND sr.status IN ('ASSIGNED','ACCEPTED','ARRIVED','IN_PROGRESS') AND sr.request_id <> ?)
                HAVING distance_km <= ? ORDER BY distance_km ASC,wp.avg_rating DESC,wp.total_jobs_completed DESC,wp.worker_id ASC LIMIT 1`;

                pool.query(workerSql,[userLatitude,userLongitude,userLatitude,request.category_id,requestId,requestId,MAX_WORKER_DISTANCE_KM],(workerError, workerData) => {

                    if (workerError) {
                        console.error("NEXT WORKER SEARCH ERROR:",workerError);
                        return res.send(result.createResult(workerError.sqlMessage || workerError.message || "Unable to find next worker"));
                    }
                    
                    if (!workerData || workerData.length === 0) {

                        const pendingSql = `UPDATE service_requests SET assigned_worker_id = NULL,status = 'PENDING',updated_at = CURRENT_TIMESTAMP WHERE request_id = ? AND assigned_worker_id = ? AND status = 'ASSIGNED'`;

                        pool.query(pendingSql,[requestId,workerId],(pendingError) => {
                            if (pendingError) {
                                console.error("SET PENDING ERROR:",pendingError);
                                return res.send(result.createResult(pendingError.sqlMessage || pendingError.message || "Unable to update service request"));
                            }

                            return res.send(result.createResult(null,{
                                requestId: Number(requestId),
                                status: "PENDING",
                                message: "Worker rejected the request. No other nearby worker is currently available.",
                                workerAssigned: false,
                                worker: null
                            }));
                        });
                        return;
                    }

                    const nextWorker = workerData[0];

                    const assignSql = `UPDATE service_requests SET assigned_worker_id = ?,status = 'ASSIGNED',updated_at = CURRENT_TIMESTAMP WHERE request_id = ? AND assigned_worker_id = ? AND status = 'ASSIGNED'`;

                    pool.query(assignSql,[nextWorker.worker_id,requestId,workerId],(assignError, assignData) => {

                        if (assignError) {
                            console.error("NEXT WORKER ASSIGN ERROR:",assignError);
                            return res.send(result.createResult(assignError.sqlMessage || assignError.message || "Unable to assign next worker"));
                        }
                        if (assignData.affectedRows === 0) {
                            return res.send(result.createResult("Service request was already updated"));
                        }

                        const makeUnavailableSql = `UPDATE worker_profiles SET is_available = 0 WHERE worker_id = ? `;

                        pool.query(makeUnavailableSql,[nextWorker.worker_id],(availabilityError) => {

                            if (availabilityError) {
                                console.error("NEXT WORKER AVAILABILITY ERROR:",availabilityError);
                            }

                            return res.send(result.createResult(null,{
                                requestId: Number(requestId),
                                status: "ASSIGNED",
                                message: "Request rejected successfully and assigned to the next nearby worker",
                                workerAssigned: true,
                                worker:{
                                    workerId: nextWorker.worker_id,
                                    name: nextWorker.full_name,
                                    phone: nextWorker.phone,
                                    rating: Number(nextWorker.avg_rating),
                                    distanceKm: Number(nextWorker.distance_km),
                                    latitude: Number(nextWorker.worker_latitude),
                                    longitude: Number(nextWorker.worker_longitude)
                                }
                            }));
                        });
                    });
                });
            });
        }
    });
});

module.exports = router;