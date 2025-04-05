import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  createdAt: Date;
}

interface TeamChatProps {
  teamId: string;
}

const TeamChat: React.FC<TeamChatProps> = ({ teamId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!teamId) return;

    const messagesRef = collection(db, 'teams', teamId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Message[];

      setMessages(newMessages.reverse());
      setLoading(false);
      setTimeout(() => scrollToBottom(), 100);
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'teams', teamId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhotoURL: auth.currentUser.photoURL || '',
        createdAt: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No messages yet
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-end space-x-2 max-w-[70%] ${message.userId === auth.currentUser?.uid ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {message.userPhotoURL ? (
                    <img
                      src={message.userPhotoURL}
                      alt={message.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      {message.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 ${message.userId === auth.currentUser?.uid
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
                >
                  <div className="text-sm">{message.text}</div>
                  <div className="text-[10px] mt-1 opacity-70">
                    {message.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-white dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/30">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamChat;