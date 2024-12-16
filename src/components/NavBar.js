// src/components/Navbar.js
import React, { useState } from 'react';
import UploadModal from './UploadModal'; // Import the UploadModal component

const Navbar = ({ user, toggleTheme, isDarkTheme, handleLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // State for modal

  const toggleProfileMenu = () => {
    setShowProfileMenu(prevState => !prevState);
  };

  const handleUpload = () => {
    setIsUploadModalOpen(true); // Open the upload modal
  };

  const closeModal = () => {
    setIsUploadModalOpen(false); // Close the upload modal
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <h2>SynCodeX</h2>
        </div>
        <div className="nav-user-info">
          <button className="upload-button" onClick={handleUpload}>
            Upload
          </button>
          <img 
            className="user-photo" 
            src={user.photoURL} 
            alt="User  " 
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
      <UploadModal isOpen={isUploadModalOpen} onClose={closeModal} /> {/* Render the modal */}
    </>
  );
};

export default Navbar;