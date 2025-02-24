import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { db, storage } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProjectUpload = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [project, setProject] = useState({
    title: "",
    description: "",
    visibility: "public", // default value
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [projectFile, setProjectFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject({ ...project, [name]: value });
  };

  const handleThumbnailChange = (e) => {
    setThumbnail(e.target.files[0]);
  };

  const handleProjectFileChange = (e) => {
    setProjectFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You need to log in to upload a project.");
      return;
    }

    if (!project.title || !project.description || !thumbnail || !projectFile) {
      alert("Please fill out all fields and upload the required files.");
      return;
    }

    setIsUploading(true);

    try {
      // Upload Thumbnail
      const thumbnailRef = ref(storage, `thumbnails/${thumbnail.name}`);
      await uploadBytes(thumbnailRef, thumbnail);
      const thumbnailURL = await getDownloadURL(thumbnailRef);

      // Upload Project File
      const projectFileRef = ref(storage, `projectFiles/${projectFile.name}`);
      await uploadBytes(projectFileRef, projectFile);
      const projectFileURL = await getDownloadURL(projectFileRef);

      // Save project data to Firestore
      await addDoc(collection(db, "projects"), {
        ownerId: user.uid,
        title: project.title,
        description: project.description,
        thumbnailURL,
        projectFileURL,
        visibility: project.visibility,
        createdAt: new Date(),
      });

      alert("Project uploaded successfully!");
      setProject({
        title: "",
        description: "",
        visibility: "public",
      });
      setThumbnail(null);
      setProjectFile(null);
    } catch (error) {
      console.error("Error uploading project:", error);
      alert("Failed to upload project. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="project-upload-container">
      <h1>Upload Your Project</h1>
      <form onSubmit={handleSubmit}>
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
          <input
            type="file"
            accept="image/jpeg"
            onChange={handleThumbnailChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Project File</label>
          <input
            type="file"
            accept=".zip,.rar,.tar"
            onChange={handleProjectFileChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Visibility</label>
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

        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Project"}
        </button>
      </form>
    </div>
  );
};

export default ProjectUpload;
