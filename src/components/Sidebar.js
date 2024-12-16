import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  return (
    <aside className={`sidebar ${isSidebarOpen ? 'expanded' : 'collapsed'}`}>
      <nav>
        <ul>
          <li>
            <a 
              href="/dashboard" 
              className={location.pathname === '/dashboard' ? 'active' : ''}
              onClick={() => navigate('/dashboard')}
            >
              <i className="bx bxs-dashboard"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a 
              href="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              <i className="bx bx-home-circle"></i>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a 
              href="/projects" 
              className={location.pathname === '/projects' ? 'active' : ''}
              onClick={() => navigate('/projects')}
            >
              <i className="bx bx-carousel"></i>
              <span>Projects</span>
            </a>
          </li>
          <li>
            <a 
              href="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              <i className="bx bx-collection"></i>
              <span>Colab</span>
            </a>
          </li>
          <li>
            <a 
              href="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              <i className="bx bx-cloud-download"></i>
              <span>Approval Requests</span>
            </a>
          </li>
          <li>
            <a 
              href="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              <i className="bx bx-chat"></i>
              <span>Community</span>
            </a>
          </li>
          <li>
            <a 
              href="/" 
              className={location.pathname === '/' ? 'active' : ''}
              onClick={() => navigate('/')}
            >
              <i className="bx bx-cog"></i>
              <span>Account</span>
            </a>
          </li>
          <li>
            <a href="/" data-resize-btn onClick={toggleSidebar}>
              <i className="bx bx-chevrons-right"></i>
              <span>{isSidebarOpen ? 'Collapse' : 'Expand'}</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;