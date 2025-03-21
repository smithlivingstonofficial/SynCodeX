import { useState, useRef, DragEvent } from 'react';
import { auth, db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleThumbnailDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(true);
  };

  const handleThumbnailDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/zip') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a ZIP file');
    }
  };

  const handleThumbnailDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingThumbnail(false);
    
    const droppedFile = e.dataTransfer.files[0];
    handleThumbnailFile(droppedFile);
  };

  const handleThumbnailFile = (file: File | null) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setError('Thumbnail size should be less than 2MB');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/zip') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a ZIP file');
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleThumbnailFile(selectedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setIsLoading(true);
    setError('');

    try {
      // Upload thumbnail if exists
      let thumbnailUrl = '';
      if (thumbnail) {
        const timestamp = Date.now();
        const thumbnailRef = ref(storage, `thumbnails/${auth.currentUser.uid}/${timestamp}_${thumbnail.name}`);
        await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Upload project file
      const storageRef = ref(storage, `projects/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Save project data to Firestore
      const projectId = `${auth.currentUser.uid}_${Date.now()}`;
      const projectRef = doc(db, 'projects', projectId);
      await setDoc(projectRef, {
        ...projectData,
        thumbnailUrl,
        fileUrl: downloadURL,
        fileName: file.name,
        uploadedAt: Date.now(),
        userId: auth.currentUser.uid,
        tags: projectData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      });

      navigate('/home');
    } catch (err: any) {
      console.error('Error uploading project:', err);
      setError(err.message);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700/50 hover:border-gray-600'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-gray-500">
                      {file ? (
                        <span className="text-blue-500">{file.name}</span>
                      ) : (
                        <span>Drag and drop your project ZIP file here, or click to select</span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  onDragOver={handleThumbnailDragOver}
                  onDragLeave={handleThumbnailDragLeave}
                  onDrop={handleThumbnailDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 relative ${isDraggingThumbnail ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700/50 hover:border-gray-600'}`}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                  />
                  {thumbnailPreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <span className="text-white text-sm">Click to change thumbnail</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 h-full">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-gray-500">
                        <span>Add a thumbnail image (optional)</span>
                        <p className="text-xs mt-1">Recommended: 16:9 ratio, max 2MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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