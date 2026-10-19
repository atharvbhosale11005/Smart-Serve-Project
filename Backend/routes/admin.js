
const express = require("express");
const router = express.Router();
const pool = require("../Db/pool");
const result = require("../utils/result");
const cryptojs = require("crypto-js");
const { authUser, checkAdminAuthorization } = require("../utils/auth");

// Protect every route in this router.
router.use(authUser);
router.use(checkAdminAuthorization);

/* =====================================================
   SHARED VALIDATION / RESPONSE HELPERS
===================================================== */

const isValidId = (value) =>
    /^\d+$/.test(String(value ?? "")) && Number(value) > 0;

const isBooleanValue = (value) =>
    typeof value === "boolean" || value === 0 || value === 1;

const booleanToInt = (value) => value === true || value === 1 ? 1 : 0;

const sendDbError = (res, label, error) => {
    console.error(`${label}:`, error);
    return res.send(
        result.createResult(
            error.sqlMessage || error.message || "Database operation failed"
        )
    );
};

const isValidText = (value) =>
    typeof value === "string" && value.trim().length > 0;

const getAdminId = (req) => req.user?.userId || req.headers.payload?.userId;

/* =====================================================
   1. ADMIN DASHBOARD
===================================================== */

router.get("/dashboard", (req, res) => {
    const statsSql = `
        SELECT
            (SELECT COUNT(*)
             FROM users u
             INNER JOIN roles r ON r.role_id = u.role_id
             WHERE r.role_name = 'USER') AS totalUsers,

            (SELECT COUNT(*)
             FROM users u
             INNER JOIN roles r ON r.role_id = u.role_id
             WHERE r.role_name = 'WORKER') AS totalWorkers,

            (SELECT COUNT(*)
             FROM worker_profiles
             WHERE approval_status = 'PENDING') AS pendingApprovals,

            (SELECT COUNT(*)
             FROM worker_profiles wp
             INNER JOIN users u ON u.user_id = wp.worker_id
             WHERE wp.is_available = 1
               AND wp.approval_status = 'APPROVED'
               AND u.is_active = 1
               AND u.is_blocked = 0) AS availableWorkers,

            (SELECT COUNT(*) FROM services WHERE is_active = 1)
                AS activeServices,

            (SELECT COUNT(*) FROM service_categories WHERE is_active = 1)
                AS activeCategories,

            (SELECT COUNT(*) FROM service_requests) AS totalRequests,

            (SELECT COUNT(*)
             FROM service_requests
             WHERE status IN (
                'PENDING', 'ASSIGNED', 'ACCEPTED',
                'IN_PROGRESS', 'ARRIVED'
             )) AS activeRequests,

            (SELECT COUNT(*) FROM service_requests
             WHERE status = 'COMPLETED') AS completedRequests,

            (SELECT COUNT(*) FROM service_requests
             WHERE status = 'CANCELLED') AS cancelledRequests,

            (SELECT COALESCE(
                SUM(COALESCE(final_price, estimated_price, 0)), 0
             )
             FROM service_requests
             WHERE status = 'COMPLETED') AS totalRevenue
    `;

    pool.query(statsSql, (statsErr, statsData) => {
        if (statsErr) {
            return sendDbError(res, "ADMIN DASHBOARD STATS ERROR", statsErr);
        }

        const activitySql = `
            SELECT
                sr.request_id,
                sr.request_code,
                sr.status,
                sr.estimated_price,
                sr.final_price,
                sr.created_at,
                sr.updated_at,
                s.service_name,
                u.full_name AS customer_name,
                w.full_name AS worker_name
            FROM service_requests sr
            LEFT JOIN services s ON s.service_id = sr.service_id
            LEFT JOIN users u ON u.user_id = sr.user_id
            LEFT JOIN users w ON w.user_id = sr.assigned_worker_id
            ORDER BY COALESCE(sr.updated_at, sr.created_at) DESC
            LIMIT 8
        `;

        pool.query(activitySql, (activityErr, activityData) => {
            if (activityErr) {
                return sendDbError(
                    res,
                    "ADMIN RECENT ACTIVITY ERROR",
                    activityErr
                );
            }

            const stats = statsData[0] || {};

            return res.send(result.createResult(null, {
                totalUsers: Number(stats.totalUsers || 0),
                totalWorkers: Number(stats.totalWorkers || 0),
                pendingApprovals: Number(stats.pendingApprovals || 0),
                availableWorkers: Number(stats.availableWorkers || 0),
                activeServices: Number(stats.activeServices || 0),
                activeCategories: Number(stats.activeCategories || 0),
                totalRequests: Number(stats.totalRequests || 0),
                activeRequests: Number(stats.activeRequests || 0),
                completedRequests: Number(stats.completedRequests || 0),
                cancelledRequests: Number(stats.cancelledRequests || 0),
                totalRevenue: Number(stats.totalRevenue || 0),
                recentActivities: activityData || []
            }));
        });
    });
});

/* =====================================================
   2. MANAGE USERS
===================================================== */

router.get("/users", (req, res) => {
    const sql = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.profile_photo,
            u.is_active,
            u.is_blocked,
            u.created_at,
            (
                SELECT COUNT(*)
                FROM service_requests sr
                WHERE sr.user_id = u.user_id
            ) AS total_requests,
            a.city,
            a.area,
            a.pincode,
            a.address_line1
        FROM users u
        INNER JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN addresses a
            ON a.user_id = u.user_id AND a.is_default = 1
        WHERE r.role_name = 'USER'
        ORDER BY u.created_at DESC
    `;

    pool.query(sql, (err, data) => {
        if (err) return sendDbError(res, "ADMIN GET USERS ERROR", err);

        const formatted = (data || []).map((u) => ({
            ...u,
            user_id: Number(u.user_id),
            is_active: Boolean(u.is_active),
            is_blocked: Boolean(u.is_blocked),
            total_requests: Number(u.total_requests || 0)
        }));

        return res.send(result.createResult(null, formatted));
    });
});

router.put("/users/:userId/status", (req, res) => {
    const { userId } = req.params;
    const { isBlocked, isActive } = req.body;

    if (!isValidId(userId)) {
        return res.send(result.createResult("Invalid user ID"));
    }

    if (
        isBlocked === undefined &&
        isActive === undefined
    ) {
        return res.send(
            result.createResult("Provide isBlocked or isActive")
        );
    }

    if (
        (isBlocked !== undefined && !isBooleanValue(isBlocked)) ||
        (isActive !== undefined && !isBooleanValue(isActive))
    ) {
        return res.send(
            result.createResult("Status values must be boolean or 0/1")
        );
    }

    const updates = [];
    const params = [];

    if (isBlocked !== undefined) {
        updates.push("u.is_blocked = ?");
        params.push(booleanToInt(isBlocked));
    }

    if (isActive !== undefined) {
        updates.push("u.is_active = ?");
        params.push(booleanToInt(isActive));
    }

    params.push(userId);

    const sql = `
        UPDATE users u
        INNER JOIN roles r ON r.role_id = u.role_id
        SET ${updates.join(", ")}
        WHERE u.user_id = ? AND r.role_name = 'USER'
    `;

    pool.query(sql, params, (err, data) => {
        if (err) return sendDbError(res, "UPDATE USER STATUS ERROR", err);

        if (data.affectedRows === 0) {
            return res.send(
                result.createResult("Customer not found or status unchanged")
            );
        }

        return res.send(result.createResult(null, {
            message: "User status updated successfully",
            userId: Number(userId),
            ...(isBlocked !== undefined && {
                isBlocked: Boolean(booleanToInt(isBlocked))
            }),
            ...(isActive !== undefined && {
                isActive: Boolean(booleanToInt(isActive))
            })
        }));
    });
});

/* =====================================================
   3. MANAGE WORKERS AND APPROVALS
===================================================== */

router.get("/workers", (req, res) => {
    const sql = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.profile_photo,
            u.is_active,
            u.is_blocked,
            u.created_at,
            wp.experience_years,
            wp.professional_summary,
            wp.primary_city,
            wp.primary_area,
            wp.is_available,
            wp.approval_status,
            wp.avg_rating,
            wp.total_jobs_completed,
            wp.latitude,
            wp.longitude,
            wp.location_updated_at,
            GROUP_CONCAT(
                DISTINCT sc.category_name
                ORDER BY sc.category_name SEPARATOR ', '
            ) AS categories,
            GROUP_CONCAT(
                DISTINCT sc.category_id
                ORDER BY sc.category_id
            ) AS category_ids
        FROM users u
        INNER JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN worker_profiles wp ON wp.worker_id = u.user_id
        LEFT JOIN worker_categories wc ON wc.worker_id = u.user_id
        LEFT JOIN service_categories sc ON sc.category_id = wc.category_id
        WHERE r.role_name = 'WORKER'
        GROUP BY u.user_id, wp.worker_id
        ORDER BY
            FIELD(wp.approval_status, 'PENDING', 'APPROVED', 'REJECTED'),
            u.created_at DESC
    `;

    pool.query(sql, (err, data) => {
        if (err) return sendDbError(res, "ADMIN GET WORKERS ERROR", err);

        const formatted = (data || []).map((w) => ({
            ...w,
            user_id: Number(w.user_id),
            is_active: Boolean(w.is_active),
            is_blocked: Boolean(w.is_blocked),
            is_available: Boolean(w.is_available),
            avg_rating: Number(w.avg_rating || 0),
            total_jobs_completed: Number(w.total_jobs_completed || 0),
            experience_years:
                w.experience_years !== null
                    ? Number(w.experience_years)
                    : 0,
            latitude: w.latitude !== null ? Number(w.latitude) : null,
            longitude: w.longitude !== null ? Number(w.longitude) : null,
            categories: w.categories ? w.categories.split(", ") : [],
            category_ids: w.category_ids
                ? w.category_ids.split(",").map(Number)
                : []
        }));

        return res.send(result.createResult(null, formatted));
    });
});

router.put("/workers/:workerId/approval", (req, res) => {
    const { workerId } = req.params;
    const { status } = req.body;

    if (!isValidId(workerId)) {
        return res.send(result.createResult("Invalid worker ID"));
    }

    const approvalStatus = String(status || "").toUpperCase();
    const allowed = ["PENDING", "APPROVED", "REJECTED"];

    if (!allowed.includes(approvalStatus)) {
        return res.send(result.createResult(
            "Approval status must be PENDING, APPROVED, or REJECTED"
        ));
    }

    const sql = `
        UPDATE worker_profiles wp
        INNER JOIN users u ON u.user_id = wp.worker_id
        INNER JOIN roles r ON r.role_id = u.role_id
        SET
            wp.approval_status = ?,
            wp.is_available = CASE
                WHEN ? = 'APPROVED' THEN wp.is_available
                ELSE 0
            END
        WHERE wp.worker_id = ? AND r.role_name = 'WORKER'
    `;

    pool.query(
        sql,
        [approvalStatus, approvalStatus, workerId],
        (err, data) => {
            if (err) {
                return sendDbError(res, "UPDATE WORKER APPROVAL ERROR", err);
            }

            if (data.affectedRows === 0) {
                return res.send(
                    result.createResult("Worker profile not found or unchanged")
                );
            }

            return res.send(result.createResult(null, {
                message: `Worker approval status updated to ${approvalStatus}`,
                workerId: Number(workerId),
                approvalStatus
            }));
        }
    );
});

router.put("/workers/:workerId/status", (req, res) => {
    const { workerId } = req.params;
    const { isBlocked, isActive } = req.body;

    if (!isValidId(workerId)) {
        return res.send(result.createResult("Invalid worker ID"));
    }

    if (isBlocked === undefined && isActive === undefined) {
        return res.send(
            result.createResult("Provide isBlocked or isActive")
        );
    }

    if (
        (isBlocked !== undefined && !isBooleanValue(isBlocked)) ||
        (isActive !== undefined && !isBooleanValue(isActive))
    ) {
        return res.send(
            result.createResult("Status values must be boolean or 0/1")
        );
    }

    const updates = [];
    const params = [];

    if (isBlocked !== undefined) {
        updates.push("u.is_blocked = ?");
        params.push(booleanToInt(isBlocked));
    }

    if (isActive !== undefined) {
        updates.push("u.is_active = ?");
        params.push(booleanToInt(isActive));
    }

    // A disabled or blocked worker must not remain available.
    if (
        (isBlocked !== undefined && booleanToInt(isBlocked) === 1) ||
        (isActive !== undefined && booleanToInt(isActive) === 0)
    ) {
        updates.push("wp.is_available = 0");
    }

    params.push(workerId);

    const sql = `
        UPDATE users u
        INNER JOIN roles r ON r.role_id = u.role_id
        LEFT JOIN worker_profiles wp ON wp.worker_id = u.user_id
        SET ${updates.join(", ")}
        WHERE u.user_id = ? AND r.role_name = 'WORKER'
    `;

    pool.query(sql, params, (err, data) => {
        if (err) {
            return sendDbError(res, "UPDATE WORKER USER STATUS ERROR", err);
        }

        if (data.affectedRows === 0) {
            return res.send(
                result.createResult("Worker not found or status unchanged")
            );
        }

        return res.send(result.createResult(null, {
            message: "Worker account status updated successfully",
            workerId: Number(workerId),
            ...(isBlocked !== undefined && {
                isBlocked: Boolean(booleanToInt(isBlocked))
            }),
            ...(isActive !== undefined && {
                isActive: Boolean(booleanToInt(isActive))
            })
        }));
    });
});

/* =====================================================
   4. MANAGE SERVICE CATEGORIES
===================================================== */

router.get("/categories", (req, res) => {
    const sql = `
        SELECT
            sc.category_id,
            sc.category_name,
            sc.description,
            sc.is_active,
            (
                SELECT COUNT(*)
                FROM services s
                WHERE s.category_id = sc.category_id
            ) AS total_services,
            (
                SELECT COUNT(*)
                FROM services s
                WHERE s.category_id = sc.category_id
                  AND s.is_active = 1
            ) AS active_services,
            (
                SELECT COUNT(DISTINCT wc.worker_id)
                FROM worker_categories wc
                WHERE wc.category_id = sc.category_id
            ) AS total_workers
        FROM service_categories sc
        ORDER BY sc.category_name ASC
    `;

    pool.query(sql, (err, data) => {
        if (err) {
            return sendDbError(res, "ADMIN GET CATEGORIES ERROR", err);
        }

        const formatted = (data || []).map((c) => ({
            ...c,
            category_id: Number(c.category_id),
            is_active: Boolean(c.is_active),
            total_services: Number(c.total_services || 0),
            active_services: Number(c.active_services || 0),
            total_workers: Number(c.total_workers || 0)
        }));

        return res.send(result.createResult(null, formatted));
    });
});

router.post("/categories", (req, res) => {
    const { category_name, description } = req.body;

    if (!isValidText(category_name)) {
        return res.send(result.createResult("Category name is required"));
    }

    const name = category_name.trim();

    const checkSql = `
        SELECT category_id
        FROM service_categories
        WHERE LOWER(category_name) = LOWER(?)
        LIMIT 1
    `;

    pool.query(checkSql, [name], (checkErr, checkData) => {
        if (checkErr) {
            return sendDbError(res, "CHECK CATEGORY ERROR", checkErr);
        }

        if (checkData.length > 0) {
            return res.send(result.createResult("Category name already exists"));
        }

        const insertSql = `
            INSERT INTO service_categories
                (category_name, description, is_active)
            VALUES (?, ?, 1)
        `;

        pool.query(
            insertSql,
            [name, description?.trim() || null],
            (insertErr, insertData) => {
                if (insertErr) {
                    return sendDbError(res, "CREATE CATEGORY ERROR", insertErr);
                }

                return res.send(result.createResult(null, {
                    message: "Category created successfully",
                    categoryId: insertData.insertId,
                    categoryName: name
                }));
            }
        );
    });
});

router.put("/categories/:categoryId", (req, res) => {
    const { categoryId } = req.params;
    const { category_name, description, is_active } = req.body;

    if (!isValidId(categoryId)) {
        return res.send(result.createResult("Invalid category ID"));
    }

    const updates = [];
    const params = [];

    if (category_name !== undefined) {
        if (!isValidText(category_name)) {
            return res.send(
                result.createResult("Category name cannot be empty")
            );
        }
        updates.push("category_name = ?");
        params.push(category_name.trim());
    }

    if (description !== undefined) {
        updates.push("description = ?");
        params.push(
            typeof description === "string" && description.trim()
                ? description.trim()
                : null
        );
    }

    if (is_active !== undefined) {
        if (!isBooleanValue(is_active)) {
            return res.send(
                result.createResult("is_active must be boolean or 0/1")
            );
        }
        updates.push("is_active = ?");
        params.push(booleanToInt(is_active));
    }

    if (updates.length === 0) {
        return res.send(
            result.createResult("No category fields provided to update")
        );
    }

    params.push(categoryId);

    const sql = `
        UPDATE service_categories
        SET ${updates.join(", ")}
        WHERE category_id = ?
    `;

    pool.query(sql, params, (err, data) => {
        if (err) return sendDbError(res, "UPDATE CATEGORY ERROR", err);

        if (data.affectedRows === 0) {
            return res.send(
                result.createResult("Category not found or unchanged")
            );
        }

        return res.send(result.createResult(null, {
            message: "Category updated successfully",
            categoryId: Number(categoryId)
        }));
    });
});

router.delete("/categories/:categoryId", (req, res) => {
    const { categoryId } = req.params;

    if (!isValidId(categoryId)) {
        return res.send(result.createResult("Invalid category ID"));
    }

    const sql = `
        UPDATE service_categories
        SET is_active = 0
        WHERE category_id = ? AND is_active = 1
    `;

    pool.query(sql, [categoryId], (err, data) => {
        if (err) return sendDbError(res, "DELETE CATEGORY ERROR", err);

        if (data.affectedRows === 0) {
            return res.send(
                result.createResult("Category not found or already inactive")
            );
        }

        return res.send(result.createResult(null, {
            message: "Category deactivated successfully",
            categoryId: Number(categoryId)
        }));
    });
});

/* =====================================================
   5. MANAGE SERVICES
===================================================== */

router.get("/services", (req, res) => {
    const sql = `
        SELECT
            s.service_id,
            s.category_id,
            s.service_name,
            s.description,
            s.base_price,
            s.price_unit,
            s.is_active,
            sc.category_name,
            (
                SELECT COUNT(*)
                FROM service_requests sr
                WHERE sr.service_id = s.service_id
            ) AS total_bookings,
            (
                SELECT COUNT(*)
                FROM service_requests sr
                WHERE sr.service_id = s.service_id
                  AND sr.status = 'COMPLETED'
            ) AS completed_bookings
        FROM services s
        LEFT JOIN service_categories sc ON sc.category_id = s.category_id
        ORDER BY sc.category_name ASC, s.service_name ASC
    `;

    pool.query(sql, (err, data) => {
        if (err) return sendDbError(res, "ADMIN GET SERVICES ERROR", err);

        const formatted = (data || []).map((s) => ({
            ...s,
            service_id: Number(s.service_id),
            category_id: Number(s.category_id),
            base_price: Number(s.base_price || 0),
            is_active: Boolean(s.is_active),
            total_bookings: Number(s.total_bookings || 0),
            completed_bookings: Number(s.completed_bookings || 0)
        }));

        return res.send(result.createResult(null, formatted));
    });
});

router.post("/services", (req, res) => {
    const {
        category_id,
        service_name,
        description,
        base_price,
        price_unit
    } = req.body;

    if (!isValidId(category_id)) {
        return res.send(result.createResult("Valid category ID is required"));
    }

    if (!isValidText(service_name)) {
        return res.send(result.createResult("Service name is required"));
    }

    if (
        base_price === undefined ||
        base_price === null ||
        base_price === "" ||
        !Number.isFinite(Number(base_price)) ||
        Number(base_price) < 0
    ) {
        return res.send(result.createResult("Valid base price is required"));
    }

    const unit = isValidText(price_unit) ? price_unit.trim() : "per visit";

    const categorySql = `
        SELECT category_id
        FROM service_categories
        WHERE category_id = ? AND is_active = 1
    `;

    pool.query(categorySql, [category_id], (categoryErr, categories) => {
        if (categoryErr) {
            return sendDbError(res, "CHECK SERVICE CATEGORY ERROR", categoryErr);
        }

        if (categories.length === 0) {
            return res.send(
                result.createResult("Active category not found")
            );
        }

        const insertSql = `
            INSERT INTO services
                (category_id, service_name, description, base_price, price_unit, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `;

        pool.query(
            insertSql,
            [
                Number(category_id),
                service_name.trim(),
                isValidText(description) ? description.trim() : null,
                Number(base_price),
                unit
            ],
            (err, data) => {
                if (err) return sendDbError(res, "CREATE SERVICE ERROR", err);

                return res.send(result.createResult(null, {
                    message: "Service created successfully",
                    serviceId: data.insertId,
                    serviceName: service_name.trim()
                }));
            }
        );
    });
});

router.put("/services/:serviceId", (req, res) => {
    const { serviceId } = req.params;
    const {
        category_id,
        service_name,
        description,
        base_price,
        price_unit,
        is_active
    } = req.body;

    if (!isValidId(serviceId)) {
        return res.send(result.createResult("Invalid service ID"));
    }

    const updates = [];
    const params = [];

    if (category_id !== undefined) {
        if (!isValidId(category_id)) {
            return res.send(result.createResult("Invalid category ID"));
        }
        updates.push("category_id = ?");
        params.push(Number(category_id));
    }

    if (service_name !== undefined) {
        if (!isValidText(service_name)) {
            return res.send(
                result.createResult("Service name cannot be empty")
            );
        }
        updates.push("service_name = ?");
        params.push(service_name.trim());
    }

    if (description !== undefined) {
        updates.push("description = ?");
        params.push(isValidText(description) ? description.trim() : null);
    }

    if (base_price !== undefined) {
        if (
            base_price === null ||
            base_price === "" ||
            !Number.isFinite(Number(base_price)) ||
            Number(base_price) < 0
        ) {
            return res.send(result.createResult("Invalid base price"));
        }
        updates.push("base_price = ?");
        params.push(Number(base_price));
    }

    if (price_unit !== undefined) {
        if (!isValidText(price_unit)) {
            return res.send(result.createResult("Price unit cannot be empty"));
        }
        updates.push("price_unit = ?");
        params.push(price_unit.trim());
    }

    if (is_active !== undefined) {
        if (!isBooleanValue(is_active)) {
            return res.send(
                result.createResult("is_active must be boolean or 0/1")
            );
        }
        updates.push("is_active = ?");
        params.push(booleanToInt(is_active));
    }

    if (updates.length === 0) {
        return res.send(
            result.createResult("No service fields provided to update")
        );
    }

    const performUpdate = () => {
        params.push(serviceId);

        const sql = `
            UPDATE services
            SET ${updates.join(", ")}
            WHERE service_id = ?
        `;

        pool.query(sql, params, (err, data) => {
            if (err) return sendDbError(res, "UPDATE SERVICE ERROR", err);

            if (data.affectedRows === 0) {
                return res.send(
                    result.createResult("Service not found or unchanged")
                );
            }

            return res.send(result.createResult(null, {
                message: "Service updated successfully",
                serviceId: Number(serviceId)
            }));
        });
    };

    if (category_id !== undefined) {
        pool.query(
            "SELECT category_id FROM service_categories WHERE category_id = ? AND is_active = 1",
            [category_id],
            (err, data) => {
                if (err) {
                    return sendDbError(res, "CHECK SERVICE CATEGORY ERROR", err);
                }
                if (data.length === 0) {
                    return res.send(
                        result.createResult("Active category not found")
                    );
                }
                performUpdate();
            }
        );
    } else {
        performUpdate();
    }
});

