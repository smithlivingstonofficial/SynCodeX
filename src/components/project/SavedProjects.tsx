import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, doc, getDoc, updateDoc, arrayRemove, Timestamp } from 'firebase/firestore';
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

const SavedProjects = () => {
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSavedProjects = async () => {
      if (!auth.currentUser) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Get user's saved projects IDs
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const savedProjectIds = userDocSnap.data()?.savedProjects || [];

        if (savedProjectIds.length === 0) {
          setSavedProjects([]);
          setLoading(false);
          return;
        }

        // Fetch all saved projects
        const projectsRef = collection(db, 'projects');
        const projectDocs = await Promise.all(
          savedProjectIds.map((id: string) => getDoc(doc(projectsRef, id)))
        );

        if (isMounted) {
          const projectsData = projectDocs
            .filter(doc => doc.exists())
            .map(doc => ({
              projectId: doc.id,
              ...doc.data()
            })) as ProjectData[];
          setSavedProjects(projectsData);
        }
      } catch (err) {
        console.error('Error fetching saved projects:', err);
        if (isMounted) {
          setError('Failed to load saved projects');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSavedProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUnsaveProject = async (projectId: string) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        savedProjects: arrayRemove(projectId)
      });

      setSavedProjects(prev => prev.filter(project => project.projectId !== projectId));
    } catch (err) {
      console.error('Error unsaving project:', err);
      setError('Failed to unsave project');
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view your saved projects</p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Saved Projects</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : savedProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">You haven't saved any projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProjects.map(project => (
                <div
                  key={project.projectId}
                  className="group bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-lg relative"
                >
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleUnsaveProject(project.projectId)}
                      className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <Link to={`/projects/${project.projectId}`} className="block">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedProjects;