import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", path: "/home" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Projects", path: "/projects" },
    { name: "Collab", path: "/Collab" },    
    { name: "Analytics", path: "/analytics" },
    { name: "Settings", path: "/settings" },
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
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
      <button className="collapse-button" onClick={handleCollapse}>
        {collapsed ? ">" : "<"}
      </button>
    </div>
  );
};

export default Sidebar;
