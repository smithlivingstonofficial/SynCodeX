import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { Box, Button, Card, CardContent, CardMedia, Typography, Avatar } from '@mui/material'; // MUI imports

const ViewProject = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [downloadURL, setDownloadURL] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      const db = getFirestore();
      const docRef = firestoreDoc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const projectData = docSnap.data();
        setProject(projectData);

        // Fetch the download URL from Firebase Storage
        const storage = getStorage();
        const fileRef = storageRef(storage, `projects/${projectId}/${projectData.downloadPath}`);
        const url = await getDownloadURL(fileRef);
        setDownloadURL(url);
      }
    };

    fetchProject();
  }, [projectId]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", mt: 5 }}>
      <CardMedia
        component="img"
        height="300"
        image={project.thumbnailURL || "/default-thumbnail.jpg"}
        alt={project.title}
      />
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar src={project.profilePicture || "/default-profile.png"} alt="Channel Profile" />
          <Box ml={2}>
            <Typography variant="h5" component="div">
              {project.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.channelName}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.primary" paragraph>
          {project.description}
        </Typography>
        <Box display="flex" justifyContent="space-between">
          <Button variant="contained" color="primary" onClick={() => window.open(downloadURL, "_blank")}>
            Download Project
          </Button>
          <Button variant="contained" color="secondary" onClick={() => window.open(project.editorLink, "_blank")}>
            Open In Editor
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ViewProject;
