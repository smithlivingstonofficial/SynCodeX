import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface ChannelData {
  name: string;
  handle: string;
  description: string;
  logoUrl: string;
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
  const { userId } = useParams();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChannelAndProjects = async () => {
      if (!userId) return;

      try {
        // Fetch channel data
        const channelDoc = await getDoc(doc(db, 'channels', userId));
        if (!channelDoc.exists()) {
          setError('Channel not found');
          setLoading(false);
          return;
        }

        setChannel(channelDoc.data() as ChannelData);

        // Fetch channel's public projects
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', userId),
          where('visibility', '==', 'public')
        );

        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          ...doc.data(),
          projectId: doc.id
        })) as Project[];

        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError('Failed to load channel data');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelAndProjects();
  }, [userId]);

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
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        {/* Channel Header */}
        <div className="relative">
          {/* Banner - Using a gradient background as placeholder */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          
          {/* Profile Section */}
          <div className="max-w-6xl mx-auto px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 relative z-10">
              {/* Profile Picture */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800">
                <img
                  src={channel.logoUrl || '/default-avatar.png'}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Channel Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {channel.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-2">@{channel.handle}</p>
                <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
                  {channel.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <a
                key={project.projectId}
                href={`/${project.projectId}`}
                className="block bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700/30"
              >
                {/* Project Thumbnail */}
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 relative">
                  {project.thumbnailUrl ? (
                    <img
                      src={project.thumbnailUrl}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Project Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.programmingLanguages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Channel;