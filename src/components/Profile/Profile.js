import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { db, storage } from "../../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Container, TextField, Button, Avatar, Typography, Box, CircularProgress, Grid, Paper } from '@mui/material';
import { styled } from '@mui/system';

const Profile = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [profile, setProfile] = useState({
    channelName: "",
    description: "",
    profilePicture: "",
    email: user?.email || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const docRef = doc(db, "channels", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `profilePictures/${user.uid}`);
    setIsLoading(true);

    try {
      // Upload the image to Firebase Storage
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Update Firebase Authentication profile
      await updateProfile(user, { photoURL: url });

      // Reload user to reflect changes in Firebase Authentication
      await auth.currentUser.reload();

      setProfile({ ...profile, profilePicture: url });
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = doc(db, "channels", user.uid);
      await setDoc(docRef, profile, { merge: true });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  if (!user) {
    return <Typography variant="h5" align="center">Please log in to edit your profile.</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>Channel Details</Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Channel Name"
                name="channelName"
                value={profile.channelName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Description"
                name="description"
                value={profile.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  src={profile.profilePicture || "/default-profile.png"}
                  alt="Profile"
                  sx={{ width: 100, height: 100, mb: 2 }}
                />
                <Button variant="contained" component="label">
                  Upload Picture
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                {isLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} display="flex" alignItems="center" justifyContent="center">
              <Button type="submit" variant="contained" color="primary" size="large">
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;
