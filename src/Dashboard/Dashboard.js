import React, { useState, useEffect } from 'react';
import { auth } from '../FirebaseConfig'; // Ensure the correct path
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeProvider'; // Import the useTheme hook
import './Dashboard.css'; // Import the CSS file for styling

const Dashboard = ({ user }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
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

  const toggleProfileMenu = () => {
    setShowProfileMenu(prevState => !prevState);
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
      <aside className={`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
        <nav>
          <ul>
            <li>
              <a href="/dashboard" className="active">
                <i className="bx bx-home-circle"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i className="bx bx-grid-alt"></i>
                <span>Sources</span>
              </a>
            </li>
            <li>
              <a href="/projects">
                <i className="bx bx-carousel"></i>
                <span>Projects</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i className="bx bx-collection"></i>
                <span>Colab</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i className="bx bx-cloud-download"></i>
                <span>Approval Requests</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i className="bx bx-chat"></i>
                <span>Community</span>
              </a>
            </li>
            <li>
              <a href="/">
                <i className="bx bx-cog"></i>
                <span>Account</span>
              </a>
            </li>
            <li>
              <a href="/" data-resize-btn onClick={toggleSidebar}>
                <i className="bx bx-chevrons-right"></i>
                <span>{isSidebarOpen ? 'Collapse' : 'Expand'}</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-content">
        <nav className="navbar">
          <div className="nav-logo">
            <h2>SynCodeX</h2>
          </div>
          <div className="nav-user-info">
            <img 
              className="user-photo" 
              src={user.photoURL} 
              alt="User " 
              referrerPolicy="no-referrer" 
              onClick={toggleProfileMenu} 
            />
            {showProfileMenu && (
              <div className="profile-menu">
                <ul>
                  <li><a href="/profile">Profile Info</a></li>
                  <li><a href="/settings">Settings</a></li>
                  <li>
                    <button onClick={toggleTheme}>
                      {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                    </button>
                  </li>
                  <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            )}
          </div>
        </nav>

        <main>
          <h1>Welcome to your Dashboard, {user.displayName}!</h1>
          <p>
            Here you can analyze the state of your project and interact with your team members.  You can also access your project's settings and user information.   Please explore the menu to the left to learn more.
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