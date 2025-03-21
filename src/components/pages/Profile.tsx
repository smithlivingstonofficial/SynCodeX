import { useState, useEffect } from 'react';
import { auth, db, storage } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const Profile = () => {
  const navigate = useNavigate();
  const [channelData, setChannelData] = useState({
    name: '',
    handle: '',
    description: '',
    logoUrl: ''
  });
  const [originalData, setOriginalData] = useState(null);
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
          const data = docSnap.data();
          setChannelData(data);
          setOriginalData(data);
          setHandleStatus(prev => ({ ...prev, originalHandle: data.handle }));
        } else {
          const initialData = {
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

  const hasChanges = () => {
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

    setIsLoading(true);
    setError('');

    try {
      const storageRef = ref(storage, `channel-logos/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setChannelData(prev => ({
        ...prev,
        logoUrl: downloadURL
      }));

      const docRef = doc(db, 'channels', auth.currentUser.uid);
      await setDoc(docRef, { ...channelData, logoUrl: downloadURL });
      setOriginalData(prev => ({ ...prev, logoUrl: downloadURL }));
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
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">Channel Customization</h1>
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
            <div className="bg-gray-900 rounded-xl p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
                      {channelData.logoUrl ? (
                        <img src={channelData.logoUrl} alt="Channel logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl text-gray-400">
                          {channelData.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                      <span className="text-white text-sm">{isLoading ? 'Uploading...' : 'Change'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Channel name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={channelData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter channel name"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="handle" className="block text-sm font-medium text-gray-300 mb-1">
                      Channel handle
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-gray-400">@</span>
                      <input
                        type="text"
                        id="handle"
                        name="handle"
                        value={channelData.handle}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-4 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${handleStatus.message ? (handleStatus.isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-700'}`}
                        placeholder="handle"
                        disabled={isLoading}
                      />
                      {handleStatus.message && (
                        <span className={`text-sm ${handleStatus.isValid ? 'text-green-500' : 'text-red-500'} mt-1 block`}>
                          {handleStatus.message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={channelData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell viewers about your channel"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !handleStatus.isValid || !hasChanges()}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;