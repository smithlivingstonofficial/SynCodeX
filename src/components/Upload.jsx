import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      alert('Please login to upload projects');
      return;
    }

    try {
      setLoading(true);
      const storage = getStorage();
      const db = getFirestore();

      // Upload source code file
      const sourceCodeRef = ref(storage, `projects/${auth.currentUser.uid}/${formData.sourceCode.name}`);
      await uploadBytes(sourceCodeRef, formData.sourceCode);
      const sourceCodeUrl = await getDownloadURL(sourceCodeRef);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (formData.thumbnail) {
        const thumbnailRef = ref(storage, `thumbnails/${auth.currentUser.uid}/${formData.thumbnail.name}`);
        await uploadBytes(thumbnailRef, formData.thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      // Save project metadata to Firestore
      const projectData = {
        userId: auth.currentUser.uid,
        title: formData.title,
        description: formData.description,
        programmingLanguages: formData.programmingLanguages.split(',').map(lang => lang.trim()),
        sourceCodeUrl,
        thumbnailUrl,
        visibility: formData.visibility,
        password: formData.visibility === 'private' ? formData.password : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'projects'), projectData);
      navigate('/profile');
    } catch (error) {
      console.error('Error uploading project:', error);
      alert('Failed to upload project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Upload Project</h1>
          
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
              <label className="block text-white mb-2">Source Code File</label>
              <input
                type="file"
                name="sourceCode"
                onChange={handleFileChange}
                required
                accept=".zip,.rar,.7zip,.txt,.js,.py,.java,.cpp,.c,.html,.css"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-500"
            >
              {loading ? 'Uploading...' : 'Upload Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}