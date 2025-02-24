// Edit Profile Page
import React, { useState, useEffect } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { db, storage } from "../../firebase/config";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./Profile.css";

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
    return <h1>Please log in to edit your profile.</h1>;
  }

  return (
    <div className="profile-container">
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Channel Name</label>
          <input
            type="text"
            name="channelName"
            value={profile.channelName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={profile.description}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Save Changes</button>
      </form>

      <div className="profile-picture-container">
        <label htmlFor="profile-picture">
          <img
            src={profile.profilePicture || "/default-profile.png"}
            alt="Profile"
          />
        </label>
        <input
          type="file"
          id="profile-picture"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {isLoading && <p>Uploading...</p>}
      </div>
    </div>
  );
};

export default Profile;
