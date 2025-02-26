import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Button } from "@mui/material";
import { styled } from "@mui/system";
import "./Navbar.css";
import { drawerWidth, collapsedDrawerWidth } from "./Sidebar";

const NavbarContainer = styled('div')(({ theme }) => ({
  flexGrow: 1,
}));

const UploadButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme?.palette?.primary?.main || "#1976d2",
  color: "white",
  marginRight: theme?.spacing(2) || "16px",
  '&:hover': {
    backgroundColor: theme?.palette?.primary?.dark || "#115293",
  },
}));

const Navbar = ({ toggleTheme, isDarkMode, open, setOpen }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [showDropdown, setShowDropdown] = useState(null); // Change to null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = () => {
    auth.signOut().then(() => navigate("/"));
  };

  const toggleDropdown = (event) => {
    setShowDropdown(event.currentTarget); // Set the anchor element
  };

  const handleClose = () => {
    setShowDropdown(null); // Close the menu
  };

  return (
    <NavbarContainer>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "white",
          width: `calc(100% - ${open ? drawerWidth : collapsedDrawerWidth}px)`,
          ml: `${open ? drawerWidth : collapsedDrawerWidth}px`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "black" }} onClick={() => navigate("/home")} style={{ cursor: 'pointer' }}>
            SynCodeX
          </Typography>
          <UploadButton onClick={() => navigate("/upload")}>
            <img src="assets/icons/upload.png" className="upload-icon" alt="Upload Icon" style={{ marginRight: 8 }} />
            Upload
          </UploadButton>
          {user && (
            <div>
              <IconButton onClick={toggleDropdown} color="inherit">
                <Avatar src={user?.photoURL || "/default-profile.png"} alt="User Profile" />
              </IconButton>
              <Menu
                anchorEl={showDropdown}
                open={Boolean(showDropdown)}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={() => { navigate("/profile"); handleClose(); }}>Profile</MenuItem>
                <MenuItem onClick={() => { toggleTheme(); handleClose(); }}>{isDarkMode ? "Light Theme" : "Dark Theme"}</MenuItem>
                <MenuItem onClick={() => { handleLogout(); handleClose(); }}>Sign Out</MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
      {isDarkMode && <div className="multi-color-separator"></div>}
    </NavbarContainer>
  );
};

export default Navbar;
