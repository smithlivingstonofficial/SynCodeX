import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";
import { doc as firestoreDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Box, Container, Grid, Typography, Card, CardActionArea, CardContent, CardMedia, Avatar } from '@mui/material';
import SideBar from '../Shared/Sidebar';
import NavBar from '../Shared/Navbar';

const ChannelPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [channel, setChannel] = useState({ channelName: "", profilePicture: "", description: "" });

  useEffect(() => {
    const fetchChannelInfo = async () => {
      const userRef = firestoreDoc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setChannel({ channelName: userData.channelName, profilePicture: userData.profilePicture, description: userData.description });
      } else {
        console.error("User document does not exist");
      }
    };

    const fetchProjects = async () => {
      const projectsRef = collection(db, "projects");
      const q = query(projectsRef, where("ownerId", "==", userId), where("visibility", "==", "public"));
      const querySnapshot = await getDocs(q);
      const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectsData);
    };

    fetchChannelInfo();
    fetchProjects();
  }, [userId]);

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <Box display="flex" mt={13}>
      <SideBar />
      <Box flexGrow={1}>
        <NavBar />
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar src={channel.profilePicture || "/default-profile.png"} alt="Channel Logo" sx={{ width: 80, height: 80, mr: 2 }} />
            <Box>
              <Typography variant="h4">{channel.channelName}</Typography>
              <Typography variant="body1" color="text.secondary">{channel.description}</Typography>
            </Box>
          </Box>
          <Grid container spacing={3}>
            {projects.map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <CardActionArea onClick={() => handleProjectClick(project.id)}>
                    <CardMedia
                      component="img"
                      sx={{ height: 140 }}
                      image={project.thumbnailURL || "/default-thumbnail.jpg"}
                      alt={project.title}
                    />
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {project.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ChannelPage;
