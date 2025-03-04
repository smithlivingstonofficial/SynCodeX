import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { Card, CardActionArea, CardContent, CardMedia, Typography, Avatar, Box, IconButton, Menu, MenuItem } from '@mui/material'; // MUI imports
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Import MoreVertIcon

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const [thumbnailURL, setThumbnailURL] = useState("/default-thumbnail.jpg");
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchThumbnail = async () => {
      const db = getFirestore();
      const docRef = firestoreDoc(db, "projects", project.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setThumbnailURL(docSnap.data().thumbnailURL || "/default-thumbnail.jpg");
      }
    };

    fetchThumbnail();
  }, [project.id]);

  const handleProjectClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleChannelClick = (e) => {
    e.stopPropagation(); // Prevent the project click handler from being triggered
    navigate(`/channel/${project.ownerId}`);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/project/${project.id}`);
    alert("Project link copied to clipboard!");
    handleMenuClose();
  };

  return (
    <Card sx={{ maxWidth: 400, boxShadow: 3, borderRadius: 2, overflow: 'hidden'   }}> {/* Increase the maxWidth and add margin */}
      <CardActionArea onClick={handleProjectClick}>
        <CardMedia
          component="img"
          sx={{ aspectRatio: '16/9', objectFit: 'cover' }} // Set aspect ratio to 16:9
          image={thumbnailURL}
          alt={project.title}
        />
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {project.title}
            </Typography>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleCopyLink}>Copy Link</MenuItem>
            </Menu>
          </Box>
          <Box display="flex" alignItems="center">
            <Avatar 
              src={project.profilePicture || "/default-profile.png"} 
              alt="Channel Profile" 
              onClick={handleChannelClick} 
              sx={{ cursor: 'pointer', width: 40, height: 40, mr: 2 }} 
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              onClick={handleChannelClick} 
              sx={{ cursor: 'pointer' }}
            >
              {project.channelName}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProjectCard;
