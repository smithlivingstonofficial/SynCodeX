import { useState } from 'react';
import { auth, db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface InviteModalProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
}

interface EmailInput {
  id: string;
  value: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ teamId, teamName, onClose }) => {
  const [emailInputs, setEmailInputs] = useState<EmailInput[]>([{ id: '1', value: '', status: 'pending' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (id: string, value: string) => {
    setEmailInputs(prev =>
      prev.map(input =>
        input.id === id ? { ...input, value } : input
      )
    );
  };

  const addEmailInput = () => {
    setEmailInputs(prev => [...prev, { id: String(Date.now()), value: '', status: 'pending' }]);
  };

  const removeEmailInput = (id: string) => {
    if (emailInputs.length > 1) {
      setEmailInputs(prev => prev.filter(input => input.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in to send invites');
      return;
    }

    const validEmails = emailInputs.filter(input => {
      const email = input.value.trim();
      if (!email) return false;
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      if (!isValid) {
        setEmailInputs(prev =>
          prev.map(item =>
            item.id === input.id
              ? { ...item, status: 'error', error: 'Invalid email format' }
              : item
          )
        );
      }
      return isValid;
    });

    if (validEmails.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }

    setLoading(true);
    setError('');

    for (const input of validEmails) {
      try {
        setEmailInputs(prev =>
          prev.map(item =>
            item.id === input.id
              ? { ...item, status: 'pending' }
              : item
          )
        );

        const invitesRef = collection(db, 'team_invites');
        await addDoc(invitesRef, {
          teamId,
          teamName,
          email: input.value.trim(),
          status: 'pending',
          invitedBy: auth.currentUser?.uid,
          invitedByName: auth.currentUser?.displayName || 'Anonymous',
          createdAt: serverTimestamp()
        }).catch(error => {
          throw new Error(`Failed to create invite: ${error.message}`);
        });

        setEmailInputs(prev =>
          prev.map(item =>
            item.id === input.id
              ? { ...item, status: 'success' }
              : item
          )
        );
      } catch (err: any) {
        console.error('Error sending invite:', err);
        setEmailInputs(prev =>
          prev.map(item =>
            item.id === input.id
              ? { ...item, status: 'error', error: err.message || 'Failed to send invite' }
              : item
          )
        );
        setError('Failed to send one or more invites. Please try again.');
      }
    }

    const allSuccess = emailInputs.every(input => input.status === 'success');
    if (allSuccess) {
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    }
    setLoading(false);
  };

  const retryInvite = async (id: string) => {
    const input = emailInputs.find(input => input.id === id);
    if (!input || !auth.currentUser) {
      setError('Please sign in to send invites');
      return;
    }

    try {
      setEmailInputs(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: 'pending' }
            : item
        )
      );

      const invitesRef = collection(db, 'team_invites');
      await addDoc(invitesRef, {
        teamId,
        teamName,
        email: input.value.trim(),
        status: 'pending',
        invitedBy: auth.currentUser?.uid,
        invitedByName: auth.currentUser?.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      }).catch(error => {
        throw new Error(`Failed to create invite: ${error.message}`);
      });

      setEmailInputs(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: 'success' }
            : item
        )
      );
    } catch (err: any) {
      console.error('Error retrying invite:', err);
      setEmailInputs(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, status: 'error', error: err.message || 'Failed to send invite' }
            : item
        )
      );
      setError('Failed to retry invite. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Invite Members to {teamName}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {emailInputs.map((input, index) => (
            <div key={input.id} className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={input.value}
                  onChange={(e) => handleEmailChange(input.id, e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-2 rounded-lg border ${input.status === 'error' ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                />
                {input.status === 'success' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {input.status === 'error' && (
                  <div className="flex items-center space-x-2 absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="text-xs text-red-500">{input.error}</span>
                    <button
                      type="button"
                      onClick={() => retryInvite(input.id)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {emailInputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmailInput(input.id)}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addEmailInput}
              className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add another email
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-500 dark:text-green-400">
              Invitations sent successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                Sending invites...
              </div>
            ) : success ? (
              'Invites Sent!'
            ) : (
              'Send Invites'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;