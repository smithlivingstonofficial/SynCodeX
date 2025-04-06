import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import { useAuth } from '../../hooks/useAuth';
import Chat from '../chat/Chat';

interface ChannelData {
  name: string;
  handle: string;
  description: string;
  logoUrl: string;
  id?: string;
}

interface Project {
  projectId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadedAt: any;
  programmingLanguages: string[];
  tags: string[];
  likes: string[];
}

const Channel = () => {
  const { handle } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchChannelAndProjects = async () => {
      if (!handle) return;

      try {
        // Fetch channel data by handle
        const channelsRef = collection(db, 'channels');
        const q = query(channelsRef, where('handle', '==', handle.replace('@', '')));
        const channelSnapshot = await getDocs(q);

        if (channelSnapshot.empty) {
          setError('Channel not found');
          setLoading(false);
          return;
        }

        const channelDoc = channelSnapshot.docs[0];
        const channelData = { ...channelDoc.data(), id: channelDoc.id } as ChannelData;
        setChannel(channelData);

        // Fetch channel's public projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', channelDoc.id),
          where('visibility', '==', 'public')
        );

        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          ...doc.data(),
          projectId: doc.id
        })) as Project[];

        setProjects(projectsData);

        // Fetch followers count
        const followersSnapshot = await getDocs(collection(db, `channels/${channelDoc.id}/followers`));
        setFollowersCount(followersSnapshot.size);

        // Check if current user is following
        if (user) {
          const followerDoc = await getDoc(doc(db, `channels/${channelDoc.id}/followers/${user.uid}`));
          setIsFollowing(followerDoc.exists());
        }
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelAndProjects();
  }, [handle, user]);

  const handleFollowToggle = async () => {
    if (!user || !channel?.id) return;

    setFollowLoading(true);
    try {
      const followerRef = doc(db, `channels/${channel.id}/followers/${user.uid}`);
      const followingRef = doc(db, `channels/${user.uid}/following/${channel.id}`);

      if (isFollowing) {
        await deleteDoc(followerRef);
        await deleteDoc(followingRef);
        setFollowersCount(prev => prev - 1);
      } else {
        await setDoc(followerRef, {
          timestamp: new Date().toISOString()
        });
        await setDoc(followingRef, {
          timestamp: new Date().toISOString()
        });
        setFollowersCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
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

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">{error || 'Channel not found'}</div>
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
        {/* Channel Header */}
        <div className="relative">
          {/* Banner with enhanced gradient and overlay */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMC0yYzguODM3IDAgMTYgNy4xNjMgMTYgMTZzLTcuMTYzIDE2LTE2IDE2LTE2LTcuMTYzLTE2LTE2IDcuMTYzLTE2IDE2LTE2eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          </div>
          
          {/* Profile Section with enhanced layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 relative z-10">
              {/* Profile Picture with enhanced border and shadow */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 hover:scale-105">
                <img
                  src={channel?.logoUrl || '/default-avatar.png'}
                  alt={channel?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Channel Info with improved typography and spacing */}
              <div className="flex-1 w-full md:w-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                      {channel?.name}
                    </h1>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-sm">@{channel?.handle}</span>
                      </span>
                      <span className="h-1 w-1 rounded-full bg-gray-400 dark:bg-gray-600"></span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{followersCount} followers</span>
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 max-w-2xl text-sm md:text-base">
                      {channel?.description}
                    </p>
                  </div>
                  {user && channel?.id !== user.uid && (
                    <div className="flex gap-2 mt-4 md:mt-0">
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 transform hover:scale-105 ${isFollowing ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25'} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                      >
                        {followLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isFollowing ? (
                              <>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Follow</span>
                              </>
                            )}
                          </div>
                        )}
                      </button>
                      {isFollowing && (
                        <button
                          onClick={() => setShowChat(true)}
                          className="px-6 py-2.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Message</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid with enhanced layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Projects</h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No projects</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This channel hasn't uploaded any projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <div
                  key={project.projectId}
                  className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300 transform hover:-translate-y-1"
                >
                  {project.thumbnailUrl && (
                    <div className="aspect-video w-full rounded-t-xl overflow-hidden">
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                      {project.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.programmingLanguages?.map(lang => (
                        <span
                          key={lang}
                          className="px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{project.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        {project.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="ml-2 text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              onClick={() => setShowChat(false)}
            >
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <Chat channelId={channel.id || ''} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;