import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface ProjectData {
  projectId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadedAt: any;
  userId: string;
  programmingLanguages: string[];
  visibility: string;
  tags: string[];
  likes?: string[];
}

interface ChannelData {
  name: string;
  handle: string;
  logoUrl: string;
}

const ProjectView = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const fetchProjectAndChannel = async () => {
      if (!projectId) return;

      try {
        // Fetch project data
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          setError('Project not found');
          setLoading(false);
          return;
        }

        const projectData = projectDoc.data() as ProjectData;
        setProject(projectData);
        setLikeCount(projectData.likes?.length || 0);
        setIsLiked(projectData.likes?.includes(auth.currentUser?.uid || '') || false);

        // Fetch channel data
        const channelDoc = await getDoc(doc(db, 'channels', projectData.userId));
        if (channelDoc.exists()) {
          setChannel(channelDoc.data() as ChannelData);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndChannel();
  }, [projectId]);

  const handleLike = async () => {
    if (!auth.currentUser || !projectId || likeLoading) return;

    setLikeLoading(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      const userId = auth.currentUser.uid;

      if (isLiked) {
        await updateDoc(projectRef, {
          likes: arrayRemove(userId)
        });
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(projectRef, {
          likes: arrayUnion(userId)
        });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error('Error updating like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">{error || 'Project not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30">
            {/* Project Thumbnail */}
            {project.thumbnailUrl && (
              <div className="relative w-full h-[400px] mb-6 rounded-xl overflow-hidden">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Project Title and Like Button */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {project.uploadedAt?.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={handleLike}
                disabled={!auth.currentUser || likeLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${isLiked ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
              >
                <svg
                  className={`w-5 h-5 ${isLiked ? 'fill-current' : 'stroke-current fill-none'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{likeCount}</span>
              </button>
            </div>

            {/* Project Description */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* Channel Profile */}
            {channel && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-6 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors cursor-pointer">
                <Link to={`/channel/${channel.handle}`} className="flex items-center space-x-4 flex-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img
                      src={channel.logoUrl || '/default-avatar.png'}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      {channel.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      @{channel.handle}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {project.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Programming Languages */}
            <div className="flex flex-wrap gap-2">
              {project.programmingLanguages.map((lang, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;