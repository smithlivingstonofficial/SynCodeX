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
}

const MembersList: React.FC<MembersListProps> = ({ members }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700/30">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{members.length} members</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {members.map(member => (
            <div 
              key={member.id} 
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-2 ring-white dark:ring-gray-800 group-hover:ring-blue-500 transition-all duration-200">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                  {member.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize flex items-center space-x-1">
                  <span>{member.role}</span>
                  {member.lastActive && (
                    <>
                      <span>•</span>
                      <span>Last seen {member.lastActive.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembersList;