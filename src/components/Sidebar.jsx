import { AiFillHome, AiFillSetting } from 'react-icons/ai';
import { MdHistory, MdFavorite } from 'react-icons/md';
import { FaCode, FaProjectDiagram } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/', icon: AiFillHome, label: 'Home' },
    { path: '/projects', icon: FaProjectDiagram, label: 'Projects' },
    { path: '/code', icon: FaCode, label: 'Code' },
    { path: '/history', icon: MdHistory, label: 'History' },
    { path: '/favorites', icon: MdFavorite, label: 'Favorites' },
    { path: '/settings', icon: AiFillSetting, label: 'Settings' },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#0f0f0f] border-r border-gray-800 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <Icon className="w-6 h-6 min-w-[24px]" />
                  <span className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-4 -right-3 p-1 bg-gray-800 text-white rounded-full border border-gray-700 hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? <BsChevronRight size={16} /> : <BsChevronLeft size={16} />}
      </button>
    </aside>
  );
}