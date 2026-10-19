import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUser } from "../Services/commonService";
import "./UserRegister.css";

function UserRegister() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async (e) => {
    e.preventDefault();

    if (fullName === "") {
      toast.warning("Please enter full name");
      return;
    }

    if (!email.includes("@")) {
      toast.warning("Invalid email");
      return;
    }

    if (phone.length !== 10) {
      toast.warning("Enter valid phone number");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must contain at least 6 characters");
      return;
    }

    try {
      const result = await registerUser(fullName, email, phone, password);

      if (result.status === "success") {
        toast.success("Registration Successful");
        navigate("/login");
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-6 col-md-8">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="bi bi-person-plus-fill display-3 text-primary"></i>
                  <h2 className="fw-bold mt-3">User Registration</h2>
                  <p className="text-muted">
                    Create your SmartServe account to book trusted professionals.
                  </p>
                </div>

                <form onSubmit={signUp}>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <label>Full Name</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <label>Email Address</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    <label>Phone Number</label>
                  </div>

                  <div className="form-floating mb-4">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <label>Password</label>
                  </div>

                  <button className="btn btn-primary btn-lg w-100">Register</button>
                </form>

                <hr />

                <div className="text-center">
                  <p className="mb-2">
                    Already have an account?
                    <Link to="/login" className="ms-2 fw-bold">
                      Login
                    </Link>
                  </p>
                  <p>Want to provide services?</p>
                  <Link to="/register/worker" className="btn btn-outline-success">
                    Register as Worker
                  </Link>
                  <br />
                  <Link to="/" className="btn btn-link mt-3">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserRegister;