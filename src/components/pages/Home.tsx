import { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen(prev => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />

      {/* Main Content */}
      <main className={`pt-14 transition-all duration-200 bg-gray-950 ${isSidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {/* Video Cards */}
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="bg-gray-900 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-200 shadow-lg">
              <div className="aspect-video bg-gray-800"></div>
              <div className="p-3 space-y-1.5">
                <h3 className="text-white font-medium line-clamp-2">Video Title {index + 1}</h3>
                <p className="text-gray-400 text-sm">Channel Name</p>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>123K views</span>
                  <span>•</span>
                  <span>2 days ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;