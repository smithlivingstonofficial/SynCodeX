import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'teamInvitation';
  teamId: string;
  teamName: string;
  teamProfileUrl: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const invitationsRef = collection(db, 'teamInvitations');
    const userInvitationsQuery = query(
      invitationsRef,
      where('invitedUserId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(userInvitationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptInvitation = async (notificationId: string, teamId: string) => {
    if (!auth.currentUser) return;

    try {
      // Update team members
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        [`members.${auth.currentUser.uid}`]: 'member'
      });

      // Delete the invitation
      const invitationRef = doc(db, 'teamInvitations', notificationId);
      await deleteDoc(invitationRef);

      setShowDropdown(false);
    } catch (err) {
      console.error('Error accepting invitation:', err);
    }
  };

  const handleDeclineInvitation = async (notificationId: string) => {
    try {
      const invitationRef = doc(db, 'teamInvitations', notificationId);
      await deleteDoc(invitationRef);
      setShowDropdown(false);
    } catch (err) {
      console.error('Error declining invitation:', err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                      {notification.teamProfileUrl ? (
                        <img
                          src={notification.teamProfileUrl}
                          alt={notification.teamName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          {notification.teamName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{notification.invitedByName}</span> invited you to join{' '}
                        <span className="font-medium">{notification.teamName}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {notification.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptInvitation(notification.id, notification.teamId)}
                      className="flex-1 px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineInvitation(notification.id)}
                      className="flex-1 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;