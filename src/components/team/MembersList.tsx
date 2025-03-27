import React from 'react';

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
}

const MembersList: React.FC<MembersListProps> = ({ members, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 bottom-0 w-80 bg-white dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200 dark:border-gray-700/30 shadow-xl transform transition-transform duration-300 ease-in-out z-10">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-8.5rem)]">
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
  );
};

export default MembersList;