import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { BsThreeDotsVertical } from 'react-icons/bs';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Discover Projects</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400">No thumbnail</span>
                </div>
              )}
              
              <div className="p-4">
                <h2 className="text-xl font-semibold text-white mb-2">{project.title}</h2>
                <p className="text-gray-400 mb-4">By {project.username}</p>
                
                <div className="flex flex-wrap gap-2">
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