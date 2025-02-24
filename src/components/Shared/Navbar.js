import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./Navbar.css";

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = () => {
    auth.signOut().then(() => navigate("/"));
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  return (
    <div className={`navbar-container ${isDarkMode ? "dark-mode" : ""}`}>
      <nav className="navbar">
        <div className="navbar-left">
          <h1 onClick={() => navigate("/home")} className="navbar-logo">
            SynCodeX
          </h1>
        </div>

        <div className="navbar-right">
          <button
            className="upload-button"
            onClick={() => navigate("/upload")}
          >
          <img src="assets/icons/upload.png" className="upload-icon" alt="Upload Icon"/>  
            Upload
          </button>
          {user && (
            <div className="profile-container" onClick={toggleDropdown}>
              <img
                src={user?.photoURL || "/default-profile.png"}
                alt="User Profile" // Added alt prop to resolve ESLint warning
                className="profile-picture"
              />
              {showDropdown && (
                <div className="dropdown-menu">
                  <p onClick={() => navigate("/profile")}>Profile</p>
                  <p onClick={toggleTheme}>
                    {isDarkMode ? "Light Theme" : "Dark Theme"}
                  </p>
                  <p onClick={handleLogout}>Sign Out</p>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      {isDarkMode && <div className="multi-color-separator"></div>}
    </div>
  );
};

export default Navbar;
