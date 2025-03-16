import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, onSnapshot, runTransaction } from 'firebase/firestore';
import { useSidebar } from '../contexts/SidebarContext';
import { jellyTriangle } from 'ldrs';
import { auth } from '../firebase';

jellyTriangle.register();

export default function Channel() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfileAndProjects = async () => {
      try {
        // Query the profiles collection to find the user with matching username
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const profileData = querySnapshot.docs[0].data();
          const userId = querySnapshot.docs[0].id;
          setProfile({ ...profileData, id: userId });

          // Set up real-time listener for follower count
          const profileDoc = doc(db, 'profiles', userId);
          const unsubscribe = onSnapshot(profileDoc, (doc) => {
            if (doc.exists()) {
              setFollowerCount(doc.data().followers?.length || 0);
              if (user) {
                setIsFollowing(doc.data().followers?.includes(user.uid));
              }
            }
          });

          // Fetch user's public projects
          const projectsRef = collection(db, 'projects');
          const projectsQuery = query(
            projectsRef,
            where('userId', '==', userId),
            where('visibility', '==', 'public')
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          const projectsData = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setProjects(projectsData);

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileAndProjects();
    }
  }, [username, db, user?.uid]);

  const handleFollowAction = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!profile?.id) return;

    try {
      const db = getFirestore();
      const profileRef = doc(db, 'profiles', profile.id);
      
      // Optimistically update UI
      setIsFollowing(!isFollowing);
      setFollowerCount(prevCount => isFollowing ? prevCount - 1 : prevCount + 1);
      
      // Start a transaction to ensure atomic updates
      await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(profileRef);
        if (!profileDoc.exists()) {
          throw new Error('Profile not found');
        }

        const currentFollowers = profileDoc.data().followers || [];
        const isCurrentlyFollowing = currentFollowers.includes(user.uid);

        if (isCurrentlyFollowing) {
          transaction.update(profileRef, {
            followers: arrayRemove(user.uid)
          });
        } else {
          transaction.update(profileRef, {
            followers: arrayUnion(user.uid)
          });
        }
      });
      setShowUnfollowModal(false);
    } catch (error) {
      console.error('Error updating follow status:', error);
      // Revert optimistic UI updates
      setIsFollowing(isFollowing);
      setFollowerCount(prevCount => isFollowing ? prevCount + 1 : prevCount - 1);
      // Show error message to user
      alert('Failed to update follow status. Please try again.');
    }
  };

  const handleFollow = () => {
    if (!user) {
      navigate('/');
      return;
    }

    if (isFollowing) {
      setShowUnfollowModal(true);
    } else {
      handleFollowAction();
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-80'} flex items-center justify-center transition-all duration-300`}>
        <l-jelly-triangle
          size="40"
          speed="1.75"
          color="white"
        ></l-jelly-triangle>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen bg-[#0f0f0f] pt-16 ${isCollapsed ? 'pl-20' : 'pl-80'} flex items-center justify-center transition-all duration-300`}>
        <div className="text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0f0f0f] pt-16 pb-16 md:pb-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-80'} transition-all duration-300`}>
      {/* Unfollow Confirmation Modal */}
      {showUnfollowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Unfollow Confirmation</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to unfollow {profile.displayName}?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFollowAction}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-[1920px] mx-auto">
        {/* Channel Banner */}
        <div className="h-48 md:h-64 bg-gray-800 w-full relative overflow-hidden">
          {profile.bannerURL ? (
            <img
              src={profile.bannerURL}
              alt="Channel Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-600" />
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-8 py-6 border-b border-gray-700">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative -mt-16 md:mt-0">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full border-4 border-[#0f0f0f]"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-600 rounded-full border-4 border-[#0f0f0f] flex items-center justify-center text-white text-4xl">
                  {profile.displayName[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{profile.displayName}</h1>
              <p className="text-gray-400 mb-4">@{profile.username}</p>
              <div className="flex items-center gap-4">
                <div className="flex flex-wrap gap-4 text-gray-400">
                  <span>{projects.length} Projects</span>
                  <span>• {followerCount} {followerCount === 1 ? 'Follower' : 'Followers'}</span>
                  {profile.company && <span>• {profile.company}</span>}
                  {profile.role && <span>• {profile.role}</span>}
                </div>
                {user && user.uid !== profile.id && (
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${isFollowing ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-100 text-black'}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>
          </div>
          {profile.bio && (
            <p className="text-gray-400 mt-6 max-w-3xl">{profile.bio}</p>
          )}
        </div>

        {/* Projects Grid */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-400">No projects yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="relative pt-[56.25%]">
                    {project.thumbnailUrl ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">No thumbnail</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium mb-2">{project.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{project.description}</p>
                    {project.programmingLanguages?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.programmingLanguages.map((lang, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-700 text-sm text-gray-300 rounded"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}