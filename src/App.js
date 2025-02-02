import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Login from "./components/Auth/Login";
import DashboardLayout from "./components/Dashboard/DashboardLayout";
import Dashboard from "./components/Dashboard/Dashboard";
import ProjectUpload from "./components/Projects/ProjectUpload";
import Profile from "./components/Profile/Profile";
import ProjectPage from "./components/Projects/ProjectPage";
import EditProject from "./components/Projects/EditProject";
import HomePage from "./components/Home/HomePage";
import ProjectDetails from "./components/Home/ProjectDetails";
import Collab from "./components/Collab/CollabCreation/CollabCreation";
import Sidebar from "./components/Shared/Sidebar";
import ViewProject from "./components/Home/ViewProject";

function App() {
  const [user, setUser] = useState(null); // State to manage the current user
  const [loading, setLoading] = useState(true); // State to manage loading state

  useEffect(() => {
    const auth = getAuth();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, []);

  // Protect routes that require authentication
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>; // Show a loader while checking authentication
    return user ? children : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <Sidebar />
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/upload" element={<ProtectedRoute><DashboardLayout><ProjectUpload /></DashboardLayout></ProtectedRoute>}/>
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>
        <Route path="/projects" element={<DashboardLayout><ProjectPage /></DashboardLayout>} />
        <Route path="/edit-project/:projectId" element={<DashboardLayout><EditProject /></DashboardLayout>} />
        <Route path="/home" element={<DashboardLayout><HomePage /></DashboardLayout>} />
        <Route path="/collab" element={<DashboardLayout><Collab /></DashboardLayout>} />
        <Route path="/project-details/:id" element={<DashboardLayout><ProjectDetails /></DashboardLayout>} />
        <Route path="/projects/:id" component={ProjectDetails} />
        <Route path="/project/:projectId" element={<ViewProject />} />
      </Routes>
    </Router>
  );
}

export default App;
