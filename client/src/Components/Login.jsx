import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialValues = { email: "", password: "" };

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/login", values);

      
      localStorage.setItem("token", res.data.token);

      
      onLogin({ email: res.data.email, role: res.data.role });

     
      navigate("/details");
    } catch (e) {
      setError(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 20, color: "#007bff" }}>Login</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
            {/* Email */}
            <div style={{ marginBottom: 15 }}>
              <label htmlFor="email">Email</label>
              <Field
                name="email"
                type="email"
                placeholder="your@email.com"
                style={inputStyle}
              />
              <ErrorMessage name="email" component="div" style={errorStyle} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 15, position: "relative" }}>
              <label htmlFor="password">Password</label>
              <Field
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                style={inputStyle}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 35,
                  cursor: "pointer",
                  color: "#888",
                  userSelect: "none",
                }}
              >
                {showPassword ? <FiEye size={20} /> : <FiEyeOff size={20} />}
              </span>
              <ErrorMessage name="password" component="div" style={errorStyle} />
            </div>

            {/* Error */}
            {error && (
              <div style={{ color: "red", marginBottom: 10 }}>{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              style={{
                ...buttonStyle,
                backgroundColor: loading ? "#6c757d" : "#007bff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </Form>
        )}
      </Formik>

      {/* Register Link */}
      <p style={{ marginTop: 15 }}>
        Don't have an account?{" "}
        <Link
          to="/register"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Register here
        </Link>
      </p>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  marginTop: 6,
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 16,
  boxSizing: "border-box",
};

const errorStyle = {
  color: "red",
  marginTop: 4,
  fontSize: 14,
};

const buttonStyle = {
  width: "100%",
  padding: "10px 0",
  color: "white",
  fontWeight: "600",
  border: "none",
  borderRadius: 5,
  fontSize: 16,
};
