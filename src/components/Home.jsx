import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { jellyTriangle } from 'ldrs';
import { useSidebar } from '../contexts/SidebarContext';

jellyTriangle.register();

export default function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const { isCollapsed } = useSidebar();
  const db = getFirestore();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('visibility', '==', 'public'));
        const querySnapshot = await getDocs(q);
        
        const projectsData = [];
        for (const docSnap of querySnapshot.docs) {
          const project = {
            id: docSnap.id,
            ...docSnap.data()
          };
          
          // Fetch user profile for each project
          try {
            const userProfileRef = doc(db, 'profiles', project.userId);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
              project.userProfile = userProfileSnap.data();
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            project.userProfile = null;
          }
          
          projectsData.push(project);
        }
        
        setProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [db]);

  const handleMenuClick = (project) => {
    setSelectedProject(selectedProject?.id === project.id ? null : project);
  };

  const handleCopyLink = (projectId) => {
    const projectLink = `${window.location.origin}/project/${projectId}`;
    navigator.clipboard.writeText(projectLink);
    alert('Project link copied to clipboard!');
    setSelectedProject(null);
  };

  const handleProfileClick = (username) => {
    if (username) {
      navigate(`/channel/${username}`);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-16' : 'pl-64'} flex items-center justify-center transition-all duration-300`}>
        <l-jelly-triangle
          size="40"
          speed="1.75"
          color="white"
        ></l-jelly-triangle>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-16' : 'md:pl-64'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Discover Projects</h1>
        
        {projects.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No projects available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => handleProjectClick(project.id)}
              >
                <div className="relative pt-[56.25%]">
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
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(project.userProfile?.username);
                        }}
                        className="cursor-pointer"
                      >
                        {project.userProfile?.photoURL ? (
                          <img
                            src={project.userProfile.photoURL}
                            alt="Profile"
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white">
                            {project.userProfile?.displayName?.[0].toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-white font-medium">{project.title}</h3>
                        <p
                          className="text-gray-400 text-sm cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProfileClick(project.userProfile?.username);
                          }}
                        >
                          @{project.userProfile?.username || 'unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(project);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                      >
                        <BsThreeDotsVertical />
                      </button>

                      {selectedProject?.id === project.id && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCopyLink(project.id)}
                            className="w-full px-4 py-2 text-left text-white hover:bg-gray-600 transition-colors"
                          >
                            Copy Project Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}