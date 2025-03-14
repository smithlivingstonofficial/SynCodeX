import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../firebase';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!auth.currentUser) return;

      try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const projectsData = [];
        for (const doc of querySnapshot.docs) {
          projectsData.push({
            id: doc.id,
            ...doc.data()
          });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-white mb-8">My Projects</h1>
        
        {projects.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            You haven't uploaded any projects yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-gray-800 rounded-lg overflow-hidden">
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{project.title}</h3>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuClick(project)}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                      >
                        <BsThreeDotsVertical />
                      </button>

                      {selectedProject?.id === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded ${project.visibility === 'public' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {project.visibility}
                    </span>
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