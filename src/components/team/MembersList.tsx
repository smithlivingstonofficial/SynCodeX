import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  photoURL: string;
  role: string;
  lastActive?: Date;
}

interface MembersListProps {
  members: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

const MembersList: React.FC<MembersListProps> = ({ members, isOpen, onClose, teamId }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  if (!isOpen) return null;

  const handleInvite = () => {
    // Generate a unique invite link using the teamId
    const link = `${window.location.origin}/teams/join/${teamId}`;
    setInviteLink(link);
    setShowInviteModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700/30 shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInvite}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Invite Members"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {members.map(member => (
            <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
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
              {member.lastActive && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {member.lastActive.toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invite Team Members</h3>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersList;