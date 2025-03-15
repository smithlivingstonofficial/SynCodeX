import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { jellyTriangle } from 'ldrs';
import { useSidebar } from '../contexts/SidebarContext';

jellyTriangle.register();

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const db = getFirestore();
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('visibility', '==', 'public'));
        const querySnapshot = await getDocs(q);
        
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-80'} flex items-center justify-center transition-all duration-300`}>
        <l-jelly-triangle
          size="40"
          speed="1.75"
          color="white"
        ></l-jelly-triangle>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} transition-all duration-300`}>
      <div className="p-4 md:p-8 lg:p-10">
        <h1 className="text-2xl font-bold text-white mb-8">Discover Projects</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer flex flex-col"
              onClick={() => handleProjectClick(project.id)}
            >
              <div className="relative w-full pt-[56.25%]">
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">No thumbnail</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-2">{project.title}</h2>
                <p className="text-gray-400 mb-4">{project.username}</p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.programmingLanguages?.map((lang, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-700 text-sm text-gray-300 rounded">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}