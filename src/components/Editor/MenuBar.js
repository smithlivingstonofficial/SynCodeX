import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

const MenuBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Code Editor
        </Typography>
        <Button color="inherit">File</Button>
        <Button color="inherit">Edit</Button>
        <Button color="inherit">View</Button>
        {/* Add more menu items as needed */}
      </Toolbar>
    </AppBar>
  );
};

export default MenuBar;
