import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { BsDownload, BsGlobe } from 'react-icons/bs';

export default function ProjectView() {
  const { username } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!username) return;

      try {
        const db = getFirestore();
        
        // First, find the user's profile to get their userId
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('username', '==', username));
        const profileSnapshot = await getDocs(q);
        
        if (profileSnapshot.empty) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const userId = profileSnapshot.docs[0].id;
        
        // Then, fetch their projects
        const projectsRef = collection(db, 'projects');
        const projectQuery = query(projectsRef, where('userId', '==', userId));
        const projectSnapshot = await getDocs(projectQuery);
        
        if (projectSnapshot.empty) {
          setError('No projects found');
          setLoading(false);
          return;
        }

        // Get the first project (or you could add additional logic to get a specific project)
        const projectData = {
          id: projectSnapshot.docs[0].id,
          ...projectSnapshot.docs[0].data()
        };

        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Project Header */}
          <div className="relative h-64">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-xl">No thumbnail</span>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">{project.title}</h1>
              <span className={`px-3 py-1 rounded-full ${project.visibility === 'public' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {project.visibility}
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Description</h2>
              <p className="text-gray-400">{project.description}</p>
            </div>

            {project.programmingLanguages?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {project.programmingLanguages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {project.sourceCodeUrl && (
                <a
                  href={project.sourceCodeUrl}
                  download
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <BsDownload className="w-5 h-5 mr-2" />
                  Download Source Code
                </a>
              )}
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <BsGlobe className="w-5 h-5 mr-2" />
                  Visit Project
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}