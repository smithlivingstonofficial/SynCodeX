import { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const user = auth.currentUser;
  const db = getFirestore();
  const storage = getStorage();

  const handleUsernameClick = (username) => {
    navigate(`/channel/${username}`);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
          setEditedProfile(profileSnap.data());
        } else {
          // Generate a unique username
          const baseUsername = generateUsername(user.displayName || user.email?.split('@')[0] || 'user');
          const uniqueUsername = await generateUniqueUsername(baseUsername);
          
          // Create default profile if it doesn't exist
          const defaultProfile = {
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            username: uniqueUsername,
            email: user.email,
            photoURL: user.photoURL,
            bio: '',
            website: '',
            // Contact & Social Links
            phone: '',
            githubProfile: '',
            linkedinProfile: '',
            twitterProfile: '',
            discordId: '',
            // Work & Skills
            programmingLanguages: [],
            expertiseLevel: 'Beginner',
            role: '',
            company: '',
            // Preferences
            theme: 'dark',
            notificationPreferences: {
              email: true,
              push: true,
              inApp: true
            },
            privacySettings: {
              isPublic: true,
              allowInvites: true
            },
            editorSettings: {
              fontSize: 14,
              tabWidth: 2,
              theme: 'dark'
            },
            projects: [],
            joinedAt: new Date().toISOString(),
          };
          await setDoc(profileRef, defaultProfile);
          setProfile(defaultProfile);
          setEditedProfile(defaultProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, db]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedProfile({ ...profile });
    }
  };

  const [usernameError, setUsernameError] = useState(false);
  const handleInputChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'username') {
      checkUsernameAvailability(value).then(isAvailable => {
        setUsernameError(!isAvailable);
      });
    }
  };

  const generateUsername = (displayName) => {
    return displayName.toLowerCase().replace(/\s+/g, '');
  };

  const checkUsernameAvailability = async (username) => {
    const usersRef = collection(db, 'profiles');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const generateUniqueUsername = async (baseUsername) => {
    let username = baseUsername;
    let counter = 1;
    while (!(await checkUsernameAvailability(username))) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    return username;
  };

  const handleSave = async () => {
    try {
      let updatedProfile = { ...editedProfile };
      
      // Check if username has changed
      if (editedProfile.username !== profile.username) {
        const isAvailable = await checkUsernameAvailability(editedProfile.username);
        if (!isAvailable) {
          alert('This username is already taken. Please choose another one.');
          return;
        }
      }

      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, updatedProfile);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64 flex items-center justify-center">
        <div className="text-white">Please log in to view your profile</div>
      </div>
    );
  }

  const currentProfile = isEditing ? editedProfile : profile;

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update auth profile
      await updateProfile(user, { photoURL });

      // Update Firestore profile
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, { ...profile, photoURL }, { merge: true });

      setProfile(prev => ({ ...prev, photoURL }));
      setEditedProfile(prev => prev ? { ...prev, photoURL } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16 pl-64">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
                {currentProfile.photoURL ? (
                  <img
                    src={currentProfile.photoURL}
                    alt="Profile"
                    className="w-24 h-24 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleProfilePictureClick}
                  />
                ) : (
                  <div
                    className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center text-white text-3xl cursor-pointer hover:bg-gray-500 transition-colors"
                    onClick={handleProfilePictureClick}
                  >
                    {currentProfile.displayName[0].toUpperCase()}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentProfile.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="bg-gray-700 text-white px-3 py-2 rounded-md mb-2 w-full"
                    />
                    <input
                      type="text"
                      value={currentProfile.username}
                      onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className={`bg-gray-700 text-white px-3 py-2 rounded-md w-full ${usernameError ? 'border-2 border-red-500' : ''}`}
                      placeholder="Choose your username"
                    />
                    {usernameError && (
                      <p className="text-red-500 text-sm mt-1">This username is already taken</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-white">{currentProfile.displayName}</h1>
                    <p 
                      className="text-gray-400 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => handleUsernameClick(currentProfile.username)}
                    >
                      @{currentProfile.username}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={isEditing ? handleSave : handleEditToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Bio</h2>
              {isEditing ? (
                <textarea
                  value={currentProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  rows="3"
                />
              ) : (
                <p className="text-gray-400">{currentProfile.bio || 'No bio yet'}</p>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Contact & Social Links</h2>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Website"
                    value={currentProfile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="GitHub Profile"
                    value={currentProfile.githubProfile}
                    onChange={(e) => handleInputChange('githubProfile', e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="LinkedIn Profile"
                    value={currentProfile.linkedinProfile}
                    onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Twitter Profile"
                    value={currentProfile.twitterProfile}
                    onChange={(e) => handleInputChange('twitterProfile', e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentProfile.website && (
                    <a href={currentProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      Website
                    </a>
                  )}
                  {currentProfile.githubProfile && (
                    <a href={currentProfile.githubProfile} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      GitHub
                    </a>
                  )}
                  {currentProfile.linkedinProfile && (
                    <a href={currentProfile.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      LinkedIn
                    </a>
                  )}
                  {currentProfile.twitterProfile && (
                    <a href={currentProfile.twitterProfile} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Work & Skills</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-1">Role</label>
                    <input
                      type="text"
                      value={currentProfile.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={currentProfile.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                      placeholder="Company/Organization"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1">Expertise Level</label>
                    <select
                      value={currentProfile.expertiseLevel}
                      onChange={(e) => handleInputChange('expertiseLevel', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-400">Role: {currentProfile.role || 'Not specified'}</p>
                  <p className="text-gray-400">Company: {currentProfile.company || 'Not specified'}</p>
                  <p className="text-gray-400">Expertise Level: {currentProfile.expertiseLevel}</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Projects</h2>
              {currentProfile.projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentProfile.projects.map((project, index) => (
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
              <h2 className="text-xl font-semibold text-white mb-2">Account Details</h2>
              <p className="text-gray-400">Joined: {new Date(currentProfile.joinedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}