import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Navbar from '../shared/Navbar';
import Sidebar from '../shared/Sidebar';
import TeamChat from './TeamChat';

interface TeamData {
  id: string;
  name: string;
  bio: string;
  profileUrl: string;
  createdBy: string;
  createdAt: Date;
  members: Record<string, string>;
}

interface TeamMember {
  id: string;
  name: string;
  photoURL: string;
  role: string;
  lastActive?: Date;
}

const TeamView = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamAndMembers = async () => {
      if (!teamId || !auth.currentUser) {
        setError('Please sign in to view team details');
        setLoading(false);
        return;
      }

      try {
        // Fetch team data
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (!teamDoc.exists()) {
          setError('Team not found. Please check the team ID and try again.');
          setLoading(false);
          return;
        }

        const teamData = teamDoc.data();
        if (!teamData || !teamData.name || !teamData.members) {
          setError('Invalid team data structure');
          setLoading(false);
          return;
        }

        // Check if current user is a team member
        if (!teamData.members[auth.currentUser.uid]) {
          setError('You do not have permission to view this team');
          setLoading(false);
          return;
        }

        const formattedTeamData = {
          id: teamDoc.id,
          ...teamData,
          createdAt: teamData.createdAt?.toDate() || new Date()
        } as TeamData;
        setTeam(formattedTeamData);

        // Fetch team members
        const usersRef = collection(db, 'users');
        const memberIds = Object.keys(formattedTeamData.members);
        
        if (memberIds.length === 0) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const membersQuery = query(usersRef, where('uid', 'in', memberIds));
        const membersSnapshot = await getDocs(membersQuery);

        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || 'Anonymous',
          photoURL: doc.data().photoURL || '',
          role: formattedTeamData.members[doc.id] || 'member',
          lastActive: doc.data().lastActive?.toDate()
        }));

        setMembers(membersData);
      } catch (err: any) {
        console.error('Error fetching team data:', err);
        setError(err.message || 'Failed to load team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAndMembers();
  }, [teamId]);

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Please sign in to view team details</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <Sidebar />
        <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
          <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
            <div className="text-red-500 dark:text-red-400">{error || 'Team not found'}</div>
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
          {/* Team Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                {team.profileUrl ? (
                  <img
                    src={team.profileUrl}
                    alt={team.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {team.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{team.bio}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
            {/* Chat Section */}
            <div className="h-full">
              <TeamChat teamId={teamId!} />
            </div>

            {/* Members Section */}
            <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-gray-700/30 p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Team Members ({members.length})
              </h2>
              <div className="space-y-4">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {member.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      {member.lastActive && Date.now() - member.lastActive.getTime() < 300000 && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamView;