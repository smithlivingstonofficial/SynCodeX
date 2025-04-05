import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../../../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const InviteHandler = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    const checkInvite = async () => {
      if (!inviteId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const inviteRef = doc(db, 'team_invites', inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        const data = inviteSnap.data();
        if (data.status !== 'pending') {
          setError('This invitation has already been used');
          setLoading(false);
          return;
        }

        setInviteData(data);
      } catch (err) {
        console.error('Error checking invite:', err);
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [inviteId]);

  const handleAcceptInvite = async () => {
    if (!auth.currentUser || !inviteData || !inviteId) return;

    try {
      setLoading(true);

      // Update team members
      const teamRef = doc(db, 'teams', inviteData.teamId);
      await updateDoc(teamRef, {
        [`members.${auth.currentUser.uid}`]: 'member'
      });

      // Update invite status
      const inviteRef = doc(db, 'team_invites', inviteId);
      await updateDoc(inviteRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: auth.currentUser.uid
      });

      // Add user to team's members collection
      const memberRef = doc(db, 'teams', inviteData.teamId, 'members', auth.currentUser.uid);
      await setDoc(memberRef, {
        uid: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL || '',
        role: 'member',
        joinedAt: serverTimestamp()
      });

      navigate(`/teams/${inviteData.teamId}`);
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invitation');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 dark:text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/teams')}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go to Teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Invitation
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You've been invited to join <span className="font-semibold">{inviteData?.teamName}</span>
        </p>
        <div className="space-y-4">
          <button
            onClick={handleAcceptInvite}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Joining...' : 'Accept Invitation'}
          </button>
          <button
            onClick={() => navigate('/teams')}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteHandler;