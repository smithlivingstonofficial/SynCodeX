import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const AskQuestion = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Please sign in to ask a question
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user) {
      setError('Please fill in all required fields');
      return;
    }

    if (title.length < 10) {
      setError('Title must be at least 10 characters long');
      return;
    }

    // Remove HTML tags and decode entities for length validation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';

    if (plainTextContent.trim().length < 30) {
      setError('Question details must be at least 30 characters long');
      return;
    }

    if (tags.length === 0) {
      setError('Please add at least one tag to your question');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (!user) {
        throw new Error('You must be signed in to post a question');
      }

      const questionData = {
        title: title.trim(),
        content: content.trim(),
        tags,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        views: 0,
        answersCount: 0,
        status: 'open',
        lastActivityAt: serverTimestamp(),
        votes: [],
        bookmarks: []
      };

      const questionsRef = collection(db, 'questions');
      const docRef = await addDoc(questionsRef, questionData);
      
      if (!docRef.id) {
        throw new Error('Failed to create question document');
      }
      
      navigate(`/community/questions/${docRef.id}`);
    } catch (err) {
      console.error('Error posting question:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to post question. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ask a Question</h1>
            {error && (
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/30 text-red-700 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              placeholder="What's your question? Be specific."
              required
              minLength={10}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {title.length}/100 characters
            </p>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Details <span className="text-red-500">*</span>
            </label>
            <ReactQuill
              value={content}
              onChange={setContent}
              className="bg-white dark:bg-gray-800/50 rounded-xl overflow-hidden"
              theme="snow"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, false] }],
                  ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
                  [{'list': 'ordered'}, {'list': 'bullet'}],
                  ['link', 'image'],
                  ['clean']
                ],
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
                'list', 'bullet',
                'link', 'image'
              ]}
              placeholder="Describe your question in detail..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags <span className="text-gray-500 dark:text-gray-400">(max 5)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Add relevant tags (press Enter)"
                disabled={tags.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 5}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Add
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Posting...
              </div>
            ) : (
              'Post Question'
            )}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskQuestion;