const express = require("express");
const cryptojs = require("crypto-js");
const jwt = require("jsonwebtoken");
const pool = require("../Db/pool");
const result = require("../utils/result");
const config = require("../utils/config");

const router = express.Router();

router.post("/register/user", (req, res) => {

    const {full_name,email,phone,password} = req.body;

    const hashedPassword = cryptojs.SHA256(password).toString();

    const checkSql = `SELECT user_id FROM users WHERE email = ? OR phone = ?`;

    pool.query(checkSql, [email, phone], (err, data) => {

        if (err)
            return res.send(result.createResult(err));

        if (data.length > 0)
            return res.send(result.createResult("Email or Phone already exists"));

        const roleSql ="SELECT role_id FROM roles WHERE role_name='USER'";

        pool.query(roleSql, (err, roleData) => {

            if (err) return res.send(result.createResult(err));

            const roleId = roleData[0].role_id;

            const sql = `INSERT INTO users (role_id,full_name,email,phone,password_hash) VALUES(?,?,?,?,?)`;

            pool.query(sql,[roleId,full_name,email,phone,hashedPassword],(err, data) => {
                res.send(result.createResult(err, data));
            });
        });
    });
});

router.post("/register/worker", (req, res) => {

    const {full_name,email,phone,password,categories} = req.body;

    const hashedPassword = cryptojs.SHA256(password).toString();

     //Check Existing User
    const checkSql = `SELECT user_id FROM users WHERE email = ? OR phone = ?`;

    pool.query(checkSql,[email, phone],(err, data) => {

        if (err)
            return res.send(result.createResult(err));

        if (data.length > 0)
            return res.send( result.createResult("Email or Phone already exists"));

        const roleSql = `SELECT role_id FROM roles WHERE role_name='WORKER'`;

        pool.query(roleSql,(err, roleData) => {

            if (err) return res.send(result.createResult(err));

            const roleId = roleData[0].role_id;

            const insertUserSql = `INSERT INTO users (role_id,full_name,email,phone,password_hash) VALUES (?,?,?,?,?)`;

            pool.query(insertUserSql,[roleId,full_name,email,phone,hashedPassword],(err, userData) => {

                if (err)
                    return res.send(result.createResult(err));

                const workerId = userData.insertId;

                const profileSql = `INSERT INTO worker_profiles (worker_id) VALUES (?)`;

                pool.query(profileSql,[workerId],(err) => {

                    if (err) return res.send(result.createResult(err));

                    if (!categories || categories.length === 0) {
                        return res.send(result.createResult(null,"Worker Registered Successfully"));
                    }

                    const values = categories.map(categoryId => [workerId,categoryId]);

                    const categorySql = `INSERT INTO worker_categories (worker_id,category_id) VALUES ?`;

                    pool.query(categorySql,[values],(err) => {
                        if (err) return res.send(result.createResult(err)); 

                        res.send(result.createResult(null,"Worker Registered Successfully"));
                    });
                });
            });
        });
    });
});
                    
router.get("/service-categories", (req, res) => {

    const sql = `SELECT category_id,category_name FROM service_categories WHERE is_active = 1 ORDER BY category_name`;

    pool.query(sql, (err, data) => {
        if (err)
            return res.send(result.createResult(err));

        res.send(result.createResult(null, data));
    });
});



router.post("/login", (req, res) => {

    const { email, password } = req.body;

    const hashedPassword = cryptojs.SHA256(password).toString();

    const sql = `SELECT u.user_id,u.full_name,u.email,r.role_name FROM users u INNER JOIN roles r 
    ON u.role_id = r.role_id WHERE u.email=? AND u.password_hash=? AND u.is_active=1 AND u.is_blocked=0`;

    pool.query(sql,[email, hashedPassword],(err, data) => {

        if (err)
            return res.send(result.createResult(err));

        if (data.length == 0)
            return res.send(result.createResult("Invalid Email or Password"));

        const user = data[0];
        const payload = {
            userId: user.user_id,
            email: user.email,
            role: user.role_name
        };
            
        const token = jwt.sign(payload, config.SECRET);

        res.send(result.createResult(null, {
            token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                email: user.email,
                role: user.role_name
            }
        }));
    });
});

module.exports = router;