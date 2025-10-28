import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserList from './components/UserList';
import UserForm from './components/UserForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              FastAPI React CRUD
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Users</Link>
              <Link to="/add-user" className="nav-link">Add User</Link>
            </div>
          </div>
        </nav>
        
        <main className="container">
          <Routes>
            <Route path="/" element={<UserList />} />
            <Route path="/add-user" element={<UserForm />} />
            <Route path="/edit-user/:id" element={<UserForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;