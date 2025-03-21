import { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

const Profile = () => {
  const [channelData, setChannelData] = useState({
    name: '',
    handle: '',
    description: '',
    logoUrl: ''
  });

  useEffect(() => {
    // Initialize with user's email as default channel name
    if (auth.currentUser) {
      setChannelData(prev => ({
        ...prev,
        name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || ''
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChannelData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement save functionality
    console.log('Channel data:', channelData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChannelData(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-8">Channel Customization</h1>
          
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
                      <span className="text-white text-sm">Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
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
                        className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="handle"
                      />
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
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Save
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