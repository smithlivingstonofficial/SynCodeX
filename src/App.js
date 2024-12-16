import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignUp from './SignUp'; 
import Dashboard from './Dashboard/Dashboard'; 
import Projects from './Projects/Projects'; 
import { auth } from './FirebaseConfig'; 
import { ThemeProvider } from './ThemeProvider'; 

export default function AppWrapper() {
  const [user, setUser ] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state

  useEffect(() => {
    // Check local storage for user details
    const storedUser  = localStorage.getItem('user');
    if (storedUser ) {
      setUser (JSON.parse(storedUser ));
    }

    const unsubscribe = auth.onAuthStateChanged((currentUser ) => {
      if (currentUser ) {
        // Store user details in local storage
        localStorage.setItem('user', JSON.stringify({
          uid: currentUser.uid, 
          displayName: currentUser.displayName, 
          email: currentUser.email, 
          photoURL: currentUser.photoURL, 
        }));
        setUser (currentUser );
      } else {
        // Clear user details from local storage if user is logged out
        localStorage.removeItem('user');
        setUser (null);
      }
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
          <Route path="/projects" element={user ? <Projects user={user} /> : <Navigate to="/" />} /> {/* Pass user to Projects */}
          <Route path="*" element={<Navigate to="/" />} /> {/* Fallback route */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}