import React from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

// Props interface for ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component - ensures user is authenticated before accessing protected pages
 * If user is not authenticated, redirects to login page
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if user is authenticated
  const isAuthenticated = api.isAuthenticated();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;