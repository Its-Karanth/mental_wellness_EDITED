import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: isAdminRoute ? "admin" : "user",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (isAdminRoute) {
        // Call the backend admin-register endpoint
        await axios.post("http://localhost:5000/api/auth/admin-register");
        setSuccess("Admin registration successful! Please login.");
        setTimeout(() => navigate("/admin/login"), 1500);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await axios.post("http://localhost:5000/api/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        setSuccess("Registration successful! Please login.");
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div
        className="card shadow-sm p-4"
        style={{ 
          maxWidth: 400, 
          width: "100%",
          border: isAdminRoute ? "2px solid #dc3545" : "1px solid #dee2e6",
          borderRadius: "12px"
        }}
      >
        <h2 className="mb-3 text-center" style={{ color: isAdminRoute ? "#dc3545" : "#000" }}>
          {isAdminRoute ? "Admin Sign Up" : "Create Account"}
        </h2>
        {isAdminRoute && (
          <div className="alert alert-warning py-2 mb-3">
            <small>Admin registration. Only authorized personnel should proceed.</small>
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder={isAdminRoute ? "Admin Name" : "Enter your name"}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder={isAdminRoute ? "admin@wellness.com" : "Enter your email"}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder={isAdminRoute ? "admin@123" : "Enter your password"}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              placeholder={isAdminRoute ? "admin@123" : "Confirm password"}
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {success && <div className="alert alert-success py-2">{success}</div>}
          <button
            type="submit"
            className="btn w-100"
            style={{
              backgroundColor: isAdminRoute ? "#dc3545" : "#0d6efd",
              borderColor: isAdminRoute ? "#dc3545" : "#0d6efd",
              color: "white"
            }}
            disabled={loading}
          >
            {loading ? (isAdminRoute ? "Creating admin..." : "Creating account...") : (isAdminRoute ? "Admin Sign Up" : "Create Account")}
          </button>
        </form>
        {!isAdminRoute && (
          <div className="mt-3 text-center">
            <span>Already have an account? </span>
            <button
              className="btn btn-link p-0"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        )}
        {isAdminRoute && (
          <div className="mt-3 text-center">
            <small className="text-muted">
              Admin credentials: admin@wellness.com / admin@123
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