router.delete("/services/:serviceId", (req, res) => {
    const { serviceId } = req.params;

    if (!isValidId(serviceId)) {
        return res.send(result.createResult("Invalid service ID"));
    }

    const sql = `
        UPDATE services
        SET is_active = 0
        WHERE service_id = ? AND is_active = 1
    `;

    pool.query(sql, [serviceId], (err, data) => {
        if (err) return sendDbError(res, "DELETE SERVICE ERROR", err);

        if (data.affectedRows === 0) {
            return res.send(
                result.createResult("Service not found or already inactive")
            );
        }

        return res.send(result.createResult(null, {
            message: "Service deactivated successfully",
            serviceId: Number(serviceId)
        }));
    });
});

/* =====================================================
   6. GLOBAL SERVICE REQUESTS
===================================================== */

router.get("/requests", (req, res) => {
    const { status } = req.query;

    const allowedStatuses = [
        "PENDING",
        "ASSIGNED",
        "ACCEPTED",
        "IN_PROGRESS",
        "ARRIVED",
        "COMPLETED",
        "CANCELLED"
    ];

    let sql = `
        SELECT
            sr.request_id,
            sr.request_code,
            sr.user_id,
            sr.service_id,
            sr.category_id,
            sr.address_id,
            sr.assigned_worker_id,
            sr.description,
            sr.status,
            sr.estimated_price,
            sr.final_price,
            sr.created_at,
            sr.updated_at,
            s.service_name,
            s.price_unit,
            sc.category_name,
            u.full_name AS customer_name,
            u.email AS customer_email,
            u.phone AS customer_phone,
            w.full_name AS worker_name,
            w.phone AS worker_phone,
            wp.avg_rating AS worker_rating,
            wp.primary_city AS worker_city,
            a.label AS address_label,
            a.address_line1,
            a.address_line2,
            a.city AS address_city,
            a.area AS address_area,
            a.pincode,
            f.rating AS feedback_rating,
            f.comment AS feedback_comment
        FROM service_requests sr
        INNER JOIN services s ON s.service_id = sr.service_id
        LEFT JOIN service_categories sc ON sc.category_id = sr.category_id
        INNER JOIN users u ON u.user_id = sr.user_id
        LEFT JOIN users w ON w.user_id = sr.assigned_worker_id
        LEFT JOIN worker_profiles wp ON wp.worker_id = sr.assigned_worker_id
        LEFT JOIN addresses a ON a.address_id = sr.address_id
        LEFT JOIN feedback f ON f.request_id = sr.request_id
    `;

    const params = [];

    if (status && status !== "ALL") {
        const normalizedStatus = String(status).toUpperCase();

        if (!allowedStatuses.includes(normalizedStatus)) {
            return res.send(result.createResult("Invalid request status"));
        }

        sql += " WHERE sr.status = ?";
        params.push(normalizedStatus);
    }

    sql += " ORDER BY sr.created_at DESC";

    pool.query(sql, params, (err, data) => {
        if (err) return sendDbError(res, "ADMIN GET REQUESTS ERROR", err);

        const formatted = (data || []).map((r) => ({
            ...r,
            request_id: Number(r.request_id),
            user_id: Number(r.user_id),
            service_id: Number(r.service_id),
            category_id: Number(r.category_id),
            address_id: Number(r.address_id),
            assigned_worker_id: r.assigned_worker_id
                ? Number(r.assigned_worker_id)
                : null,
            estimated_price: r.estimated_price !== null
                ? Number(r.estimated_price)
                : 0,
            final_price: r.final_price !== null
                ? Number(r.final_price)
                : null,
            worker_rating: r.worker_rating !== null
                ? Number(r.worker_rating)
                : null,
            feedback_rating: r.feedback_rating !== null
                ? Number(r.feedback_rating)
                : null
        }));

        return res.send(result.createResult(null, formatted));
    });
});

/* =====================================================
   6A. MANUAL WORKER ASSIGNMENT
   - Transactional updates
   - Approved, active, unblocked worker
   - Matching category
   - Available worker
   - Valid request state
   - No conflicting active assignment
===================================================== */

