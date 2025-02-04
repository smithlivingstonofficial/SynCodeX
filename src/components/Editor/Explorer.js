import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';

const Explorer = () => {
  return (
    <Box width="250px" bgcolor="grey.900" color="white">
      <List>
        <ListItem button>
          <ListItemText primary="File1.js" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="File2.js" />
        </ListItem>
        {/* Add more files as needed */}
      </List>
    </Box>
  );
};

export default Explorer;
