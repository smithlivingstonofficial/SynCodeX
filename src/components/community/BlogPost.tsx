import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import './BlogPost.css';

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

  const modules = {
    syntax: {
      highlight: (text: string) => hljs.highlightAuto(text).value,
    },
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic'],
      ['link', 'blockquote', 'code-block', 'image'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

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

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 flex-1 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 h-full flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-8">
            <div className="flex-1 space-y-6">
              <select
                id="community"
                name="communityId"
                required
                value={formData.communityId}
                onChange={handleInputChange}
                className="w-full max-w-xs px-4 py-2 text-sm rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a community</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full text-4xl font-bold border-0 bg-transparent focus:ring-0 focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Title"
              />

              <div className="flex-1 relative">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={modules}
                  className="h-[calc(100vh-24rem)] prose prose-lg max-w-none dark:prose-invert"
                  placeholder="Tell your story..."
                />
              </div>

              <div className="mt-4">
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="coverImage"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add Cover Image
                </label>
              </div>

              <div>
                <input
                  type="text"
                  id="tags"
                  placeholder="Add up to 5 tags..."
                  onKeyPress={handleTagChange}
                  className="w-full px-4 py-2 text-sm border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full"
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
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-4 sticky bottom-0 bg-white dark:bg-gray-950 py-4 border-t border-gray-200 dark:border-gray-800">
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </div>
                ) : (
                  'Publish'
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