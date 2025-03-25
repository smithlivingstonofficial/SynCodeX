import { useState, useEffect } from 'react';
import { auth, db, storage } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface ChannelData {
  name: string;
  handle: string;
  description: string;
  logoUrl: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [channelData, setChannelData] = useState<ChannelData>({
    name: '',
    handle: '',
    description: '',
    logoUrl: ''
  });
  const [originalData, setOriginalData] = useState<ChannelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [handleStatus, setHandleStatus] = useState({
    isValid: true,
    message: '',
    originalHandle: ''
  });

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!auth.currentUser) return;

      try {
        const docRef = doc(db, 'channels', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as ChannelData;
          setChannelData(data);
          setOriginalData(data);
          setHandleStatus(prev => ({ ...prev, originalHandle: data.handle }));
        } else {
          const initialData: ChannelData = {
            name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || '',
            handle: '',
            description: '',
            logoUrl: ''
          };
          setChannelData(initialData);
          setOriginalData(initialData);
        }
      } catch (err) {
        console.error('Error fetching channel data:', err);
        setError('Failed to load channel data');
      }
    };

    fetchChannelData();
  }, []);

  const hasChanges = (): boolean => {
    if (!originalData) return false;
    return (
      channelData.name !== originalData.name ||
      channelData.handle !== originalData.handle ||
      channelData.description !== originalData.description ||
      channelData.logoUrl !== originalData.logoUrl
    );
  };

  const checkHandleAvailability = async (handle: string) => {
    if (!handle) return;
    if (handle === handleStatus.originalHandle) {
      setHandleStatus(prev => ({ ...prev, isValid: true, message: '' }));
      return;
    }

    try {
      const channelsRef = collection(db, 'channels');
      const q = query(channelsRef, where('handle', '==', handle));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHandleStatus(prev => ({ ...prev, isValid: true, message: 'Username is available' }));
      } else {
        setHandleStatus(prev => ({ ...prev, isValid: false, message: 'Username is already taken' }));
      }
    } catch (err) {
      console.error('Error checking handle availability:', err);
      setHandleStatus(prev => ({ ...prev, isValid: false, message: 'Error checking username availability' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChannelData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'handle') {
      const timeoutId = setTimeout(() => checkHandleAvailability(value), 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !handleStatus.isValid) return;

    setIsLoading(true);
    setError('');

    try {
      const docRef = doc(db, 'channels', auth.currentUser.uid);
      await setDoc(docRef, channelData);
      setHandleStatus(prev => ({ ...prev, originalHandle: channelData.handle }));
    } catch (err) {
      console.error('Error saving channel data:', err);
      setError('Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

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

    setIsLoading(true);
    setError('');

    try {
      // Create a unique file name using timestamp
      const timestamp = Date.now();
      const fileName = `${auth.currentUser.uid}_${timestamp}`;
      const storageRef = ref(storage, `profile-pictures/${fileName}`);

      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'userId': auth.currentUser.uid,
          'uploadedAt': new Date().toISOString()
        }
      };

      const uploadTask = uploadBytes(storageRef, file, metadata);
      
      // Handle the upload
      await uploadTask;
      const downloadURL = await getDownloadURL(storageRef);

      // Update channel data with new profile picture
      const updatedData = {
        ...channelData,
        logoUrl: downloadURL
      };

      // Update Firestore document
      const docRef = doc(db, 'channels', auth.currentUser.uid);
      await setDoc(docRef, updatedData);

      // Update local state
      setChannelData(updatedData);
      setOriginalData(updatedData);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700/30">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h1>

            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700/50">
                    {channelData.logoUrl ? (
                      <img src={channelData.logoUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer transition-all duration-200 transform hover:scale-110">
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{channelData.name || 'Your Name'}</h2>
                  <p className="text-gray-600 dark:text-gray-400">@{channelData.handle || 'username'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Channel Customization</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={channelData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                placeholder="Enter your channel name"
              />
            </div>

            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  id="handle"
                  name="handle"
                  value={channelData.handle}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 ${handleStatus.isValid ? 'border-gray-200 dark:border-gray-700/50' : 'border-red-500/50'} rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent`}
                  placeholder="Choose a unique username"
                />
                {handleStatus.message && (
                  <p className={`mt-2 text-sm ${handleStatus.isValid ? 'text-green-400' : 'text-red-400'}`}>
                    {handleStatus.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                id="description"
                name="description"
                value={channelData.description}
                onChange={handleChange}
                rows={4}
                className="mt-1 block w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                placeholder="Tell us about your channel"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={!hasChanges() || !handleStatus.isValid || isLoading}
                className={`px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 ${hasChanges() && handleStatus.isValid && !isLoading ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 cursor-not-allowed'}`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;