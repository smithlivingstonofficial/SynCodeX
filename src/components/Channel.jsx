import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useSidebar } from '../contexts/SidebarContext';
import { jellyTriangle } from 'ldrs';

jellyTriangle.register();

export default function Channel() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const db = getFirestore();

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
          setProfile(profileData);

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
  }, [username, db]);

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
              <div className="flex flex-wrap gap-4 text-gray-400">
                <span>{projects.length} Projects</span>
                {profile.company && <span>• {profile.company}</span>}
                {profile.role && <span>• {profile.role}</span>}
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