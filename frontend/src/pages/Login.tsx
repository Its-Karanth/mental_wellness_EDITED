import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/login/admin/login';
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isAdminRoute) {
        const res = await axios.post("http://localhost:5000/api/auth/admin-login", {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.admin));
        navigate("/admin-dashboard");
      } else {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        switch (res.data.user.role) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "therapist":
            navigate("/therapist-dashboard");
            break;
          default:
            navigate("/user-dashboard");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed.");
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
          {isAdminRoute ? "Admin Sign In" : "Sign In"}
        </h2>
        {isAdminRoute && (
          <div className="alert alert-warning py-2 mb-3">
            <small>Admin access required. Use admin credentials to continue.</small>
          </div>
        )}
        <form onSubmit={handleLogin}>
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
              placeholder="Enter your email"
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
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="alert alert-danger py-2">{error}</div>}
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
            {loading ? "Signing in..." : (isAdminRoute ? "Admin Sign In" : "Sign In")}
          </button>
        </form>
        {!isAdminRoute && (
          <div className="mt-3 text-center">
            <span>Don't have an account? </span>
            <button
              className="btn btn-link p-0"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
