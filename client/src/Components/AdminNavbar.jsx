import React from "react";
import { useNavigate } from "react-router-dom";

const AdminNavbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();          
    navigate("/login", { replace: true });  
  };

  return (
    <nav
      style={{
        backgroundColor: "blue",
        color: "white",
        padding: "0.8rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ margin: 0, cursor: "pointer" }} onClick={() => navigate("/admindashboard")}>
        Admin Dashboard
      </h2>
      <button
      style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "600",
              padding: "0.4rem 0.8rem",
              borderRadius: 4,
              border: "1.5px solid white",
              transition: "background-color 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#007bff";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "white";
            }}
            onClick={ handleLogout }
      >
        Logout
      </button>
    </nav>
  );
};

export default AdminNavbar;
