import { useState } from 'react';
import { BsSearch, BsBell, BsUpload } from 'react-icons/bs';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const user = auth.currentUser;
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#0f0f0f] border-b border-gray-800 z-50 px-4">
      <div className="flex items-center justify-between h-full max-w-[2100px] mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-white">SynCodeX</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-2 bg-[#121212] text-white rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 pl-10"
            />
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/upload')} 
            className="flex items-center px-4 py-2 text-white border border-gray-700 rounded-full hover:bg-gray-800 transition-colors"
          >
            <BsUpload className="w-5 h-5 mr-2" />
            Upload
          </button>
          
          <button className="relative p-2 text-white hover:bg-gray-800 rounded-full transition-colors">
            <BsBell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {user && user.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={handleProfileClick}
            />
          ) : (
            <div
              className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={handleProfileClick}
            >
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}