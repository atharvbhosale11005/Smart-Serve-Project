const express = require("express");
const router = express.Router();
const pool = require("../Db/pool");
const result = require("../utils/result");
const {authUser,checkUserAuthorization,checkWorkerAuthorization} = require("../utils/auth");

router.post("/",authUser,checkUserAuthorization,(req, res) => {

    const userId = req.headers.payload.userId;
    const {requestId,rating,comment} = req.body;
    console.log("SUBMIT FEEDBACK:",{userId,requestId,rating});

    if (!requestId) {
        return res.send(result.createResult("Request ID is required"));
    }
    
    const numericRating = Number(rating);
    
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.send(result.createResult("Rating must be an integer between 1 and 5"));
    }

    const verifySql = `SELECT sr.request_id,sr.user_id,sr.assigned_worker_id,sr.status,sr.request_code,s.service_name FROM service_requests sr
    INNER JOIN services s ON s.service_id = sr.service_id WHERE sr.request_id = ? AND sr.user_id = ?`;


    pool.query(verifySql,[requestId,userId],(verifyError, requests) => {

        if (verifyError) {
            console.error("VERIFY FEEDBACK ERROR:",verifyError);
            return res.send(result.createResult(verifyError.sqlMessage || verifyError.message));
        }

        if (requests.length === 0) {
            return res.send(result.createResult("Service request not found"));
        }
        
        const request = requests[0];

        if (request.status !== "COMPLETED") {
            return res.send(result.createResult("Feedback can be submitted only after the service is completed"));
        }

        if (!request.assigned_worker_id) {
            return res.send(result.createResult("No worker is assigned to this request"));
        }
        
        const workerId = request.assigned_worker_id;
        
        const existingSql = `SELECT feedback_id FROM feedback WHERE request_id = ? AND user_id = ? `;

            pool.query(existingSql,[requestId,userId],(existingError,existingFeedback) => {

                if (existingError) {
                    console.error("CHECK FEEDBACK ERROR:",existingError);
                    return res.send(result.createResult(existingError.sqlMessage || existingError.message));
                }
                if (existingFeedback.length > 0) {
                    return res.send(result.createResult("You have already submitted feedback for this service"));
                }

                const insertSql = `INSERT INTO feedback (request_id,user_id,worker_id,rating,comment) VALUES (?, ?, ?, ?, ?)`;
                
                pool.query(insertSql,[requestId,userId,workerId,numericRating,comment ? String(comment).trim() : null],(insertError,insertResult) => {

                    if (insertError) {
                        console.error("INSERT FEEDBACK ERROR:",insertError);
                        // Duplicate request_id
                        if (insertError.code === "ER_DUP_ENTRY") {
                            return res.send(result.createResult("Feedback already submitted for this service"));
                        }  
                        return res.send(result.createResult(insertError.sqlMessage || insertError.message));
                    }

                    const ratingSql = `SELECT AVG(rating) AS average_rating,COUNT(*) AS total_reviews FROM feedback WHERE worker_id = ?`;


                    pool.query(ratingSql,[workerId],(ratingError,ratingData) => {

                        if (ratingError) {
                            console.error("CALCULATE RATING ERROR:",ratingError);
                            return res.send(result.createResult(null,{
                                feedback_id: insertResult.insertId,
                                message: "Feedback submitted successfully, but worker rating could not be updated immediately"
                            }));
                        }

                        const averageRating = Number(ratingData[0].average_rating || 0);
                        
                        const totalReviews = Number(ratingData[0].total_reviews || 0);

                        const updateWorkerSql = `UPDATE worker_profiles SET avg_rating = ? WHERE worker_id = ?`;


                            pool.query(updateWorkerSql,[averageRating.toFixed(2),workerId],(updateError) => {

                                if (updateError) {
                                    console.error("UPDATE WORKER RATING ERROR:",updateError);

                                    return res.send(result.createResult(null,{
                                        feedback_id:insertResult.insertId,
                                        message:"Feedback submitted successfully",
                                        average_rating:averageRating,
                                        total_reviews:totalReviews
                                    }));
                                }

                                return res.send(result.createResult(null,{
                                    feedback_id:insertResult.insertId,
                                    request_id:Number(requestId),
                                    worker_id:workerId,
                                    rating:numericRating,
                                    comment: comment ? String(comment).trim() : null,
                                    average_rating:averageRating,
                                    total_reviews:totalReviews,
                                    message:"Feedback submitted successfully"
                                }));
                    });
                });
            });
        });
    });
});


router.get(
    "/user",
    authUser,
    checkUserAuthorization,
    (req, res) => {

        const userId =
            req.headers.payload.userId;


        const sql = `

            SELECT

                f.feedback_id,
                f.request_id,
                f.worker_id,
                f.rating,
                f.comment,
                f.created_at,

                sr.request_code,

                s.service_name,

                u.full_name
                    AS worker_name,

                u.phone
                    AS worker_phone

            FROM feedback f

            INNER JOIN service_requests sr
                ON sr.request_id =
                   f.request_id

            INNER JOIN services s
                ON s.service_id =
                   sr.service_id

            INNER JOIN users u
                ON u.user_id =
                   f.worker_id

            WHERE f.user_id = ?

            ORDER BY
                f.created_at DESC

        `;


        pool.query(
            sql,
            [userId],
            (err, data) => {

                if (err) {

                    console.error(
                        "GET USER FEEDBACK ERROR:",
                        err
                    );

                    return res.send(
                        result.createResult(
                            err.sqlMessage ||
                            err.message
                        )
                    );
                }


                return res.send(
                    result.createResult(
                        null,
                        data
                    )
                );

            }
        );
    }
);


