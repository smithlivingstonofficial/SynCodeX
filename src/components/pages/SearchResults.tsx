import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface Channel {
  name: string;
  handle: string;
  logoUrl: string;
}

interface Project {
  id: string;
  title: string;    
  description: string;
  thumbnailUrl: string;
  createdAt: Date;
  visibility: string;
  userId: string;
  programmingLanguages: string[];
  channel?: Channel;
}

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('visibility', '==', 'public')
        );

        const querySnapshot = await getDocs(q);
        const projectsData = await Promise.all(
          querySnapshot.docs
            .map(async (doc) => {
              const data = doc.data();
              const channelDoc = await getDocs(collection(db, 'channels'));
              const channelData = channelDoc.docs.find(d => d.id === data.userId);
              
              const project = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                channel: channelData ? {
                  name: channelData.data().name,
                  handle: channelData.data().handle,
                  logoUrl: channelData.data().logoUrl
                } : undefined
              } as Project;

              // Enhanced search filtering
              const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
              const titleMatch = searchTerms.every(term => project.title.toLowerCase().includes(term));
              const descriptionMatch = searchTerms.every(term => project.description.toLowerCase().includes(term));
              const languageMatch = project.programmingLanguages?.some(lang => 
                searchTerms.some(term => lang.toLowerCase().includes(term))
              );
              const channelMatch = project.channel ? searchTerms.every(term => 
                project.channel?.name?.toLowerCase().includes(term) ||
                project.channel?.handle?.toLowerCase().includes(term)
              ) : false;

              return (titleMatch || descriptionMatch || languageMatch || channelMatch) ? project : null;
            })
        );

        setProjects(projectsData.filter((p): p is Project => p !== null));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to load search results');
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <main className="pt-14 transition-all duration-200 md:ml-64">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <main className="pt-14 transition-all duration-200 md:ml-64">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-0 md:pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Search Results for "{searchQuery}"
          </h1>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No results found for "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/${project.id}`)}
                  className="bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-200 shadow-lg cursor-pointer"
                >
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
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                        {project.channel?.logoUrl ? (
                          <img
                            src={project.channel.logoUrl}
                            alt={project.channel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-full h-full text-gray-400 p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 dark:text-white font-medium truncate">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          @{project.channel?.handle || 'anonymous'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {project.programmingLanguages?.[0] && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          {project.programmingLanguages[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;