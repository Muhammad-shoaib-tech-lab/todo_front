import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <nav
      style={{
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#007bff",
        color: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
        <Link to="/" style={{ color: "white", textDecoration: "none" }}>
          TodoApp
        </Link>
      </h1>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {!user ? (
          <>
            <Link
              to="/login"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
                padding: "0.4rem 0.8rem",
                borderRadius: 4,
                border: "1.5px solid white",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "white", e.target.style.color = "#007bff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent", e.target.style.color = "white")}
            >
              Login
            </Link>
            <Link
              to="/register"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
                padding: "0.4rem 0.8rem",
                borderRadius: 4,
                border: "1.5px solid white",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "white", e.target.style.color = "#007bff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent", e.target.style.color = "white")}
            >
              Register
            </Link>
          </>
        ) : (
          <>
            {user.role === "admin" && (
              <Link
                to="/admindashboard"
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "600",
                  padding: "0.4rem 0.8rem",
                  borderRadius: 4,
                  border: "1.5px solid white",
                  transition: "background-color 0.3s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "white", e.target.style.color = "#007bff")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent", e.target.style.color = "white")}
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/create"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
                padding: "0.4rem 0.8rem",
                borderRadius: 4,
                border: "1.5px solid white",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "white", e.target.style.color = "#007bff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent", e.target.style.color = "white")}
            >
              Create
            </Link>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "transparent",
                border: "1.5px solid white",
                color: "white",
                fontWeight: "600",
                padding: "0.4rem 0.8rem",
                borderRadius: 4,
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "white", e.target.style.color = "#007bff")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent", e.target.style.color = "white")}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
