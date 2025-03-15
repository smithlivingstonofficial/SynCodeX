import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useSidebar } from '../contexts/SidebarContext';

export default function Channel() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isCollapsed } = useSidebar();
  const db = getFirestore();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Query the profiles collection to find the user with matching username
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setProfile(querySnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, db]);

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-64'} flex items-center justify-center transition-all duration-300`}>
        <l-jelly-triangle
          size="40"
          speed="1.75"
          color="white"
        ></l-jelly-triangle>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-64'} flex items-center justify-center transition-all duration-300`}>
        <div className="text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-64'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-6 mb-6">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-white text-3xl">
                {profile.displayName[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Bio</h2>
              <p className="text-gray-400">{profile.bio || 'No bio yet'}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Projects</h2>
              {profile.projects && profile.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.map((project, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <h3 className="text-white font-medium">{project.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No projects yet</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Work & Skills</h2>
              <div className="space-y-2">
                <p className="text-gray-400">Role: {profile.role || 'Not specified'}</p>
                <p className="text-gray-400">Company: {profile.company || 'Not specified'}</p>
                <p className="text-gray-400">Expertise Level: {profile.expertiseLevel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}