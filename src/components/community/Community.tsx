import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import QuestionList from './QuestionList';

const Community = () => {
  const [activeTab, setActiveTab] = useState<'blogs' | 'questions'>('blogs');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
              <p className="text-gray-600 dark:text-gray-400">Share your knowledge and learn from others</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                to="/community/new-blog"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Write a Blog
              </Link>
              <Link
                to="/community/ask-question"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Ask a Question
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('blogs')}
                className={`${
                  activeTab === 'blogs'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Blogs
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Questions
              </button>
            </nav>
          </div>

          {/* Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
            {/* Main Content */}
            <div className="space-y-6">
              {activeTab === 'blogs' ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Blog posts will be displayed here
                </div>
              ) : (
                <QuestionList />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending Topics</h2>
                <div className="space-y-2">
                  {['React', 'TypeScript', 'Node.js', 'Python', 'Machine Learning'].map((topic) => (
                    <div
                      key={topic}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      #{topic}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Contributors</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">User {i}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">5 posts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;