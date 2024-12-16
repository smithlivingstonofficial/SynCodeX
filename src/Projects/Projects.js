import React, { useState } from 'react';
import { auth, db, storage } from '../FirebaseConfig'; // Import your Firebase config
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import necessary functions from Firebase Storage
import { addDoc, collection } from 'firebase/firestore'; // Import necessary functions from Firestore
import Navbar from '../components/NavBar'; // Import Navbar component
import Sidebar from '../components/Sidebar'; // Import Sidebar component
import { useTheme } from '../ThemeProvider'; // Import the useTheme hook
import './Projects.css'; // Import your CSS file for styling

const ProjectForm = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('Public');
  const [thumbnail, setThumbnail] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDarkTheme, toggleTheme } = useTheme(); // Use the theme context

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate inputs
      if (!thumbnail || !zipFile) {
        throw new Error('Please select both a thumbnail and a ZIP file.');
      }

      // Upload thumbnail
      const thumbnailRef = ref(storage, `thumbnails/${thumbnail.name}`);
      await uploadBytes(thumbnailRef, thumbnail);
      const thumbnailUrl = await getDownloadURL(thumbnailRef);

      // Upload ZIP file
      const zipRef = ref(storage, `projects/${zipFile.name}`);
      await uploadBytes(zipRef, zipFile);
      const zipUrl = await getDownloadURL(zipRef);

      // Store project data in Firestore
      const projectRef = await addDoc(collection(db, 'projects'), {
        title,
        description,
        thumbnailUrl,
        audience,
        zipUrl,
        userId: user.uid, // Use actual user ID from your auth system
      });

      // Get the project ID
      const projectId = projectRef.id;

      // Update the document with the project ID
      await projectRef.update({ projectId });

      setMessage(`Project uploaded successfully! Share this link: /project/${projectId}`);
    } catch (error) {
      setMessage(`Error uploading project: ${error.message}`);
    } finally {
      setLoading(false);
      // Clear form
      setTitle('');
      setDescription('');
      setAudience('Public');
      setThumbnail(null);
      setZipFile(null);
    }
  };

  const toggleSidebar = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    setIsSidebarOpen(prevState => !prevState);
  };

  return (
    <div className={`project-form-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Navbar user={user} toggleTheme={toggleTheme} isDarkTheme={isDarkTheme} handleLogout={() => auth.signOut()} />
        <div className="project-form">
          <h2>Upload Your Project</h2>
          <form onSubmit={handleUpload}>
            <input 
              type="text" 
              placeholder="Project Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
            />
            <textarea 
              placeholder="Project Description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
            />
            <select 
              value={audience} 
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            
            <div className="file-upload">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setThumbnail(e.target.files[0])} 
                required 
              />
              <input 
                type="file" 
                accept=".zip" 
                onChange={(e) => setZipFile(e.target.files[0])} 
                required 
              />
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Project'}
            </button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;