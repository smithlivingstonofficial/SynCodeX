// To Display Project Details in the Home Page
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import "./ProjectDetails.css";

const ProjectDetails = () => {
  const { id } = useParams(); // Get the project ID from the URL
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false); // Track if the user has liked the project
  const userId = "user123"; // Use the currently logged-in user's ID (from Firebase Auth)

  // Fetch project details from Firestore
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProject(docSnap.data());
          
          // Check if the user has already liked the project
          if (docSnap.data().likes && docSnap.data().likes.includes(userId)) {
            setIsLiked(true);
          }
        } else {
          alert("Project not found.");
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
        alert("Failed to load project details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Handle Like/Unlike button click
  const handleLikeClick = async () => {
    if (!userId) {
      alert("You must be logged in to like a project.");
      return;
    }

    const projectRef = doc(db, "projects", id);
    
    try {
      if (isLiked) {
        // If the project is already liked, remove the like
        await updateDoc(projectRef, {
          likes: arrayRemove(userId), // Remove the user's ID from the "likes" array
        });
        setIsLiked(false); // Update the local state
      } else {
        // If the project is not liked, add the like
        await updateDoc(projectRef, {
          likes: arrayUnion(userId), // Add the user's ID to the "likes" array
        });
        setIsLiked(true); // Update the local state
      }
    } catch (error) {
      console.error("Error updating like status:", error);
      alert("Failed to update like status.");
    }
  };

  // Loading state while data is being fetched
  if (isLoading) {
    return <p>Loading project details...</p>;
  }

  // If the project is not found or unavailable
  if (!project) {
    return <p>Project not found or unavailable.</p>;
  }

  return (
    <div className="project-details-container">
      <h1>{project.title}</h1>
      
      {/* Thumbnail Image with fallback */}
      <img
        src={project.thumbnail || "/default-thumbnail.jpg"} // Fallback image if thumbnail is missing
        alt={project.title}
        className="project-details-thumbnail"
      />
      
      {/* Project description */}
      <p className="project-details-description">{project.description}</p>

      {/* Like Button */}
      <button onClick={handleLikeClick} className="like-button">
        {isLiked ? "Unlike" : "Like"} {/* Toggle between "Like" and "Unlike" */}
      </button>

      {/* Project Files Section */}
      <h3>Project Files</h3>
      {project.fileUrl ? (
        <a href={project.fileUrl} target="_blank" rel="noopener noreferrer">
          Download Project File
        </a>
      ) : (
        <p>No project files available.</p>
      )}
    </div>
  );
};

export default ProjectDetails;
