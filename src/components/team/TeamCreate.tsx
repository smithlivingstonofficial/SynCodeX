import { useState } from 'react';
import { auth, db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';

interface TeamData {
  name: string;
  bio: string;
  profileUrl: string;
  createdBy: string;
  createdAt: Date;
  members: Record<string, string>;
}

const TeamCreate = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [teamBio, setTeamBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in to create a team');
      return;
    }

    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let profileUrl = '';
      if (profileImage) {
        const storageRef = ref(storage, `team-profiles/${Date.now()}-${profileImage.name}`);
        const uploadResult = await uploadBytes(storageRef, profileImage);
        profileUrl = await getDownloadURL(uploadResult.ref);
      }

      const teamData: TeamData = {
        name: teamName.trim(),
        bio: teamBio.trim(),
        profileUrl,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
        members: {
          [auth.currentUser.uid]: 'admin'
        }
      };

      await addDoc(collection(db, 'teams'), teamData);
      navigate('/teams');
    } catch (err) {
      console.error('Error creating team:', err);
      if (err instanceof Error && err.message.includes('permission-denied')) {
        setError('You do not have permission to create a team. Please check your account status.');
      } else {
        setError('Failed to create team. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Create New Team
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Team Profile
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Team profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="team-profile"
                  />
                  <label
                    htmlFor="team-profile"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    Upload Image
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Max file size: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Team Name */}
            <div>
              <label
                htmlFor="team-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Team Name
              </label>
              <input
                type="text"
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter team name"
                required
              />
            </div>

            {/* Team Bio */}
            <div>
              <label
                htmlFor="team-bio"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Team Bio
              </label>
              <textarea
                id="team-bio"
                value={teamBio}
                onChange={(e) => setTeamBio(e.target.value)}
                rows={4}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about your team"
              />
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Create Team'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeamCreate;