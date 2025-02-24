import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { Box } from '@mui/material';
import Explorer from './Explorer';
import MenuBar from './MenuBar';
import './Editor.css';

const Editor = () => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.create(editorRef.current, {
        value: '// Start coding...',
        language: 'javascript',
        theme: 'vs-dark',
      });
    }
  }, []);

  return (
    <Box display="flex" height="100vh">        
      <Explorer />
      <Box flexGrow={1} display="flex" flexDirection="column">
        <MenuBar />
        <Box ref={editorRef} flexGrow={1} />
      </Box>
    </Box>
  );
};

export default Editor;
