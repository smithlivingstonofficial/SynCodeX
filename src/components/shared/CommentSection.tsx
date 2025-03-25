import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, deleteDoc } from 'firebase/firestore';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  createdAt: Timestamp;
  likes: string[];
}

interface CommentSectionProps {
  projectId: string;
  isModal?: boolean;
}

const CommentSection = ({ projectId, isModal = false }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;

    const commentsQuery = query(
      collection(db, `projects/${projectId}/comments`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, 
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setComments(commentsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching comments:', error);
        setError('Failed to load comments');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    if (!projectId) {
      setError('Invalid project reference');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const commentData = {
        projectId,
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhotoUrl: auth.currentUser.photoURL || '',
        createdAt: Timestamp.now(),
        likes: []
      };
      
      await addDoc(collection(db, `projects/${projectId}/comments`), commentData);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string, likes: string[]) => {
    if (!auth.currentUser) return;

    try {
      const commentRef = doc(db, `projects/${projectId}/comments`, commentId);
      const userId = auth.currentUser.uid;

      if (likes.includes(userId)) {
        await updateDoc(commentRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(userId)
        });
      }
    } catch (err) {
      console.error('Error updating like:', err);
    }
  };

  const handleDeleteComment = async (commentId: string, userId: string) => {
    if (!auth.currentUser || auth.currentUser.uid !== userId) return;

    try {
      await deleteDoc(doc(db, `projects/${projectId}/comments`, commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'h-full flex flex-col' : 'mt-8'} space-y-6`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white sticky top-0 bg-white dark:bg-gray-950 py-4 z-10 border-b border-gray-200 dark:border-gray-800">
        Comments
      </h2>
      
      {/* Comments List */}
      <div className={`space-y-4 ${isModal ? 'flex-1 overflow-y-auto px-4' : ''}`}>
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <div className="flex-shrink-0">
              <img
                src={comment.userPhotoUrl || '/default-avatar.png'}
                alt={comment.userName}
                className="h-8 w-8 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 max-w-[85%] inline-block">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {comment.userName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-sm break-words">{comment.text}</p>
              </div>
              <div className="mt-1 flex items-center space-x-4">
                <button
                  onClick={() => handleLikeComment(comment.id, comment.likes)}
                  className={`flex items-center space-x-1 text-xs ${comment.likes.includes(auth.currentUser?.uid || '') ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill={comment.likes.includes(auth.currentUser?.uid || '') ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  <span>{comment.likes.length}</span>
                </button>
                {auth.currentUser?.uid === comment.userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id, comment.userId)}
                    className="text-xs text-red-500 hover:text-red-600 transition-colors duration-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Form */}
      <div className={`${isModal ? 'sticky bottom-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4' : 'mt-6'}`}>
        {auth.currentUser ? (
          <form onSubmit={handleSubmitComment} className="relative">
            <div className="flex items-end space-x-2">
              <div className="flex-shrink-0">
                <img
                  src={auth.currentUser.photoURL || '/default-avatar.png'}
                  alt={auth.currentUser.displayName || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="flex-shrink-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Please sign in to comment</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 dark:text-red-400 text-center py-4 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default CommentSection;