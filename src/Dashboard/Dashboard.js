// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { auth } from '../FirebaseConfig'; 
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider'; 
import Sidebar from '../components/Sidebar'; 
import Navbar from '../components/NavBar'; 
import './Dashboard.css'; 

const Dashboard = ({ user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { isDarkTheme, toggleTheme } = useTheme(); // Use the theme context

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/'); // Redirect to the login page after logout
    } catch (error) {
      alert('Error signing out. Please try again.'); // User-friendly error message
      console.error('Error signing out:', error.message);
    }
  };

  const toggleSidebar = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    setIsSidebarOpen(prevState => !prevState);
  };

  useEffect(() => {
    // Update body class based on sidebar state
    document.body.classList.toggle('sb-expanded', isSidebarOpen);
  }, [isSidebarOpen]); // Runs every time isSidebarOpen changes

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Navbar user={user} toggleTheme={toggleTheme} isDarkTheme={isDarkTheme} handleLogout={handleLogout} />
        <main>
          <h1>Welcome to your Dashboard, {user.displayName}!</h1>
          <p>
            Here you can analyze the state of your project and interact with your team members. You can also access your project's settings and user information. Please explore the menu to the left to learn more.
          </p>

          <div className="placeholder">
            <div className="ph-1"></div>
            <div className="ph-2"></div>
            <div className="ph-3"></div>
            <div className="ph-4"></div>
            <div className="ph-5"></div>
            <div className="ph-6"></div>
            <div className="ph-7"></div>
            <div className="ph-8"></div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;