// =========================================================
// GET FEEDBACK FOR ONE REQUEST
//
// GET /feedback/user/request/:requestId
//
// USER ONLY
//
// Useful for deciding whether to show
// "Give Feedback" or "Feedback Submitted"
//
// =========================================================

router.get(
    "/user/request/:requestId",
    authUser,
    checkUserAuthorization,
    (req, res) => {

        const userId =
            req.headers.payload.userId;

        const {
            requestId
        } = req.params;


        const sql = `

            SELECT

                f.feedback_id,
                f.request_id,
                f.worker_id,
                f.rating,
                f.comment,
                f.created_at,

                u.full_name
                    AS worker_name

            FROM feedback f

            INNER JOIN users u
                ON u.user_id =
                   f.worker_id

            WHERE f.request_id = ?
              AND f.user_id = ?

        `;


        pool.query(
            sql,
            [
                requestId,
                userId
            ],
            (err, data) => {

                if (err) {

                    console.error(
                        "GET REQUEST FEEDBACK ERROR:",
                        err
                    );

                    return res.send(
                        result.createResult(
                            err.sqlMessage ||
                            err.message
                        )
                    );
                }


                return res.send(
                    result.createResult(
                        null,
                        data.length > 0
                            ? data[0]
                            : null
                    )
                );

            }
        );
    }
);


// =========================================================
// GET WORKER FEEDBACK
//
// GET /feedback/worker
//
// WORKER ONLY
//
// Worker can see:
// - Customer name
// - Service
// - Request code
// - Rating
// - Comment
// - Date
//
// =========================================================

router.get(
    "/worker",
    authUser,
    checkWorkerAuthorization,
    (req, res) => {

        const workerId =
            req.headers.payload.userId;


        const sql = `

            SELECT

                f.feedback_id,
                f.request_id,
                f.user_id,
                f.rating,
                f.comment,
                f.created_at,

                sr.request_code,

                s.service_name,

                u.full_name
                    AS customer_name

            FROM feedback f

            INNER JOIN service_requests sr
                ON sr.request_id =
                   f.request_id

            INNER JOIN services s
                ON s.service_id =
                   sr.service_id

            INNER JOIN users u
                ON u.user_id =
                   f.user_id

            WHERE f.worker_id = ?

            ORDER BY
                f.created_at DESC

        `;


        pool.query(
            sql,
            [workerId],
            (err, data) => {

                if (err) {

                    console.error(
                        "GET WORKER FEEDBACK ERROR:",
                        err
                    );

                    return res.send(
                        result.createResult(
                            err.sqlMessage ||
                            err.message
                        )
                    );
                }


                return res.send(
                    result.createResult(
                        null,
                        data
                    )
                );

            }
        );
    }
);


// =========================================================
// GET WORKER FEEDBACK SUMMARY
//
// GET /feedback/worker/summary
//
// WORKER ONLY
//
// =========================================================

router.get(
    "/worker/summary",
    authUser,
    checkWorkerAuthorization,
    (req, res) => {

        const workerId =
            req.headers.payload.userId;


        const sql = `

            SELECT

                COUNT(*) AS total_reviews,

                ROUND(
                    AVG(rating),
                    2
                ) AS average_rating,

                SUM(
                    CASE
                        WHEN rating = 5
                        THEN 1
                        ELSE 0
                    END
                ) AS five_star,

                SUM(
                    CASE
                        WHEN rating = 4
                        THEN 1
                        ELSE 0
                    END
                ) AS four_star,

                SUM(
                    CASE
                        WHEN rating = 3
                        THEN 1
                        ELSE 0
                    END
                ) AS three_star,

                SUM(
                    CASE
                        WHEN rating = 2
                        THEN 1
                        ELSE 0
                    END
                ) AS two_star,

                SUM(
                    CASE
                        WHEN rating = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS one_star

            FROM feedback

            WHERE worker_id = ?

        `;


        pool.query(
            sql,
            [workerId],
            (err, data) => {

                if (err) {

                    console.error(
                        "GET WORKER FEEDBACK SUMMARY ERROR:",
                        err
                    );

                    return res.send(
                        result.createResult(
                            err.sqlMessage ||
                            err.message
                        )
                    );
                }


                const summary =
                    data[0] || {};


                return res.send(
                    result.createResult(
                        null,
                        {
                            totalReviews:
                                Number(
                                    summary.total_reviews ||
                                    0
                                ),

                            averageRating:
                                Number(
                                    summary.average_rating ||
                                    0
                                ),

                            fiveStar:
                                Number(
                                    summary.five_star ||
                                    0
                                ),

                            fourStar:
                                Number(
                                    summary.four_star ||
                                    0
                                ),

                            threeStar:
                                Number(
                                    summary.three_star ||
                                    0
                                ),

                            twoStar:
                                Number(
                                    summary.two_star ||
                                    0
                                ),

                            oneStar:
                                Number(
                                    summary.one_star ||
                                    0
                                )
                        }
                    )
                );

            }
        );
    }
);


module.exports = router;