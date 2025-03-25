import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import ProjectDropdown from '../shared/ProjectDropdown';

interface Channel {
  name: string;
  handle: string;
  logoUrl: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: Date;
  visibility: string;
  userId: string;
  programmingLanguages: string[];
  channel?: Channel;
}

interface DropdownState {
  isOpen: boolean;
  projectId: string;
  position: { top: number; left: number };
}

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarState');
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropdownState, setDropdownState] = useState<DropdownState>({
    isOpen: false,
    projectId: '',
    position: { top: 0, left: 0 }
  });

  const handleMenuClick = useCallback((e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    setDropdownState({
      isOpen: true,
      projectId,
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left - 180 + rect.width
      }
    });
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setDropdownState(prev => ({ ...prev, isOpen: false }));
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarOpen((prev: boolean) => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  useEffect(() => {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('visibility', '==', 'public')
    );

    const unsubscribe = onSnapshot(projectsQuery, 
      async (snapshot) => {
        const projectsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const channelDoc = await getDoc(doc(db, 'channels', data.userId));
          const channelData = channelDoc.exists() ? channelDoc.data() as Channel : undefined;
          
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            channel: channelData
          } as Project;
        }));
        setProjects(projectsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching projects:', error);
        setError('Failed to load projects. Please try again later.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-red-500 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />

      {/* Main Content */}
      <main className={`pt-14 transition-all duration-200 bg-white dark:bg-gray-950 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/${project.id}`}
              className="block bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 relative">
                {project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                      {project.channel?.logoUrl ? (
                        <img 
                          src={project.channel.logoUrl} 
                          alt={project.channel.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-full h-full text-gray-400 p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 dark:text-white font-medium truncate">{project.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">@{project.channel?.handle || 'anonymous'}</p>
                    </div>
                  </div>
                  <button 
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
                    onClick={(e) => handleMenuClick(e, project.id)}
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {project.programmingLanguages?.[0] && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      {project.programmingLanguages[0]}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <ProjectDropdown
          projectId={dropdownState.projectId}
          isOpen={dropdownState.isOpen}
          onClose={handleCloseDropdown}
          position={dropdownState.position}
        />
      </main>
    </div>
  );
};

export default Home;