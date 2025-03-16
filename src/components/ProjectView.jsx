import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { BsDownload, BsGlobe, BsHeart, BsHeartFill, BsCode } from 'react-icons/bs';
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
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    if (!projectId) return;

    const db = getFirestore();
    const projectRef = doc(db, 'projects', projectId);

    // Set up real-time listener for project data
    const unsubscribeProject = onSnapshot(projectRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      const projectData = {
        id: snapshot.id,
        ...snapshot.data()
      };

      // Check project visibility
      if (projectData.visibility === 'private' && (!user || user.uid !== projectData.userId)) {
        setError('You do not have permission to view this project');
        setLoading(false);
        return;
      }

      setProject(projectData);
      setIsLiked(projectData.likes?.includes(user?.uid));

      // Fetch channel info
      if (projectData.userId) {
        try {
          const channelRef = doc(db, 'profiles', projectData.userId);
          const channelSnap = await getDoc(channelRef);
          if (channelSnap.exists()) {
            setChannelInfo(channelSnap.data());
          }
        } catch (error) {
          console.error('Error fetching channel info:', error);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching project:', error);
      setError('Failed to load project');
      setLoading(false);
    });

    return () => {
      unsubscribeProject();
    };
  }, [projectId, user]);

  useEffect(() => {
    if (!projectId) return;

    const db = getFirestore();
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = [];
      snapshot.forEach((doc) => {
        commentsData.push({ id: doc.id, ...doc.data() });
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/');
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setCommentError('Please enter a comment');
      return;
    }

    if (trimmedComment.length > 500) {
      setCommentError('Comment must be less than 500 characters');
      return;
    }

    try {
      setCommentError('');
      const db = getFirestore();
      const commentsRef = collection(db, 'comments');
      await addDoc(commentsRef, {
        projectId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL,
        content: trimmedComment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('Failed to post comment. Please try again.');
    }
  };

  const handleChannelClick = () => {
    if (channelInfo?.username) {
      navigate(`/channel/${channelInfo.username}`);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const db = getFirestore();
      const projectRef = doc(db, 'projects', projectId);
      
      // Optimistically update UI
      setIsLiked(!isLiked);
      
      if (isLiked) {
        await updateDoc(projectRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(projectRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      console.error('Error updating like:', error);
      alert('Failed to update like. Please try again.');
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
                    <div className="flex items-center gap-4 mb-4">
                      <h1 className="text-3xl font-bold text-white">{project.title}</h1>
                      <button
                        onClick={handleLike}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        {isLiked ? (
                          <BsHeartFill className="w-6 h-6 text-red-500" />
                        ) : (
                          <BsHeart className="w-6 h-6" />
                        )}
                        <span>{project.likes?.length || 0}</span>
                      </button>
                    </div>
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
                  <button
                    onClick={() => navigate(`/editor/${projectId}`)}
                    className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <BsCode className="w-5 h-5 mr-2" />
                    Open Editor
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Comments</h2>
              
              {/* Comment Form */}
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex flex-col gap-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-700 text-white rounded-lg p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {commentError && (
                    <p className="text-red-500 text-sm">{commentError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-700 pb-6 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {comment.userPhotoURL ? (
                          <img
                            src={comment.userPhotoURL}
                            alt={comment.userDisplayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400">
                            {comment.userDisplayName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{comment.userDisplayName}</span>
                          <span className="text-sm text-gray-400">
                            {new Date(comment.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-300 break-words">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}