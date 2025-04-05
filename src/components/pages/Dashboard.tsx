import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface Analytics {
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  projectCount: number;
}

interface Project {
  id: string;
  title: string;
  likes?: string[];
  views?: number;
  commentCount?: number;
}

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    projectCount: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const analytics = getAnalytics();
    logEvent(analytics, 'dashboard_view');

    const fetchAnalytics = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const userProjectsQuery = query(
          projectsRef,
          where('userId', '==', auth.currentUser?.uid)
        );

        const unsubscribe = onSnapshot(userProjectsQuery, async (snapshot) => {
          const projectsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Project[];

          const analyticsData: Analytics = {
            totalLikes: projectsData.reduce((acc, project) => acc + (project.likes?.length || 0), 0),
            totalViews: projectsData.reduce((acc, project) => acc + (project.views || 0), 0),
            totalComments: projectsData.reduce((acc, project) => acc + (project.commentCount || 0), 0),
            projectCount: projectsData.length
          };

          setProjects(projectsData);
          setAnalytics(analyticsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <p className="text-gray-600 dark:text-gray-400">Please sign in to view your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <p className="text-red-500 dark:text-red-400">{error}</p>
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
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Dashboard
          </h1>

          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Projects</h3>
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.projectCount}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Likes</h3>
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalLikes}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Views</h3>
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalViews}</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Comments</h3>
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalComments}</p>
            </div>
          </div>

          {/* Project Performance */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Likes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.likes?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {project.commentCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;