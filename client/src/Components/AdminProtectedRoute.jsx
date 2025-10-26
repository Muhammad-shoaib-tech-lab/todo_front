import React from "react";
import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ user, children }) => {
  if (!user) {
    
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
   
    return <Navigate to="/details" replace />;
  }


  return children;
};

export default AdminProtectedRoute;
