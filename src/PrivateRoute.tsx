import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "./lib/store";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const user = useAuthStore((state) => state.user);

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If adminOnly is true and user is not an admin, redirect to dashboard
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
