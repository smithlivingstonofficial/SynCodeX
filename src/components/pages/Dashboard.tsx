import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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

interface TeamMetrics {
  totalTeams: number;
  totalMembers: number;
  activeProjects: number;
}

interface CommunityMetrics {
  totalQuestions: number;
  totalAnswers: number;
  totalUpvotes: number;
}

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0,
    projectCount: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
    totalTeams: 0,
    totalMembers: 0,
    activeProjects: 0
  });
  const [communityMetrics, setCommunityMetrics] = useState<CommunityMetrics>({
    totalQuestions: 0,
    totalAnswers: 0,
    totalUpvotes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const analytics = getAnalytics();
    logEvent(analytics, 'dashboard_view');

    const fetchData = async () => {
      try {
        // Fetch project analytics
        const projectsRef = collection(db, 'projects');
        const userProjectsQuery = query(
          projectsRef,
          where('userId', '==', auth.currentUser?.uid)
        );

        const unsubscribe = onSnapshot(userProjectsQuery, async (snapshot) => {
          try {
            if (!snapshot.docs) {
              throw new Error('No project data available');
            }

            const projectsData = snapshot.docs.map(doc => {
              const data = doc.data();
              if (!data) {
                console.warn(`Invalid data for project ${doc.id}`);
                return null;
              }
              return {
                id: doc.id,
                ...data,
              };
            }).filter(Boolean) as Project[];

            const analyticsData: Analytics = {
              totalLikes: projectsData.reduce((acc, project) => {
                if (!Array.isArray(project.likes)) {
                  console.warn(`Invalid likes data for project ${project.id}`);
                  return acc;
                }
                return acc + (project.likes?.length || 0);
              }, 0),
              totalViews: projectsData.reduce((acc, project) => {
                const views = Number(project.views);
                if (isNaN(views)) {
                  console.warn(`Invalid views data for project ${project.id}`);
                  return acc;
                }
                return acc + views;
              }, 0),
              totalComments: projectsData.reduce((acc, project) => {
                const comments = Number(project.commentCount);
                if (isNaN(comments)) {
                  console.warn(`Invalid comment count for project ${project.id}`);
                  return acc;
                }
                return acc + comments;
              }, 0),
              projectCount: projectsData.length
            };

            setProjects(projectsData);
            setAnalytics(analyticsData);

            // Fetch team metrics
            const teamsRef = collection(db, 'teams');
            const userTeamsQuery = query(teamsRef, where('members', 'array-contains', auth.currentUser?.uid));
            try {
              const teamsSnapshot = await getDocs(userTeamsQuery);
              
              const teamMetricsData: TeamMetrics = {
                totalTeams: teamsSnapshot.size,
                totalMembers: teamsSnapshot.docs.reduce((acc, doc) => {
                  const members = doc.data().members;
                  if (!members || typeof members !== 'object') {
                    console.warn(`Invalid members data for team ${doc.id}`);
                    return acc;
                  }
                  return acc + Object.keys(members).length;
                }, 0),
                activeProjects: teamsSnapshot.docs.reduce((acc, doc) => {
                  const projects = doc.data().projects;
                  if (!Array.isArray(projects)) {
                    console.warn(`Invalid projects data for team ${doc.id}`);
                    return acc;
                  }
                  return acc + projects.length;
                }, 0)
              };
              setTeamMetrics(teamMetricsData);

              // Fetch community metrics
              const questionsRef = collection(db, 'questions');
              const userQuestionsQuery = query(questionsRef, where('authorId', '==', auth.currentUser?.uid));
              const questionsSnapshot = await getDocs(userQuestionsQuery);

              const answersPromises = questionsSnapshot.docs.map(async (doc) => {
                try {
                  return await getDocs(collection(db, 'questions', doc.id, 'answers'));
                } catch (err) {
                  console.warn(`Failed to fetch answers for question ${doc.id}:`, err);
                  return null;
                }
              });

              const answersSnapshots = (await Promise.all(answersPromises)).filter(Boolean);

              const communityMetricsData: CommunityMetrics = {
                totalQuestions: questionsSnapshot.size,
                totalAnswers: answersSnapshots.reduce((acc, snapshot) => acc + (snapshot?.size || 0), 0),
                totalUpvotes: questionsSnapshot.docs.reduce((acc, doc) => {
                  const upvotes = doc.data().upvotes;
                  if (typeof upvotes !== 'number') {
                    console.warn(`Invalid upvotes data for question ${doc.id}`);
                    return acc;
                  }
                  return acc + upvotes;
                }, 0)
              };
              setCommunityMetrics(communityMetricsData);

            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
              console.error('Error fetching team/community metrics:', errorMessage);
              setError(`Failed to load metrics: ${errorMessage}`);
            }
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error processing data:', err);
            setError('Failed to process dashboard data');
            setLoading(false);
          }
        }, (err) => {
          console.error('Snapshot error:', err);
          setError('Failed to load dashboard data');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
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

          {/* Project Analytics */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Project Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          </div>

          {/* Team Metrics */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Team Collaboration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Teams Joined</h3>
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamMetrics.totalTeams}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Team Members</h3>
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamMetrics.totalMembers}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Projects</h3>
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{teamMetrics.activeProjects}</p>
              </div>
            </div>
          </div>

          {/* Community Engagement */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Community Engagement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Questions Asked</h3>
                  <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{communityMetrics.totalQuestions}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Answers Received</h3>
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{communityMetrics.totalAnswers}</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Upvotes</h3>
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{communityMetrics.totalUpvotes}</p>
              </div>
            </div>
          </div>

          {/* Project Performance Table */}
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