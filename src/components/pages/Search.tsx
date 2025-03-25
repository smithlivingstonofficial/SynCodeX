import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channel: {
    name: string;
    handle: string;
    logoUrl: string;
  };
  programmingLanguages: string[];
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchProjects = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('title', '>=', searchQuery.toLowerCase()),
          where('title', '<=', searchQuery.toLowerCase() + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const searchResults: SearchResult[] = [];

        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          searchResults.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            thumbnailUrl: data.thumbnailUrl,
            channel: data.channel || {
              name: 'Anonymous',
              handle: 'anonymous',
              logoUrl: ''
            },
            programmingLanguages: data.programmingLanguages || []
          });
        }

        setResults(searchResults);
      } catch (err) {
        console.error('Error searching projects:', err);
        setError('Failed to search projects');
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProjects, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-0 md:pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-6xl mx-auto p-3 md:p-6">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 border-2 border-gray-200 dark:border-gray-700/50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 mb-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <Link
                key={result.id}
                to={`/project/${result.id}`}
                className="block bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700/30"
              >
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 relative">
                  {result.thumbnailUrl ? (
                    <img
                      src={result.thumbnailUrl}
                      alt={result.title}
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

                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                      {result.channel.logoUrl ? (
                        <img
                          src={result.channel.logoUrl}
                          alt={result.channel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        @{result.channel.handle}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
                    {result.description}
                  </p>

                  {result.programmingLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.programmingLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {searchQuery && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;