import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { BsDownload, BsGlobe } from 'react-icons/bs';
import { jellyTriangle } from 'ldrs';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

jellyTriangle.register();

export default function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProjectAndChannel = async () => {
      if (!projectId) return;

      try {
        const db = getFirestore();
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          setError('Project not found');
          return;
        }

        const projectData = {
          id: projectSnap.id,
          ...projectSnap.data()
        };

        // Check project visibility
        if (projectData.visibility === 'private' && (!user || user.uid !== projectData.userId)) {
          setError('You do not have permission to view this project');
          return;
        }

        setProject(projectData);

        // Fetch channel info
        if (projectData.userId) {
          const channelRef = doc(db, 'profiles', projectData.userId);
          const channelSnap = await getDoc(channelRef);
          if (channelSnap.exists()) {
            setChannelInfo(channelSnap.data());
          }
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndChannel();
  }, [projectId, user]);

  const handleChannelClick = () => {
    if (channelInfo?.username) {
      navigate(`/channel/${channelInfo.username}`);
    }
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

  if (error) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-64'} flex items-center justify-center transition-all duration-300`}>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-64'} flex items-center justify-center transition-all duration-300`}>
        <div className="text-white">Project not found</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Project Header */}
          <div className="relative h-0 pb-[56.25%]">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-xl">No thumbnail</span>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4">{project.title}</h1>
                {/* Channel Info */}
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleChannelClick}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                    {channelInfo?.photoURL ? (
                      <img
                        src={channelInfo.photoURL}
                        alt={channelInfo?.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400">
                        {channelInfo?.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{channelInfo?.displayName || 'Unknown User'}</h3>
                    <p className="text-gray-400 text-sm">@{channelInfo?.username}</p>
                  </div>
                </div>
              </div>
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