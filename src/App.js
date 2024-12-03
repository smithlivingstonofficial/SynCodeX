import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignUp from './SignUp'; // Ensure the correct path
import Dashboard from './Dashboard/Dashboard'; // Updated path to match file name
import Projects from './Projects/Projects'; // Import the Projects component
import { auth } from './FirebaseConfig'; // Ensure the correct path
import { ThemeProvider } from './ThemeProvider'; // Import ThemeProvider

export default function AppWrapper() {
  const [user, setUser ] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser ) => {
      setUser (currentUser );
      setLoading(false); // Set loading to false when authentication state is determined
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading state while checking auth status
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SignUp setUser ={setUser } />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
          <Route path="/projects" element={user ? <Projects /> : <Navigate to="/" />} /> {/* Add Projects route */}
          <Route path="*" element={<Navigate to="/" />} /> {/* Fallback route */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}