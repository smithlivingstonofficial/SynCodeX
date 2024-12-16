// src/components/UploadModal.js
import React from 'react';
import './UploadModal.css'; // Optional: Create a CSS file for modal styles

const UploadModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  const handleUpload = (event) => {
    event.preventDefault();
    // Handle the file upload logic here
    console.log("File uploaded");
    onClose(); // Close the modal after upload
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Video</h2>
        <form onSubmit={handleUpload}>
          <div>
            <label htmlFor="videoTitle">Title:</label>
            <input type="text" id="videoTitle" required />
          </div>
          <div>
            <label htmlFor="videoFile">Select Video File:</label>
            <input type="file" id="videoFile" accept="video/*" required />
          </div>
          <div>
            <label htmlFor="videoDescription">Description:</label>
            <textarea id="videoDescription" rows="4"></textarea>
          </div>
          <button type="submit">Upload</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;