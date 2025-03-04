import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/config";
import { doc as firestoreDoc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Box, Container, Grid, Typography, Card, CardActionArea, CardContent, CardMedia, Avatar, Button } from '@mui/material';
import SideBar from '../Shared/Sidebar';
import NavBar from '../Shared/Navbar';

const ChannelPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [channel, setChannel] = useState({ channelName: "", profilePicture: "", description: "" });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const userRef = firestoreDoc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log("Fetched channel data:", userData); // Debug log
          setChannel({ channelName: userData.channelName, profilePicture: userData.profilePicture, description: userData.description });
          if (user) {
            const followerRef = firestoreDoc(db, "users", userId, "followers", user.uid);
            const followerSnap = await getDoc(followerRef);
            setIsFollowing(followerSnap.exists());
          }
        } else {
          console.error("User document does not exist");
        }
      } catch (error) {
        console.error("Error fetching channel info: ", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, where("ownerId", "==", userId), where("visibility", "==", "public"));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      }
    };

    fetchChannelInfo();
    fetchProjects();
  }, [userId, user]);

  useEffect(() => {
    console.log("Channel state updated:", channel); // Debug log
  }, [channel]);

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleFollowClick = async () => {
    if (!user) {
      alert("You must be logged in to follow a channel.");
      return;
    }

    const followerRef = firestoreDoc(db, "users", userId, "followers", user.uid);

    try {
      if (isFollowing) {
        // If the user is already following, unfollow
        await deleteDoc(followerRef);
        setIsFollowing(false);
      } else {
        // If the user is not following, follow
        await setDoc(followerRef, { userId: user.uid });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      alert("Failed to update follow status. Error: " + error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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
              <Typography variant="body2" color="text.secondary">{channel.description}</Typography>
            </Box>
            <Button 
              variant={isFollowing ? "contained" : "outlined"} 
              color="primary" 
              onClick={handleFollowClick}
              sx={{ ml: 2 }}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </Box>
          <Typography variant="h5" mb={3}>Channel: {channel.channelName}</Typography>
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
