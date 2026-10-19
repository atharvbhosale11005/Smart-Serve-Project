import { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { login } from "../Services/commonService";
import { LoginContext } from "../App";

import "./Login.css";

function Login() {
    const navigate = useNavigate();

    const { loginStatus, setLoginStatus, setRole } =
        useContext(LoginContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // If already logged in, redirect to the proper dashboard
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const role = sessionStorage.getItem("role");

        if (token) {
            if (role === "USER") {
                navigate("/user/dashboard", { replace: true });
            } else if (role === "WORKER") {
                navigate("/worker/dashboard", { replace: true });
            } else if (role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            }
        }
    }, [navigate]);

    const signIn = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.warning("Please enter email");
            return;
        }

        if (!email.includes("@")) {
            toast.warning("Please enter a valid email");
            return;
        }

        if (!password.trim()) {
            toast.warning("Please enter password");
            return;
        }

        try {
            const result = await login(email, password);


            if (result.status !== "success") {
                toast.error(result.message || "Login Failed");
                return;
            }

            const { token, user } = result.data;

            sessionStorage.setItem("token", token);

// Save complete user object
sessionStorage.setItem("user", JSON.stringify(user));

sessionStorage.setItem("role", user.role);

console.log("User object saved in sessionStorage:", user);

setLoginStatus(true);
setRole(user.role);

// notify other components
window.dispatchEvent(new Event("auth-changed"));

            toast.success("Login Successful");

            if (user.role === "USER") {
                navigate("/user/dashboard", { replace: true });
            } else if (user.role === "WORKER") {
                navigate("/worker/dashboard", { replace: true });
            } else if (user.role === "ADMIN") {
                navigate("/admin/dashboard", { replace: true });
            }
        } catch (error) {
            console.error(error);

            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Unable to login"
            );
        }
    };

    // Extra protection: don't render Login if already authenticated
    if (loginStatus) {
        const role = sessionStorage.getItem("role");

        if (role === "USER") {
            
            return <Navigate to="/user/dashboard" replace />;
        }

        if (role === "WORKER") {
            return <Navigate to="/worker/dashboard" replace />;
        }

        if (role === "ADMIN") {
            return <Navigate to="/admin/dashboard" replace />;
        }
    }

    return (
        <div className="login-page">
            <div className="container">
                <div className="row justify-content-center align-items-center min-vh-100">
                    <div className="col-lg-5 col-md-7">
                        <div className="card border-0 shadow-lg rounded-4">
                            <div className="card-body p-5">

                                <div className="text-center mb-4">
                                    <i className="bi bi-shield-lock display-3 text-primary"></i>
                                    <h2 className="fw-bold mt-3">
                                        SmartServe Login
                                    </h2>
                                    <p className="text-muted">
                                        Login as User, Worker or Admin
                                    </p>
                                </div>

                                <form onSubmit={signIn}>

                                    <div className="form-floating mb-3">
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                        <label>Email Address</label>
                                    </div>

                                    <div className="form-floating mb-4">
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                        />
                                        <label>Password</label>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 btn-lg"
                                    >
                                        Login
                                    </button>
                                </form>

                                <hr />

                                {!loginStatus && (
                                    <div className="text-center">
                                        <p className="mb-2">
                                            New to SmartServe?
                                        </p>

                                        <div className="d-grid gap-2">

                                            <Link
                                                to="/register/user"
                                                className="btn btn-outline-primary"
                                            >
                                                Register as User
                                            </Link>

                                            <Link
                                                to="/register/worker"
                                                className="btn btn-outline-success"
                                            >
                                                Register as Worker
                                            </Link>

                                        </div>

                                        <Link
                                            to="/"
                                            className="btn btn-link mt-3"
                                        >
                                            ← Back to Home
                                        </Link>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;