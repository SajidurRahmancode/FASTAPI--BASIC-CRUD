import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LogOut, Users, UserPlus } from 'lucide-react';
import LoginForm from './components/LoginForm';
import RegForm from './components/RegForm';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';
import './App.css';

function App() {
  // Check if user is authenticated
  const isAuthenticated = api.isAuthenticated();
  const user = api.getStoredUser();

  // Handle logout
  const handleLogout = () => {
    api.logout();
  };

  return (
    <Router>
      <div className="App">
        {/* Navigation Bar - only show when authenticated */}
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/users" className="nav-brand">
                FastAPI React CRUD
              </Link>
              <div className="nav-links">
                <Link to="/users" className="nav-link">
                  <Users size={16} />
                  Users
                </Link>
                <Link to="/add-user" className="nav-link">
                  <UserPlus size={16} />
                  Add User
                </Link>
                {/* User info and logout */}
                <div className="nav-user">
                  <span className="user-email">{user?.email}</span>
                  <button 
                    onClick={handleLogout} 
                    className="btn btn-outline logout-btn"
                    title="Logout"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}
        
        {/* Main Content */}
        <main className={isAuthenticated ? "container" : "auth-main"}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/users" replace /> : <LoginForm />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/users" replace /> : <RegForm />
              } 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <UserList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-user" 
              element={
                <ProtectedRoute>
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-user/:id" 
              element={
                <ProtectedRoute>
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <Navigate to="/users" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                isAuthenticated ? 
                <Navigate to="/users" replace /> : 
                <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </main>

        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;