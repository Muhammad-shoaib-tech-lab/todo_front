




import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initialValues = { email: "", password: "", role: "user" };

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    role: Yup.string().oneOf(["user", "admin"], "Invalid role"),
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/register", values);

      if (res.data.message) {
        alert("Registered successfully! Please login.");
        navigate("/login");
      } else {
        setError("Unexpected response from server");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Registration failed");
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
      <h2 style={{ marginBottom: 20, color: "#007bff" }}>Register</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form>
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
              <ErrorMessage
                name="password"
                component="div"
                style={errorStyle}
              />
            </div>

           

            <button
              type="submit"
              disabled={isSubmitting || loading}
              style={{
                ...buttonStyle,
                backgroundColor: loading ? "#6c757d" : "#007bff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </Form>
        )}
      </Formik>

      <p style={{ marginTop: 15 }}>
        Already have an account?{" "}
        <Link
          to="/login"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Login here
        </Link>
      </p>

      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
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
