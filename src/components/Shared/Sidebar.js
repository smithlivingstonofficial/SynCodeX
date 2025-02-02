import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaTachometerAlt, FaProjectDiagram, FaUsers, FaChartLine, FaCog, FaAngleLeft, FaAngleRight } from "react-icons/fa"; // Import icons
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", path: "/home", icon: <FaHome /> },
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
    { name: "Collab", path: "/Collab", icon: <FaUsers /> },
    { name: "Analytics", path: "/analytics", icon: <FaChartLine /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <ul className="menu">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className={`menu-item ${
              window.location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.icon} <span>{item.name}</span>
          </li>
        ))}
      </ul>
      <button className="collapse-button" onClick={handleCollapse}>
        {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
      </button>
    </div>
  );
};

export default Sidebar;
