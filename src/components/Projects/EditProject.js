// To Edit a Project
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./EditProject.css";

const EditProject = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState({
    title: "",
    description: "",
    thumbnail: "",
    file: "",
    visibility: "public",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      if (!user) return;

      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
        setProject(docSnap.data());
      } else {
        alert("Project not found or unauthorized access.");
        navigate("/projects");
      }
    };

    fetchProject();
  }, [user, projectId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject({ ...project, [name]: value });
  };

  const handleThumbnailChange = (e) => {
    setNewThumbnail(e.target.files[0]);
  };

  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const docRef = doc(db, "projects", projectId);

      let updatedThumbnailUrl = project.thumbnail;
      let updatedFileUrl = project.file;

      // Upload new thumbnail if provided
      if (newThumbnail) {
        const thumbnailRef = ref(storage, `thumbnails/${user.uid}/${projectId}`);
        await uploadBytes(thumbnailRef, newThumbnail);
        updatedThumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Upload new project file if provided
      if (newFile) {
        const fileRef = ref(storage, `projectFiles/${user.uid}/${projectId}`);
        await uploadBytes(fileRef, newFile);
        updatedFileUrl = await getDownloadURL(fileRef);
      }

      // Update Firestore document
      await updateDoc(docRef, {
        title: project.title,
        description: project.description,
        thumbnail: updatedThumbnailUrl,
        file: updatedFileUrl,
        visibility: project.visibility,
      });

      alert("Project updated successfully!");
      navigate("/projects");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edit-project-container">
      <h1>Edit Project</h1>
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={project.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={project.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Thumbnail (JPG only)</label>
          <input type="file" accept="image/jpeg" onChange={handleThumbnailChange} />
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt="Thumbnail"
              className="thumbnail-preview"
            />
          )}
        </div>

        <div className="form-group">
          <label>Project File</label>
          <input type="file" onChange={handleFileChange} />
          {project.file && (
            <a href={project.file} target="_blank" rel="noopener noreferrer">
              View Current File
            </a>
          )}
        </div>

        <div className="form-group">
          <label>Visibility</label>
          <div>
            <label>
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={project.visibility === "public"}
                onChange={handleChange}
              />
              Public
            </label>
            <label>
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={project.visibility === "private"}
                onChange={handleChange}
              />
              Private
            </label>
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditProject;
