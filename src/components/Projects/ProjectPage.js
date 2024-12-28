// To display the projects created by the user, we need to fetch the projects from the Firestore database. We can use the useEffect hook to fetch the projects when the component mounts. We will use the getDocs function from the Firestore library to fetch the projects from the database. We will also add a delete button to delete the project from the database.
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase/config";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./ProjectPage.css";

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      setIsLoading(true);
      const q = query(collection(db, "projects"), where("ownerId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const fetchedProjects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(fetchedProjects);
      setIsLoading(false);
    };

    fetchProjects();
  }, [user]);

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
        setProjects(projects.filter((project) => project.id !== projectId));
        alert("Project deleted successfully.");
      } catch (error) {
        console.error("Error deleting project:", error);
        alert("Failed to delete project.");
      }
    }
  };

  if (!user) {
    return <h1>Please log in to view your projects.</h1>;
  }

  return (
    <div className="project-page">
      <h1>Your Projects</h1>
      {isLoading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found. Start uploading now!</p>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <img
                src={project.thumbnail || "/default-thumbnail.png"}
                alt={project.title}
                className="project-thumbnail"
              />
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="project-actions">
                <button onClick={() => navigate(`/edit-project/${project.id}`)}>Edit</button>
                <button onClick={() => handleDelete(project.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
