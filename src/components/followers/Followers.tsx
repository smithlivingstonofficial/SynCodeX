import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  photoURL: string; 
  bio: string;
}

const Followers = () => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFollowData = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;

        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'profiles', userId));
        if (!userDoc.exists()) {
          // Initialize profile for new users
          const initialProfile = {
            uid: userId,
            displayName: auth.currentUser.displayName || 'Anonymous',
            username: '',
            photoURL: auth.currentUser.photoURL || '/default-avatar.png',
            bio: '',
            followers: [],
            following: []
          };
          await setDoc(doc(db, 'profiles', userId), initialProfile);
          setFollowing([]);
          setFollowers([]);
          setLoading(false);
          return;
        }

        // Fetch following users
        const userFollowing = userDoc.data().following || [];
        const followingPromises = userFollowing.map(async (followedId: string) => {
          const profileDoc = await getDoc(doc(db, 'profiles', followedId));
          if (profileDoc.exists()) {
            return {
              id: profileDoc.id,
              displayName: profileDoc.data().displayName || 'Anonymous',
              username: profileDoc.data().username || '',
              photoURL: profileDoc.data().photoURL || '/default-avatar.png',
              bio: profileDoc.data().bio || ''
            } as UserProfile;
          }
          return null;
        });

        // Fetch followers
        const userFollowers = userDoc.data().followers || [];
        const followersPromises = userFollowers.map(async (followerId: string) => {
          const profileDoc = await getDoc(doc(db, 'profiles', followerId));
          if (profileDoc.exists()) {
            return {
              id: profileDoc.id,
              displayName: profileDoc.data().displayName || 'Anonymous',
              username: profileDoc.data().username || '',
              photoURL: profileDoc.data().photoURL || '/default-avatar.png',
              bio: profileDoc.data().bio || ''
            } as UserProfile;
          }
          return null;
        });

        const [followingResults, followersResults] = await Promise.all([
          Promise.all(followingPromises),
          Promise.all(followersPromises)
        ]);

        setFollowing(followingResults.filter((profile): profile is UserProfile => profile !== null));
        setFollowers(followersResults.filter((profile): profile is UserProfile => profile !== null));
      } catch (err) {
        console.error('Error fetching follow data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load follow data');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view your follows</p>
            </div>
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
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'following' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              Following ({following.length})
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${activeTab === 'followers' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              Followers ({followers.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'following' ? following : followers).map(profile => (
                <Link
                  key={profile.id}
                  to={`/profile/${profile.username}`}
                  className="group bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={profile.photoURL}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                        {profile.displayName}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">@{profile.username}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {profile.bio}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Followers;