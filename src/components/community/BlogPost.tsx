import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface BlogPostData {
  title: string;
  content: string;
  coverImage?: File;
  tags: string[];
  communityId: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
}

const BlogPost = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [formData, setFormData] = useState<BlogPostData>({
    title: '',
    content: '',
    tags: [],
    communityId: ''
  });

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const communitiesSnapshot = await getDocs(collection(db, 'communities'));
        const communitiesData = communitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Community[];
        setCommunities(communitiesData);
      } catch (err) {
        console.error('Error fetching communities:', err);
        setError('Failed to load communities');
      }
    };

    fetchCommunities();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value.trim();
      if (value && !formData.tags.includes(value)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, value]
        }));
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!formData.communityId) {
      setError('Please select a community');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let coverImageUrl = '';
      if (formData.coverImage) {
        const fileName = `${Date.now()}_${formData.coverImage.name}`;
        const storageRef = ref(storage, `blog_covers/${fileName}`);
        await uploadBytes(storageRef, formData.coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      const blogData = {
        title: formData.title,
        content: formData.content,
        coverImageUrl,
        tags: formData.tags,
        authorId: auth.currentUser.uid,
        communityId: formData.communityId,
        createdAt: Timestamp.now(),
        likes: [],
        comments: []
      };

      const docRef = await addDoc(collection(db, 'blogs'), blogData);
      navigate(`/community/blog/${docRef.id}`);
    } catch (err) {
      console.error('Error creating blog post:', err);
      setError('Failed to create blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Create a New Blog Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="community" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Community</label>
              <select
                id="community"
                name="communityId"
                required
                value={formData.communityId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a community</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your blog title"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
              <textarea
                id="content"
                name="content"
                required
                value={formData.content}
                onChange={handleInputChange}
                rows={15}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Write your blog content here..."
              />
            </div>

            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image</label>
              <input
                type="file"
                id="coverImage"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/50 dark:file:text-blue-200
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <input
                type="text"
                id="tags"
                placeholder="Press Enter to add tags"
                onKeyPress={handleTagChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        tags: prev.tags.filter(t => t !== tag)
                      }))}
                      className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </div>
                ) : (
                  'Publish Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;