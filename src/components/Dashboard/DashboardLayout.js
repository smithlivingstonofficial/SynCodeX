// It Stores Data's Like Theme, etc...
import React, { useState, useEffect } from "react";
import Navbar from "../Shared/Navbar";
import Sidebar from "../Shared/Sidebar";
import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Load theme preference from localStorage (optional)
    return localStorage.getItem("theme") === "dark";
  });

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      document.body.classList.toggle("dark-mode", newMode);
      localStorage.setItem("theme", newMode ? "dark" : "light"); // Save preference
      return newMode;
    });
  };

  useEffect(() => {
    // Apply the theme on initial load
    document.body.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return (
    <div>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <div className="dashboard-container">
        <Sidebar />
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