router.put("/requests/:requestId/assign", (req, res) => {
    const { requestId } = req.params;
    const { workerId } = req.body;

    if (!isValidId(requestId)) {
        return res.send(result.createResult("Invalid request ID"));
    }

    if (!isValidId(workerId)) {
        return res.send(result.createResult("Valid worker ID is required"));
    }

    pool.getConnection((connectionErr, connection) => {
        if (connectionErr) {
            return sendDbError(res, "ASSIGNMENT CONNECTION ERROR", connectionErr);
        }

        const rollback = (message, error = null) => {
            connection.rollback(() => {
                connection.release();

                if (error) {
                    console.error("ADMIN ASSIGN WORKER ERROR:", error);
                }

                return res.send(result.createResult(message));
            });
        };

        connection.beginTransaction((transactionErr) => {
            if (transactionErr) {
                connection.release();
                return sendDbError(
                    res,
                    "ASSIGNMENT TRANSACTION ERROR",
                    transactionErr
                );
            }

            const requestSql = `
                SELECT
                    sr.request_id,
                    sr.category_id,
                    sr.assigned_worker_id,
                    sr.status
                FROM service_requests sr
                WHERE sr.request_id = ?
                FOR UPDATE
            `;

            connection.query(requestSql, [requestId], (requestErr, requests) => {
                if (requestErr) {
                    return rollback("Unable to read service request", requestErr);
                }

                if (requests.length === 0) {
                    return rollback("Service request not found");
                }

                const request = requests[0];

                if (!["PENDING", "ASSIGNED"].includes(request.status)) {
                    return rollback(
                        "Only pending or assigned requests can be manually assigned"
                    );
                }

                const workerSql = `
                    SELECT
                        u.user_id,
                        u.full_name,
                        u.is_active,
                        u.is_blocked,
                        wp.approval_status,
                        wp.is_available
                    FROM users u
                    INNER JOIN roles r ON r.role_id = u.role_id
                    INNER JOIN worker_profiles wp ON wp.worker_id = u.user_id
                    INNER JOIN worker_categories wc ON wc.worker_id = u.user_id
                    WHERE u.user_id = ?
                      AND r.role_name = 'WORKER'
                      AND wc.category_id = ?
                    FOR UPDATE
                `;

                connection.query(
                    workerSql,
                    [workerId, request.category_id],
                    (workerErr, workers) => {
                        if (workerErr) {
                            return rollback("Unable to validate worker", workerErr);
                        }

                        if (workers.length === 0) {
                            return rollback(
                                "Worker not found or worker does not provide this category"
                            );
                        }

                        const worker = workers[0];

                        if (worker.approval_status !== "APPROVED") {
                            return rollback("Cannot assign an unapproved worker");
                        }

                        if (!worker.is_active || worker.is_blocked) {
                            return rollback(
                                "Worker account is inactive or blocked"
                            );
                        }

                        if (!worker.is_available) {
                            return rollback("Worker is not available");
                        }

                        const activeAssignmentSql = `
                            SELECT request_id
                            FROM service_requests
                            WHERE assigned_worker_id = ?
                              AND request_id <> ?
                              AND status IN (
                                'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ARRIVED'
                              )
                            LIMIT 1
                        `;

                        connection.query(
                            activeAssignmentSql,
                            [workerId, requestId],
                            (activeErr, activeAssignments) => {
                                if (activeErr) {
                                    return rollback(
                                        "Unable to check worker assignments",
                                        activeErr
                                    );
                                }

                                if (activeAssignments.length > 0) {
                                    return rollback(
                                        "Worker already has an active assignment"
                                    );
                                }

                                const updateRequestSql = `
                                    UPDATE service_requests
                                    SET assigned_worker_id = ?,
                                        status = 'ASSIGNED',
                                        updated_at = CURRENT_TIMESTAMP
                                    WHERE request_id = ?
                                `;

                                connection.query(
                                    updateRequestSql,
                                    [workerId, requestId],
                                    (updateErr) => {
                                        if (updateErr) {
                                            return rollback(
                                                "Unable to assign worker",
                                                updateErr
                                            );
                                        }

                                        const updateWorkerSql = `
                                            UPDATE worker_profiles
                                            SET is_available = 0
                                            WHERE worker_id = ?
                                        `;

                                        connection.query(
                                            updateWorkerSql,
                                            [workerId],
                                            (availabilityErr) => {
                                                if (availabilityErr) {
                                                    return rollback(
                                                        "Unable to update worker availability",
                                                        availabilityErr
                                                    );
                                                }

                                                // Release the previously assigned worker
                                                // only if no other active job remains.
                                                const oldWorkerId =
                                                    request.assigned_worker_id;

                                                const finishAssignment = () => {
                                                    connection.commit((commitErr) => {
                                                        if (commitErr) {
                                                            return rollback(
                                                                "Unable to commit worker assignment",
                                                                commitErr
                                                            );
                                                        }

                                                        connection.release();

                                                        return res.send(
                                                            result.createResult(null, {
                                                                message: `Worker ${worker.full_name} assigned successfully`,
                                                                requestId: Number(requestId),
                                                                workerId: Number(workerId),
                                                                status: "ASSIGNED"
                                                            })
                                                        );
                                                    });
                                                };

                                                if (
                                                    oldWorkerId &&
                                                    Number(oldWorkerId) !== Number(workerId)
                                                ) {
                                                    const releaseOldSql = `
                                                        UPDATE worker_profiles wp
                                                        INNER JOIN users u
                                                            ON u.user_id = wp.worker_id
                                                        SET wp.is_available = CASE
                                                            WHEN wp.approval_status = 'APPROVED'
                                                             AND u.is_active = 1
                                                             AND u.is_blocked = 0
                                                             AND NOT EXISTS (
                                                                SELECT 1
                                                                FROM service_requests sr
                                                                WHERE sr.assigned_worker_id = wp.worker_id
                                                                  AND sr.request_id <> ?
                                                                  AND sr.status IN (
                                                                    'ASSIGNED', 'ACCEPTED',
                                                                    'IN_PROGRESS', 'ARRIVED'
                                                                  )
                                                             )
                                                            THEN 1
                                                            ELSE 0
                                                        END
                                                        WHERE wp.worker_id = ?
                                                    `;

                                                    connection.query(
                                                        releaseOldSql,
                                                        [requestId, oldWorkerId],
                                                        (releaseErr) => {
                                                            if (releaseErr) {
                                                                return rollback(
                                                                    "Unable to release previous worker",
                                                                    releaseErr
                                                                );
                                                            }
                                                            finishAssignment();
                                                        }
                                                    );
                                                } else {
                                                    finishAssignment();
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });
});

/* =====================================================
   6B. CANCEL SERVICE REQUEST
   - Do not cancel completed requests
   - Prevent duplicate cancellation
   - Release worker only when no other active job remains
===================================================== */

router.put("/requests/:requestId/cancel", (req, res) => {
    const { requestId } = req.params;

    if (!isValidId(requestId)) {
        return res.send(result.createResult("Invalid request ID"));
    }

    pool.getConnection((connectionErr, connection) => {
        if (connectionErr) {
            return sendDbError(res, "CANCEL CONNECTION ERROR", connectionErr);
        }

        const rollback = (message, error = null) => {
            connection.rollback(() => {
                connection.release();

                if (error) {
                    console.error("ADMIN CANCEL REQUEST ERROR:", error);
                }

                return res.send(result.createResult(message));
            });
        };

        connection.beginTransaction((transactionErr) => {
            if (transactionErr) {
                connection.release();
                return sendDbError(
                    res,
                    "CANCEL TRANSACTION ERROR",
                    transactionErr
                );
            }

            const getRequestSql = `
                SELECT request_id, assigned_worker_id, status
                FROM service_requests
                WHERE request_id = ?
                FOR UPDATE
            `;

            connection.query(
                getRequestSql,
                [requestId],
                (requestErr, requests) => {
                    if (requestErr) {
                        return rollback("Unable to read service request", requestErr);
                    }

                    if (requests.length === 0) {
                        return rollback("Service request not found");
                    }

                    const request = requests[0];

                    if (["COMPLETED", "CANCELLED"].includes(request.status)) {
                        return rollback(
                            `Cannot cancel a request with status ${request.status}`
                        );
                    }

                    const updateSql = `
                        UPDATE service_requests
                        SET status = 'CANCELLED',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE request_id = ?
                    `;

                    connection.query(updateSql, [requestId], (updateErr) => {
                        if (updateErr) {
                            return rollback("Unable to cancel service request", updateErr);
                        }

                        const finishCancellation = () => {
                            connection.commit((commitErr) => {
                                if (commitErr) {
                                    return rollback(
                                        "Unable to commit cancellation",
                                        commitErr
                                    );
                                }

                                connection.release();

                                return res.send(result.createResult(null, {
                                    message: "Request cancelled successfully",
                                    requestId: Number(requestId),
                                    status: "CANCELLED"
                                }));
                            });
                        };

                        if (!request.assigned_worker_id) {
                            return finishCancellation();
                        }

                        const releaseWorkerSql = `
                            UPDATE worker_profiles wp
                            INNER JOIN users u ON u.user_id = wp.worker_id
                            SET wp.is_available = CASE
                                WHEN wp.approval_status = 'APPROVED'
                                 AND u.is_active = 1
                                 AND u.is_blocked = 0
                                 AND NOT EXISTS (
                                    SELECT 1
                                    FROM service_requests sr
                                    WHERE sr.assigned_worker_id = wp.worker_id
                                      AND sr.request_id <> ?
                                      AND sr.status IN (
                                        'ASSIGNED', 'ACCEPTED',
                                        'IN_PROGRESS', 'ARRIVED'
                                      )
                                 )
                                THEN 1
                                ELSE 0
                            END
                            WHERE wp.worker_id = ?
                        `;

                        connection.query(
                            releaseWorkerSql,
                            [requestId, request.assigned_worker_id],
                            (releaseErr) => {
                                if (releaseErr) {
                                    return rollback(
                                        "Request cancellation failed while releasing worker",
                                        releaseErr
                                    );
                                }

                                finishCancellation();
                            }
                        );
                    }
                );
        });
    });
});
})

/* =====================================================
   7. PLATFORM ANALYTICS
===================================================== */

router.get("/analytics", (req, res) => {
    const statusSql = `
        SELECT
            status,
            COUNT(*) AS count,
            COALESCE(
                SUM(COALESCE(final_price, estimated_price, 0)), 0
            ) AS value
        FROM service_requests
        GROUP BY status
    `;

    const categorySql = `
        SELECT
            sc.category_name,
            COUNT(sr.request_id) AS total_requests,
            COALESCE(
                SUM(
                    CASE
                        WHEN sr.status = 'COMPLETED'
                        THEN COALESCE(sr.final_price, sr.estimated_price, 0)
                        ELSE 0
                    END
                ), 0
            ) AS category_revenue
        FROM service_categories sc
        LEFT JOIN services s ON s.category_id = sc.category_id
        LEFT JOIN service_requests sr ON sr.service_id = s.service_id
        GROUP BY sc.category_id, sc.category_name
        ORDER BY total_requests DESC
    `;
    
const topWorkersSql = `
    SELECT
        u.user_id,
        u.full_name,
        wp.primary_city,
        wp.avg_rating,
        (
            SELECT COUNT(*)
            FROM service_requests sr
            WHERE sr.assigned_worker_id = u.user_id
              AND sr.status = 'COMPLETED'
        ) AS total_jobs_completed,
        GROUP_CONCAT(
            DISTINCT sc.category_name SEPARATOR ', '
        ) AS categories
    FROM users u
    INNER JOIN roles r ON r.role_id = u.role_id
    INNER JOIN worker_profiles wp ON wp.worker_id = u.user_id
    LEFT JOIN worker_categories wc ON wc.worker_id = u.user_id
    LEFT JOIN service_categories sc ON sc.category_id = wc.category_id
    WHERE r.role_name = 'WORKER'
      AND wp.approval_status = 'APPROVED'
      AND u.is_active = 1
      AND u.is_blocked = 0
    GROUP BY
        u.user_id,
        u.full_name,
        wp.primary_city,
        wp.avg_rating,
        wp.worker_id
    ORDER BY
        wp.avg_rating DESC,
        total_jobs_completed DESC
    LIMIT 5
`;


    const topServicesSql = `
        SELECT
            s.service_name,
            sc.category_name,
            s.base_price,
            COUNT(sr.request_id) AS booking_count
        FROM services s
        LEFT JOIN service_categories sc ON sc.category_id = s.category_id
        LEFT JOIN service_requests sr ON sr.service_id = s.service_id
        GROUP BY
            s.service_id, s.service_name, sc.category_name, s.base_price
        ORDER BY booking_count DESC
        LIMIT 5
    `;

    const ratingSql = `
        SELECT rating, COUNT(*) AS count
        FROM feedback
        GROUP BY rating
        ORDER BY rating DESC
    `;

    pool.query(statusSql, (statusErr, statusData) => {
        if (statusErr) {
            return sendDbError(res, "ANALYTICS STATUS ERROR", statusErr);
        }

        pool.query(categorySql, (categoryErr, categoryData) => {
            if (categoryErr) {
                return sendDbError(
                    res,
                    "ANALYTICS CATEGORY ERROR",
                    categoryErr
                );
            }

            pool.query(topWorkersSql, (workerErr, workerData) => {
                if (workerErr) {
                    return sendDbError(
                        res,
                        "ANALYTICS WORKERS ERROR",
                        workerErr
                    );
                }

                pool.query(topServicesSql, (serviceErr, serviceData) => {
                    if (serviceErr) {
                        return sendDbError(
                            res,
                            "ANALYTICS SERVICES ERROR",
                            serviceErr
                        );
                    }

                    pool.query(ratingSql, (ratingErr, ratingData) => {
                        if (ratingErr) {
                            return sendDbError(
                                res,
                                "ANALYTICS RATINGS ERROR",
                                ratingErr
                            );
                        }

                        return res.send(result.createResult(null, {
                            statusDistribution: statusData || [],
                            categoryPerformance: categoryData || [],
                            topWorkers: (workerData || []).map((w) => ({
                                ...w,
                                user_id: Number(w.user_id),
                                avg_rating: Number(w.avg_rating || 0),
                                total_jobs_completed: Number(
                                    w.total_jobs_completed || 0
                                )
                            })),
                            topServices: (serviceData || []).map((s) => ({
                                ...s,
                                base_price: Number(s.base_price || 0),
                                booking_count: Number(s.booking_count || 0)
                            })),
                            ratingDistribution: (ratingData || []).map((r) => ({
                                ...r,
                                rating: Number(r.rating),
                                count: Number(r.count)
                            }))
                        }));
                    });
                });
            });
        });
    });
});

/* =====================================================
   8. ADMIN PROFILE AND SETTINGS
===================================================== */

router.get("/profile", (req, res) => {
    const adminId = getAdminId(req);

    if (!isValidId(adminId)) {
        return res.send(result.createResult("Invalid admin identity"));
    }

    const sql = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.phone,
            u.created_at,
            r.role_name
        FROM users u
        INNER JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = ? AND r.role_name = 'ADMIN'
    `;

    pool.query(sql, [adminId], (err, data) => {
        if (err) return sendDbError(res, "ADMIN PROFILE ERROR", err);

        if (data.length === 0) {
            return res.send(result.createResult("Admin not found"));
        }

        return res.send(result.createResult(null, data[0]));
    });
});

router.put("/profile", (req, res) => {
    const adminId = getAdminId(req);
    const { full_name, phone } = req.body;

    if (!isValidId(adminId)) {
        return res.send(result.createResult("Invalid admin identity"));
    }

    if (!isValidText(full_name)) {
        return res.send(result.createResult("Full name is required"));
    }

    if (
        phone !== undefined &&
        phone !== null &&
        typeof phone !== "string"
    ) {
        return res.send(result.createResult("Invalid phone number"));
    }

    const sql = `
        UPDATE users u
        INNER JOIN roles r ON r.role_id = u.role_id
        SET u.full_name = ?, u.phone = ?
        WHERE u.user_id = ? AND r.role_name = 'ADMIN'
    `;

    pool.query(
        sql,
        [full_name.trim(), phone?.trim() || null, adminId],
        (err, data) => {
            if (err) return sendDbError(res, "UPDATE ADMIN PROFILE ERROR", err);

            if (data.affectedRows === 0) {
                return res.send(
                    result.createResult("Admin not found or profile unchanged")
                );
            }

            return res.send(result.createResult(null, {
                message: "Profile updated successfully",
                fullName: full_name.trim(),
                phone: phone?.trim() || null
            }));
        }
    );
});

router.put("/change-password", (req, res) => {
    const adminId = getAdminId(req);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!isValidId(adminId)) {
        return res.send(result.createResult("Invalid admin identity"));
    }

    if (!isValidText(currentPassword)) {
        return res.send(result.createResult("Current password is required"));
    }

    if (
        typeof newPassword !== "string" ||
        newPassword.length < 6
    ) {
        return res.send(
            result.createResult("New password must be at least 6 characters")
        );
    }

    if (newPassword !== confirmPassword) {
        return res.send(result.createResult("New passwords do not match"));
    }

    const currentHash = cryptojs.SHA256(currentPassword).toString();

    const checkSql = `
        SELECT u.password_hash
        FROM users u
        INNER JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = ? AND r.role_name = 'ADMIN'
    `;

    pool.query(checkSql, [adminId], (checkErr, data) => {
        if (checkErr) {
            return sendDbError(res, "CHECK ADMIN PASSWORD ERROR", checkErr);
        }

        if (data.length === 0) {
            return res.send(result.createResult("Admin not found"));
        }

        if (data[0].password_hash !== currentHash) {
            return res.send(
                result.createResult("Current password is incorrect")
            );
        }

        const newHash = cryptojs.SHA256(newPassword).toString();

        const updateSql = `
            UPDATE users u
            INNER JOIN roles r ON r.role_id = u.role_id
            SET u.password_hash = ?
            WHERE u.user_id = ? AND r.role_name = 'ADMIN'
        `;

        pool.query(updateSql, [newHash, adminId], (updateErr) => {
            if (updateErr) {
                return sendDbError(
                    res,
                    "UPDATE ADMIN PASSWORD ERROR",
                    updateErr
                );
            }

            return res.send(result.createResult(
                null,
                "Password changed successfully"
            ));
        });
    });
});

module.exports = router;
