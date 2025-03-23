import { useState } from 'react';
import { auth, db, storage } from '../../firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const Upload = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    language: '',
    visibility: 'public',
    tags: '',
    thumbnailUrl: ''
  });

  const programmingLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Go', 'Rust', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      return;
    }

    setThumbnail(file);
    setError('');

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please ensure you are logged in');
      return;
    }

    if (!projectData.title.trim()) {
      setError('Please enter a project title');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let thumbnailUrl = '';
      let projectId = '';
      if (thumbnail) {
        // Create a new document reference with auto-generated ID
        const projectRef = doc(collection(db, 'projects'));
        projectId = projectRef.id;
        
        const fileName = `thumbnail_${thumbnail.name}`;
        const storageRef = ref(storage, `projects/${projectId}/thumbnail/${fileName}`);
        
        // Add metadata
        const metadata = {
          contentType: thumbnail.type,
          customMetadata: {
            projectId: projectId,
            userId: auth.currentUser.uid,
            uploadedAt: new Date().toISOString(),
            originalName: thumbnail.name
          }
        };

        // Upload with metadata and handle potential errors
        try {
          const uploadResult = await uploadBytes(storageRef, thumbnail, metadata);
          thumbnailUrl = await getDownloadURL(uploadResult.ref);
        } catch (uploadError: any) {
          console.error('Error uploading thumbnail:', uploadError);
          if (uploadError.code === 'storage/unauthorized') {
            throw new Error('You do not have permission to upload files');
          } else if (uploadError.code === 'storage/canceled') {
            throw new Error('Upload was canceled');
          } else if (uploadError.code === 'storage/unknown') {
            throw new Error('An unknown error occurred during upload');
          } else {
            throw new Error('Failed to upload thumbnail: ' + (uploadError.message || 'Unknown error'));
          }
        }
      }

      const tags = projectData.tags
        ? projectData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      // If no thumbnail was uploaded, create a new document reference
      if (!projectId) {
        const projectRef = doc(collection(db, 'projects'));
        projectId = projectRef.id;
      }

      await setDoc(doc(db, 'projects', projectId), {
        projectId,
        title: projectData.title.trim(),
        description: projectData.description.trim(),
        programmingLanguages: [projectData.language],
        visibility: projectData.visibility,
        uploadedAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        tags,
        likes: [],
        thumbnailUrl
      });

      // Navigate to home after successful upload
      navigate('/home');
    } catch (err: any) {
      console.error('Error uploading project:', err);
      setError(err.message || 'Failed to upload project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Upload Project</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={projectData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="Enter your project title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    value={projectData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                    placeholder="Describe your project"
                  />
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programming Language</label>
                  <select
                    id="language"
                    name="language"
                    required
                    value={projectData.language}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  >
                    <option value="">Select a language</option>
                    {programmingLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Thumbnail</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 dark:border-gray-700/50 border-dashed rounded-xl">
                    <div className="space-y-1 text-center">
                      {thumbnailPreview ? (
                        <div className="relative w-full max-w-[300px] mx-auto">
                          <img src={thumbnailPreview} alt="Thumbnail preview" className="rounded-lg shadow-lg" />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnail(null);
                              setThumbnailPreview('');
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label htmlFor="thumbnail" className="relative cursor-pointer rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>Upload a file</span>
                              <input
                                id="thumbnail"
                                name="thumbnail"
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={projectData.tags}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                    placeholder="Enter tags separated by commas"
                  />
                </div>

                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={projectData.visibility}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-red-400 text-sm mt-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 backdrop-blur-sm">{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg shadow-md ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Project'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
