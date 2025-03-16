import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    programmingLanguages: '',
    sourceCode: null,
    thumbnail: null,
    visibility: 'public',
    password: ''
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (name === 'thumbnail') {
      setFormData(prev => ({
        ...prev,
        thumbnail: file
      }));
      // Create preview URL for thumbnail
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } else if (name === 'sourceCode') {
      setFormData(prev => ({
        ...prev,
        sourceCode: file
      }));
    }
  };

  // Cleanup thumbnail preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please login to upload projects');
      return;
    }

    // Reset error state
    setError(null);

    // Validate file size and type
    if (formData.sourceCode && formData.sourceCode.size > 50 * 1024 * 1024) {
      setError('Source code file size must be less than 50MB');
      return;
    }

    if (formData.thumbnail && formData.thumbnail.size > 5 * 1024 * 1024) {
      setError('Thumbnail file size must be less than 5MB');
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Project title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Project description is required');
      return;
    }

    if (!formData.programmingLanguages.trim()) {
      setError('Programming languages are required');
      return;
    }

    if (!formData.sourceCode) {
      setError('Source code file is required');
      return;
    }

    if (formData.visibility === 'private' && !formData.password) {
      setError('Password is required for private projects');
      return;
    }

    try {
      setLoading(true);
      const storage = getStorage();
      const db = getFirestore();
      let sourceCodeUrl = null;
      let thumbnailUrl = null;
      let sourceCodeRef = null;
      let thumbnailRef = null;

      // Upload source code file
      if (formData.sourceCode) {
        sourceCodeRef = ref(storage, `projects/${auth.currentUser.uid}/${Date.now()}_${formData.sourceCode.name}`);
        try {
          await uploadBytes(sourceCodeRef, formData.sourceCode);
          sourceCodeUrl = await getDownloadURL(sourceCodeRef);
        } catch (error) {
          console.error('Error uploading source code:', error);
          throw new Error('Failed to upload source code file. Please try again.');
        }
      }

      // Upload thumbnail if provided
      if (formData.thumbnail) {
        thumbnailRef = ref(storage, `thumbnails/${auth.currentUser.uid}/${Date.now()}_${formData.thumbnail.name}`);
        try {
          await uploadBytes(thumbnailRef, formData.thumbnail);
          thumbnailUrl = await getDownloadURL(thumbnailRef);
        } catch (error) {
          // Clean up the source code file if thumbnail upload fails
          if (sourceCodeRef) {
            try {
              await deleteObject(sourceCodeRef);
            } catch (cleanupError) {
              console.error('Error cleaning up source code file:', cleanupError);
            }
          }
          console.error('Error uploading thumbnail:', error);
          throw new Error('Failed to upload thumbnail. Please try again.');
        }
      }

      // Save project metadata to Firestore
      try {
        const projectData = {
          userId: auth.currentUser.uid,
          title: formData.title.trim(),
          description: formData.description.trim(),
          programmingLanguages: formData.programmingLanguages.split(',').map(lang => lang.trim()).filter(Boolean),
          sourceCodeUrl,
          thumbnailUrl,
          visibility: formData.visibility,
          password: formData.visibility === 'private' ? formData.password : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likes: [],
          downloads: 0
        };

        await addDoc(collection(db, 'projects'), projectData);
        navigate('/profile');
      } catch (error) {
        // Clean up uploaded files if Firestore save fails
        if (sourceCodeRef) {
          try {
            await deleteObject(sourceCodeRef);
          } catch (cleanupError) {
            console.error('Error cleaning up source code file:', cleanupError);
          }
        }
        if (thumbnailRef) {
          try {
            await deleteObject(thumbnailRef);
          } catch (cleanupError) {
            console.error('Error cleaning up thumbnail file:', cleanupError);
          }
        }
        console.error('Error saving project data:', error);
        throw new Error('Failed to save project information. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading project:', error);
      setError(error.message || 'Failed to upload project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { isCollapsed } = useSidebar();

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300`}>
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Upload Project</h1>
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-white mb-2">Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-48">
                <label className="block text-white mb-2">Thumbnail</label>
                <input
                  type="file"
                  name="thumbnail"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="block w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                >
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span>Upload Thumbnail</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2">Project Visibility</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleInputChange}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-2 text-white">Public</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleInputChange}
                    className="form-radio text-blue-500"
                  />
                  <span className="ml-2 text-white">Private</span>
                </label>
              </div>
            </div>

            {formData.visibility === 'private' && (
              <div>
                <label className="block text-white mb-2">Project Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Set a password for private access"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-white mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Programming Languages (comma-separated)</label>
              <input
                type="text"
                name="programmingLanguages"
                value={formData.programmingLanguages}
                onChange={handleInputChange}
                required
                placeholder="e.g. JavaScript, Python, Java"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Source Code</label>
              <input
                type="file"
                name="sourceCode"
                onChange={handleFileChange}
                accept=".zip,.rar,.7z,.txt,.js,.jsx,.py,.java,.cpp,.c,.html,.css"
                required
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md font-semibold ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              {loading ? 'Uploading...' : 'Upload Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}