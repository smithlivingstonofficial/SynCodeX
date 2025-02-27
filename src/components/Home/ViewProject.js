import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth, storage } from "../../firebase/config";
import { doc as firestoreDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";
import { Box, Button, Card, CardContent, CardMedia, Typography, Avatar, IconButton, Container, TextField, Paper, Grid, InputAdornment } from '@mui/material'; // MUI imports
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendIcon from '@mui/icons-material/Send';
import SideBar from '../Shared/Sidebar'; 
import NavBar from '../Shared/Navbar'; 

const ViewProject = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [downloadURL, setDownloadURL] = useState("");
  const [channel, setChannel] = useState({ channelName: "", profilePicture: "", description: "" });
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    const fetchProject = async () => {
      const docRef = firestoreDoc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const projectData = docSnap.data();
        setProject(projectData);

        // Set like count and check if the user has liked the project
        setLikeCount(projectData.likes ? projectData.likes.length : 0);
        setIsLiked(projectData.likes && projectData.likes.includes(userId));

        // Fetch the download URL from Firebase Storage if downloadPath is defined
        if (projectData.downloadPath) {
          const fileRef = storageRef(storage, `projects/${projectId}/${projectData.downloadPath}`);
          try {
            const url = await getDownloadURL(fileRef);
            setDownloadURL(url);
          } catch (error) {
            console.error("Error fetching download URL:", error);
          }
        }

        // Fetch the channel information using ownerId
        if (projectData.ownerId) {
          const ownerRef = firestoreDoc(db, "users", projectData.ownerId);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            const ownerData = ownerSnap.data();
            setChannel({ channelName: ownerData.channelName, profilePicture: ownerData.profilePicture, description: ownerData.description });
          }
        }
      }
    };

    const fetchComments = () => {
      const commentsRef = collection(db, "projects", projectId, "comments");
      const q = query(commentsRef, orderBy("timestamp", "desc"));
      onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentsData);
      });
    };

    fetchProject();
    fetchComments();
  }, [projectId, userId]);

  const handleDownload = async () => {
    if (!downloadURL) {
      console.error("Download URL is not available");
      return;
    }
    try {
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = project.downloadPath.split('/').pop(); // Use the file name from the download path
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  const handleLikeClick = async () => {
    if (!userId) {
      alert("You must be logged in to like a project.");
      return;
    }

    const projectRef = firestoreDoc(db, "projects", projectId);

    try {
      if (isLiked) {
        // If the project is already liked, remove the like
        await updateDoc(projectRef, {
          likes: arrayRemove(userId), // Remove the user's ID from the "likes" array
        });
        setIsLiked(false); // Update the local state
        setLikeCount(likeCount - 1); // Decrease the like count
      } else {
        // If the project is not liked, add the like
        await updateDoc(projectRef, {
          likes: arrayUnion(userId), // Add the user's ID to the "likes" array
        });
        setIsLiked(true); // Update the local state
        setLikeCount(likeCount + 1); // Increase the like count
      }
    } catch (error) {
      console.error("Error updating like status:", error);
      alert("Failed to update like status. Error: " + error.message);
    }
  };

  const handleAddComment = async () => {
    if (!userId) {
      alert("You must be logged in to comment.");
      return;
    }

    const commentsRef = collection(db, "projects", projectId, "comments");
    try {
      await addDoc(commentsRef, {
        text: newComment,
        userId: userId,
        userName: user.displayName,
        userPhoto: user.photoURL,
        timestamp: new Date(),
        replyTo: replyTo ? replyTo.id : null
      });
      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Error: " + error.message);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <Box display="flex" mt={3}>
      <SideBar />
      <Box flexGrow={1}>
        <NavBar />
        <Container maxWidth="lg">
          <Grid container spacing={3} mt={5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ display: 'flex', flexDirection: 'column', width: '100%', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  sx={{ width: '100%', height: { xs: 200, md: 300 }, objectFit: 'cover' }}
                  image={project.thumbnailURL || "/default-thumbnail.jpg"}
                  alt={project.title}
                />
                <CardContent sx={{ flex: 1 }}>
                  <Box display="flex" flexDirection="column" height="100%">
                    <Box mb={2}>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {project.title}
                      </Typography>
                      <Typography variant="body1" color="text.primary" paragraph>
                        {project.description}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar src={channel.profilePicture || "/default-profile.png"} alt="Channel Logo" sx={{ mr: 2 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {channel.channelName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {channel.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" mb={2}>
                      <IconButton onClick={handleLikeClick} color="primary">
                        {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <Typography variant="body2" color="text.secondary">
                        {likeCount} {likeCount === 1 ? "like" : "likes"}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mt="auto">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleDownload}
                        disabled={!downloadURL}
                        sx={{ mr: 2 }}
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
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ maxHeight: '70vh', overflowY: 'auto', p: 2 }}>
                <Typography variant="h6" gutterBottom>Comments</Typography>
                {replyTo && (
                  <Box mb={2} p={2} sx={{ border: '1px solid #ccc', borderRadius: 2, backgroundColor: '#f0f0f0' }}>
                    <Typography variant="body2" color="text.secondary">
                      Replying to: {replyTo.userName}
                    </Typography>
                    <Typography variant="body1">{replyTo.text}</Typography>
                    <Button size="small" onClick={() => setReplyTo(null)}>Cancel Reply</Button>
                  </Box>
                )}
                <Box mb={2}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    multiline
                    rows={2}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton color="primary" onClick={handleAddComment}>
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                {comments.map((comment) => (
                  <Box key={comment.id} mb={2} p={2} sx={{ border: '1px solid #ccc', borderRadius: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Avatar src={comment.userPhoto || "/default-profile.png"} alt={comment.userName} sx={{ mr: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {comment.userName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatTimestamp(comment.timestamp)}
                      </Typography>
                    </Box>
                    <Typography variant="body1">{comment.text}</Typography>
                    <Button size="small" onClick={() => handleReply(comment)}>Reply</Button>
                    {comment.replyTo && (
                      <Box mt={2} ml={4} p={2} sx={{ border: '1px solid #ccc', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
                        <Typography variant="body2" color="text.secondary">
                          Replying to: {comments.find(c => c.id === comment.replyTo)?.userName}
                        </Typography>
                        <Typography variant="body1">{comments.find(c => c.id === comment.replyTo)?.text}</Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ViewProject;
