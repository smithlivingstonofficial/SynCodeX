import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import CommentSection from '../shared/CommentSection';
import { useProjectViews } from '../../hooks/useProjectViews';

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
  const { viewCount } = useProjectViews(projectId || '');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchProjectAndChannel = async () => {
      if (!projectId) return;

      try {
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
        <div className="pl-[var(--sidebar-width)] md:pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
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
        <div className="pl-[var(--sidebar-width)] md:pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
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
      <div className="pl-0 md:pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-[1920px] mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700/30">
            {/* Project Thumbnail */}
            {project.thumbnailUrl && (
              <div className="relative w-full h-[200px] md:h-[400px] mb-4 md:mb-6 rounded-lg md:rounded-xl overflow-hidden">
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Project Title and Like/Comment Buttons */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-4 md:mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {project.title}
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                  <span>{project.uploadedAt?.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{viewCount} views</span>
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleLike}
                  disabled={!auth.currentUser || likeLoading}
                  className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${isLiked ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 w-full md:w-auto`}
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
                {auth.currentUser?.uid === project.userId && (
                  <Link
                    to={`/projects/${projectId}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-200 w-full md:w-auto"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </Link>
                )}
                <button
                  onClick={() => setShowComments(true)}
                  className="lg:hidden flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105 transition-all duration-200 w-full md:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comments</span>
                </button>
              </div>
            </div>

            {/* Project Description */}
            <div className="prose dark:prose-invert max-w-none mb-4 md:mb-6">
              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* Channel Profile */}
            {channel && (
              <div className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:rounded-xl mb-4 md:mb-6 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors cursor-pointer">
                <Link to={`/channel/${channel.handle}`} className="flex items-center space-x-3 md:space-x-4 flex-1">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={channel.logoUrl || '/default-avatar.png'}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      {channel.name}
                    </h3>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Comments Section - Desktop */}
          <div className="hidden lg:block sticky top-[calc(3.5rem+1.5rem)] h-[calc(100vh-5rem)]">
            <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-200 dark:border-gray-700/30 h-full overflow-hidden">
              <CommentSection projectId={projectId || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* Comments Modal - Mobile */}
      {showComments && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowComments(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-gray-950 rounded-t-2xl max-h-[80vh] flex flex-col transform transition-transform duration-300 ease-out">
            <div className="p-4 flex-1 overflow-hidden">
              <CommentSection projectId={projectId || ''} isModal={true} />
            </div>
          </div>
        </div>
      )}

      {/* Floating Comment Button - Mobile
      <button
        onClick={() => setShowComments(true)}
        className="fixed right-4 bottom-4 lg:hidden z-40 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button> */}
    </div>
  );
};

export default ProjectView;