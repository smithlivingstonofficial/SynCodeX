import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, List, ListItem, ListItemIcon, ListItemText, Drawer, Divider, Tooltip } from "@mui/material";
import { Home as HomeIcon, Dashboard as DashboardIcon, Work as WorkIcon, People as PeopleIcon, Code as CodeIcon, BarChart as BarChartIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import "./Sidebar.css";

export const drawerWidth = 240;
export const collapsedDrawerWidth = 60;

const Sidebar = ({ open }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const menuItems = [
    { name: "Home", path: "/home", icon: <HomeIcon /> },
    { name: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { name: "Projects", path: "/projects", icon: <WorkIcon /> },
    { name: "Collab", path: "/Collab", icon: <PeopleIcon /> },
    { name: "Editor", path: "/editor", icon: <CodeIcon /> },
    { name: "Analytics", path: "/analytics", icon: <BarChartIcon /> },
    { name: "Settings", path: "/settings", icon: <SettingsIcon /> },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : collapsedDrawerWidth,
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Divider />
        <List>
          {menuItems.map((item, index) => (
            <Tooltip title={open ? "" : item.name} placement="right" key={index}>
              <ListItem button onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                {open && <ListItemText primary={item.name} />}
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
