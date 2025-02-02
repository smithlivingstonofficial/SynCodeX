import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { Card, CardActionArea, CardContent, CardMedia, Typography, Avatar, Box } from '@mui/material'; // MUI imports

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const [thumbnailURL, setThumbnailURL] = useState("/default-thumbnail.jpg");

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

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <Card onClick={handleClick} sx={{ maxWidth: 345 }}>
      <CardActionArea>
        <CardMedia
          component="img"
          height="140"
          image={thumbnailURL}
          alt={project.title}
        />
        <CardContent>
          <Box display="flex" alignItems="center">
            <Avatar src={project.profilePicture || "/default-profile.png"} alt="Channel Profile" />
            <Box ml={2}>
              <Typography variant="h6" component="div">
                {project.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {project.channelName}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProjectCard;
