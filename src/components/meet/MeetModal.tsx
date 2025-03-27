import { useState } from 'react';
import JitsiMeet from './JitsiMeet';

interface MeetModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  teamId: string;
  userName: string;
}

const MeetModal: React.FC<MeetModalProps> = ({
  isOpen,
  onClose,
  teamName,
  teamId,
  userName
}) => {
  const [isMeetActive, setIsMeetActive] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsMeetActive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      {!isMeetActive ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Join Team Meeting
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You are about to join a video meeting with your team members.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsMeetActive(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      ) : (
        <JitsiMeet
          teamName={teamName}
          teamId={teamId}
          userName={userName}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default MeetModal;