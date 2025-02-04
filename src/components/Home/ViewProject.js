import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { Box, Button, Card, CardContent, CardMedia, Typography, Avatar } from '@mui/material'; // MUI imports
import SideBar from '../Shared/Sidebar'; 
import NavBar from '../Shared/Navbar'; 

const ViewProject = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [downloadURL, setDownloadURL] = useState("");
  const [channel, setChannel] = useState({ name: "", logo: "" });

  useEffect(() => {
    const fetchProject = async () => {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.error("User is not authenticated"); // Debug log
        return;
      }

      console.log("Authenticated User:", user); // Debug log

      const docRef = firestoreDoc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const projectData = docSnap.data();
        console.log("Project Data:", projectData); // Debug log
        console.log("Project Visibility:", projectData.visibility); // Debug log
        setProject(projectData);

        // Fetch the download URL from Firebase Storage if downloadPath is defined
        if (projectData.downloadPath) {
          const storage = getStorage();
          const fileRef = storageRef(storage, `projects/${projectId}/${projectData.downloadPath}`);
          try {
            const url = await getDownloadURL(fileRef);
            console.log("Download URL:", url); // Debug log
            setDownloadURL(url);
          } catch (error) {
            console.error("Error fetching download URL:", error); // Debug log
          }
        } else {
          console.warn("Download path is not defined in project data"); // Debug log
        }

        // Fetch the channel information using ownerId
        if (projectData.ownerId) {
          const ownerRef = firestoreDoc(db, "users", projectData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            console.log("Owner Data:", ownerData); // Debug log
            setChannel({ name: ownerData.channelName, logo: ownerData.profilePicture });
          } else {
            console.warn("Owner document does not exist"); // Debug log
          }
        }
      } else {
        console.warn("Project document does not exist"); // Debug log
      }
    };

    fetchProject();
  }, [projectId]);

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Box display="flex">
      <SideBar />
      <Box flexGrow={1}>
        <NavBar />
        <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
          <Card sx={{ display: 'flex', maxWidth: 800, width: '100%' }}>
            <CardMedia
              component="img"
              sx={{ width: 300 }}
              image={project.thumbnailURL || "/default-thumbnail.jpg"}
              alt={project.title}
            />
            <CardContent sx={{ flex: 1 }}>
              <Box display="flex" flexDirection="column" height="100%">
                <Box mb={2}>
                  <Typography variant="h5" component="div">
                    {project.title}
                  </Typography>
                  <Typography variant="body1" color="text.primary" paragraph>
                    {project.description}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar src={channel.logo || "/default-profile.png"} alt="Channel Logo" sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {channel.name}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mt="auto">
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => window.open(downloadURL, "_blank")}
                    disabled={!downloadURL}
                  >
                    Download Project
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => window.open(project.editorLink, "_blank")}>
                    Open In Editor
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ViewProject;
