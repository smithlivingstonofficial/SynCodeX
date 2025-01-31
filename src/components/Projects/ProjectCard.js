import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // To navigate to the project details page
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Firestore imports

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const [thumbnailURL, setThumbnailURL] = useState("/default-thumbnail.jpg"); // Default thumbnail

  useEffect(() => {
    const fetchThumbnail = async () => {
      const db = getFirestore();
      const docRef = doc(db, "projects", project.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setThumbnailURL(docSnap.data().thumbnailURL || "/default-thumbnail.jpg");
      }
    };

    fetchThumbnail();
  }, [project.id]);

  const handleClick = () => {
    navigate(`/project/${project.id}`); // Navigate to the Project Details page
  };

  return (
    <div className="project-card" onClick={handleClick}>
      <div className="project-card-thumbnail">
        <img
          src={thumbnailURL} // Thumbnail for the project
          alt={project.title}
          className="project-thumbnail-image"
        />
      </div>
      <div className="project-card-content">
        <div className="project-channel-info">
          <img
            src={project.profilePicture || "/default-profile.png"} // Display profile picture
            alt="Channel Profile"
            className="channel-profile-image"
          />
          <div className="project-details">
            <h3 className="project-title">{project.title}</h3>
            <span className="channel-name">{project.channelName}</span> {/* Display channel name */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
