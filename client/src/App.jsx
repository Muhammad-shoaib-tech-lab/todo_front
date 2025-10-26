import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar";
import NavbarAuth from "./Components/NavbarAuth";
import AdminNavbar from "./Components/AdminNavbar";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Details from "./Components/Details";
import Create from "./Components/Create";
import Update from "./Components/Update";
import AdminDashboard from "./Components/AdminDashboard";

import AdminProtectedRoute from "./Components/AdminProtectedRoute"; 

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) setUser(savedUser);
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isAdminPage = location.pathname === "/admindashboard";

  let navbarToShow = null;
  if (isAdminPage && user?.role === "admin") {
    navbarToShow = <AdminNavbar onLogout={handleLogout} />;
  } else if (user) {
    navbarToShow = <NavbarAuth user={user} onLogout={handleLogout} />;
  } else {
    navbarToShow = <Navbar />;
  }

  return (
    <>
      {navbarToShow}

      <Routes>
        <Route
          path="/"
          element={
            user
              ? user.role === "admin"
                ? <Navigate to="/admindashboard" replace />
                : <Navigate to="/details" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/details" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/details" replace /> : <Register />}
        />
        <Route
          path="/details"
          element={user ? <Details user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/create"
          element={user ? <Create user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/update/:id"
          element={user ? <Update user={user} /> : <Navigate to="/login" replace />}
        />

        {/* Use AdminProtectedRoute here */}
        <Route
          path="/admindashboard"
          element={
            <AdminProtectedRoute user={user}>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
