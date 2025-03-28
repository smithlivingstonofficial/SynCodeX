import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface ProjectData {
  title: string;
  description: string;
  programmingLanguages: string[];
  visibility: string;
  tags: string[];
  thumbnailUrl: string;
  userId: string;
}

const ProjectEdit = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    programmingLanguages: [] as string[],
    visibility: 'public',
    tags: [] as string[],
    thumbnail: null as File | null
  });
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          setError('Project not found');
          return;
        }

        const projectData = projectDoc.data() as ProjectData;
        
        // Check if the current user is the owner of the project
        if (projectData.userId !== auth.currentUser?.uid) {
          setError('You do not have permission to edit this project');
          return;
        }

        setFormData({
          title: projectData.title,
          description: projectData.description,
          programmingLanguages: projectData.programmingLanguages,
          visibility: projectData.visibility,
          tags: projectData.tags,
          thumbnail: null
        });
        setCurrentThumbnailUrl(projectData.thumbnailUrl);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      }
    };

    fetchProject();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !formData.programmingLanguages.includes(value)) {
      setFormData(prev => ({
        ...prev,
        programmingLanguages: [...prev.programmingLanguages, value]
      }));
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value && !formData.tags.includes(value)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, value]
      }));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !projectId) return;

    setLoading(true);
    setError('');

    try {
      const projectRef = doc(db, 'projects', projectId);

      let thumbnailUrl = currentThumbnailUrl;
      if (formData.thumbnail) {
        const fileName = `${Date.now()}_${formData.thumbnail.name}`;
        const storageRef = ref(storage, `projects/${projectId}/thumbnail/${fileName}`);
        await uploadBytes(storageRef, formData.thumbnail);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(projectRef, {
        title: formData.title,
        description: formData.description,
        programmingLanguages: formData.programmingLanguages,
        visibility: formData.visibility,
        tags: formData.tags,
        thumbnailUrl,
        updatedAt: new Date()
      });

      navigate(`/projects/${projectId}`);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="text-red-500 dark:text-red-400">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Project</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
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
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="programmingLanguages" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programming Languages</label>
              <input
                type="text"
                id="programmingLanguages"
                placeholder="Press Enter to add"
                onKeyPress={(e) => e.key === 'Enter' && handleLanguageChange(e as any)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.programmingLanguages.map(lang => (
                  <span key={lang} className="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {lang}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        programmingLanguages: prev.programmingLanguages.filter(l => l !== lang)
                      }))}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <input
                type="text"
                id="tags"
                placeholder="Press Enter to add"
                onKeyPress={(e) => e.key === 'Enter' && handleTagChange(e as any)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded">
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

            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</label>
              {currentThumbnailUrl && (
                <div className="mt-2 mb-4">
                  <img
                    src={currentThumbnailUrl}
                    alt="Current thumbnail"
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              <input
                type="file"
                id="thumbnail"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  dark:file:bg-blue-900/50 dark:file:text-blue-200
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
              />
            </div>
            </div>  
            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/projects/${projectId}`)}
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
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectEdit;