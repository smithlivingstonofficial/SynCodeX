import { AiFillHome, AiFillSetting } from 'react-icons/ai';
import { MdHistory, MdFavorite } from 'react-icons/md';
import { FaCode, FaProjectDiagram } from 'react-icons/fa';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

export default function Sidebar() {
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const menuItems = [
    { path: '/', icon: AiFillHome, label: 'Home' },
    { path: '/projects', icon: FaProjectDiagram, label: 'Projects' },
    { path: '/editor', icon: FaCode, label: 'Editor' },
    { path: '/history', icon: MdHistory, label: 'History' },
    { path: '/favorites', icon: MdFavorite, label: 'Favorites' },
    { path: '/settings', icon: AiFillSetting, label: 'Settings' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#0f0f0f] border-r border-gray-800 z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-20'}">
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-gray-800 z-40">
        <ul className="flex justify-around items-center h-16">
          {menuItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex flex-col items-center p-2 ${isActive ? 'text-white' : 'text-gray-400'}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}