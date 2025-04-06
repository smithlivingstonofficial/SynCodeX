import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, Timestamp, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface ProjectData {
  projectId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadedAt: Timestamp;
  userId: string;
  programmingLanguages: string[];
  visibility: string;
  tags: string[];
  likes?: string[];
}

const Projects = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      if (!auth.currentUser) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const projectsRef = collection(db, 'projects');
        const userProjectsQuery = query(
          projectsRef,
          where('userId', '==', auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(userProjectsQuery);
        if (isMounted) {
          const projectsData = querySnapshot.docs.map(doc => ({
            projectId: doc.id,
            ...doc.data()
          })) as ProjectData[];
          setProjects(projectsData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        if (isMounted) {
          setError('Failed to load projects');
          setLoading(false);
        }
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view your projects</p>
            </div>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Project
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">You haven't created any projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Link
                  key={project.projectId}
                  to={`/projects/${project.projectId}`}
                  className="group bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-lg relative"
                >
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <Link
                      to={`/projects/${project.projectId}/edit`}
                      className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!auth.currentUser) return;
                        
                        try {
                          const userRef = doc(db, 'users', auth.currentUser.uid);
                          const userDoc = await getDoc(userRef);
                          const savedProjects = userDoc.data()?.savedProjects || [];
                          const isSaved = savedProjects.includes(project.projectId);
                          
                          await updateDoc(userRef, {
                            savedProjects: isSaved 
                              ? arrayRemove(project.projectId)
                              : arrayUnion(project.projectId)
                          });
                        } catch (err) {
                          console.error('Error toggling save status:', err);
                        }
                      }}
                      className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col space-y-4">
                    {project.thumbnailUrl && (
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x225?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {project.title}
                      </h2>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.programmingLanguages?.map(lang => (
                        <span
                          key={lang}
                          className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md"
                        >
                          {lang}
                        </span>
                      )) || null}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{project.likes?.length || 0}</span>
                      </div>
                      <span>
                        {project.uploadedAt ? new Date(project.uploadedAt.seconds * 1000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date not available'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Projects;