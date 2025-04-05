import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import SearchBox from './SearchBox';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 z-50 flex items-center px-2 md:px-4 justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500">SynCodeX</span>
        </div>
      </div>

      <div className="hidden md:block flex-1 max-w-2xl mx-4">
        <SearchBox />
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => navigate('/search')}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/upload')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
        >
          {auth.currentUser?.email?.[0].toUpperCase() || 'U'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;