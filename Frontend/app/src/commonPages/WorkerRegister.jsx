import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  registerWorker,
  getServiceCategories,
} from "../Services/commonService";

import "./WorkerRegister.css";

function WorkerRegister() {

  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await getServiceCategories();
      if (response.status === "success") {
        setCategories(response.data);
      }
    } catch (err) {
      console.log(err);
      toast.error("Unable to load service categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const signUp = async (e) => {
    e.preventDefault();

    if (fullName.trim() === "") {
      toast.warning("Enter Full Name");
      return;
    }

    if (!email.includes("@")) {
      toast.warning("Enter Valid Email");
      return;
    }

    if (phone.length !== 10) {
      toast.warning("Enter Valid Mobile Number");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must contain at least 6 characters");
      return;
    }

    if (selectedCategories.length === 0) {
      toast.warning("Select at least one service category");
      return;
    }

    try {
      const response = await registerWorker(
        fullName,
        email,
        phone,
        password,
        selectedCategories
      );

      if (response.status === "success") {
        toast.success("Registration Successful");
        navigate("/login");
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      toast.error("Registration Failed");
    }
  };

  // Toggle all categories
  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.category_id));
    }
  };

  return (
    <div className="worker-register-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-lg-6 col-md-8">
            <div className="register-card">
              <div className="register-card-body">

                {/* Header */}
                <div className="register-header">
                  <div className="register-icon">
                    <i className="bi bi-tools"></i>
                  </div>
                  <h2 className="register-title">Worker Registration</h2>
                  <p className="register-subtitle">Join SmartServe as a Service Provider</p>
                </div>

                <form onSubmit={signUp}>

                  {/* Full Name */}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter 10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength="10"
                    />
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {/* Service Categories - Dropdown Style */}
                  <div className="form-group">
                    <label className="form-label">Select Service Categories</label>
                    
                    {categoriesLoading ? (
                      <div className="categories-loading">
                        <div className="spinner"></div>
                        <span>Loading categories...</span>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="categories-empty">
                        <i className="bi bi-tags"></i>
                        <span>No categories available</span>
                      </div>
                    ) : (
                      <div className="category-dropdown-wrapper">
                        <div className="category-dropdown-header">
                          <span className="selected-count">
                            {selectedCategories.length} selected
                          </span>
                          <button 
                            type="button"
                            className="toggle-all-btn"
                            onClick={toggleAllCategories}
                          >
                            {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="category-dropdown">
                          {categories.map((category) => (
                            <div
                              key={category.category_id}
                              className={`category-item ${selectedCategories.includes(category.category_id) ? 'selected' : ''}`}
                              onClick={() => toggleCategory(category.category_id)}
                            >
                              <span className="category-check">
                                {selectedCategories.includes(category.category_id) ? (
                                  <i className="bi bi-check-circle-fill"></i>
                                ) : (
                                  <i className="bi bi-circle"></i>
                                )}
                              </span>
                              <span className="category-name">{category.category_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-register">
                    Register
                  </button>

                </form>

                {/* Footer */}
                <div className="register-footer">
                  <p>
                    Already have an account? <Link to="/login">Login</Link>
                  </p>
                  <div className="footer-links">
                    <Link to="/register/user">Register as User</Link>
                    <span className="divider">|</span>
                    <Link to="/">← Back to Home</Link>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkerRegister;