import React from "react";
import { useNavigate } from "react-router-dom"; // To navigate to the project details page

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`); // Navigate to the Project Details page
  };

  return (
    <div className="project-card" onClick={handleClick}>
      <div className="project-card-thumbnail">
        <img
          src={project.thumbnail || "/default-thumbnail.jpg"} // Thumbnail for the project
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
          <span className="channel-name">{project.channelName}</span> {/* Display channel name */}
        </div>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
      </div>
    </div>
  );
};

export default ProjectCard;
