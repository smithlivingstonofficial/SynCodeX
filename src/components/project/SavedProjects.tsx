import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, doc, getDoc, updateDoc, arrayRemove, Timestamp, getDocs } from 'firebase/firestore';
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

interface BlogData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  likes: string[];
  views: number;
  tags: string[];
}

interface QuestionData {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  upvotes: number;
  downvotes: number;
  views: number;
  answersCount: number;
  tags: string[];
}

type ContentType = 'projects' | 'blogs' | 'questions';

const SavedProjects = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('projects');
  const [savedProjects, setSavedProjects] = useState<ProjectData[]>([]);
  const [savedBlogs, setSavedBlogs] = useState<BlogData[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchSavedContent = async () => {
      if (!auth.currentUser) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        // Fetch saved projects
        const savedProjectIds = userData?.savedProjects || [];
        if (savedProjectIds.length > 0) {
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
        }

        // Fetch saved blogs
        const savedBlogIds = userData?.savedBlogs || [];
        if (savedBlogIds.length > 0) {
          const blogsRef = collection(db, 'blogs');
          const blogDocs = await Promise.all(
            savedBlogIds.map((id: string) => getDoc(doc(blogsRef, id)))
          );
          if (isMounted) {
            const blogsData = blogDocs
              .filter(doc => doc.exists())
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as BlogData[];
            setSavedBlogs(blogsData);
          }
        }

        // Fetch saved questions
        const savedQuestionIds = userData?.savedQuestions || [];
        if (savedQuestionIds.length > 0) {
          const questionsRef = collection(db, 'questions');
          const questionDocs = await Promise.all(
            savedQuestionIds.map((id: string) => getDoc(doc(questionsRef, id)))
          );
          if (isMounted) {
            const questionsData = questionDocs
              .filter(doc => doc.exists())
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as QuestionData[];
            setSavedQuestions(questionsData);
          }
        }
      } catch (err) {
        console.error('Error fetching saved content:', err);
        if (isMounted) {
          setError('Failed to load saved content');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSavedContent();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUnsaveItem = async (id: string, type: ContentType) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const field = `saved${type.charAt(0).toUpperCase() + type.slice(1)}`;
      
      await updateDoc(userRef, {
        [field]: arrayRemove(id)
      });

      switch (type) {
        case 'projects':
          setSavedProjects(prev => prev.filter(project => project.projectId !== id));
          break;
        case 'blogs':
          setSavedBlogs(prev => prev.filter(blog => blog.id !== id));
          break;
        case 'questions':
          setSavedQuestions(prev => prev.filter(question => question.id !== id));
          break;
      }
    } catch (err) {
      console.error(`Error unsaving ${type}:`, err);
      setError(`Failed to unsave ${type}`);
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
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view your saved content</p>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Saved Content</h1>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'projects' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'blogs' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Blogs
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'questions' ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              Questions
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Projects Tab */}
              {activeTab === 'projects' && (
                savedProjects.length === 0 ? (
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
                            onClick={() => handleUnsaveItem(project.projectId, 'projects')}
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
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Blogs Tab */}
              {activeTab === 'blogs' && (
                savedBlogs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">You haven't saved any blogs yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedBlogs.map(blog => (
                      <div
                        key={blog.id}
                        className="group bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-lg relative"
                      >
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => handleUnsaveItem(blog.id, 'blogs')}
                            className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <Link to={`/community/blogs/${blog.id}`} className="block">
                          <div className="flex flex-col space-y-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                {blog.title}
                              </h2>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                {blog.content.replace(/<[^>]*>/g, '')}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {blog.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span>{blog.views} views</span>
                                <span>{blog.likes.length} likes</span>
                              </div>
                              <span>{new Date(blog.createdAt.toDate()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Questions Tab */}
              {activeTab === 'questions' && (
                savedQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">You haven't saved any questions yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {savedQuestions.map(question => (
                      <div
                        key={question.id}
                        className="group bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-lg relative"
                      >
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => handleUnsaveItem(question.id, 'questions')}
                            className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <Link to={`/community/questions/${question.id}`} className="block">
                          <div className="flex flex-col space-y-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                                {question.title}
                              </h2>
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                {question.content.replace(/<[^>]*>/g, '')}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {question.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span>{question.views} views</span>
                                <span>{question.upvotes - question.downvotes} votes</span>
                                <span>{question.answersCount} answers</span>
                              </div>
                              <span>{new Date(question.createdAt.toDate()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedProjects;