import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import Navbar from '../../shared/Navbar';
import Sidebar from '../../shared/Sidebar';
import Editor from './Editor';

interface CursorPosition {
  userId: string;
  line: number;
  column: number;
  userName: string;
}

interface CollabData {
  content: string;
  lastModifiedBy: string;
  lastModifiedAt: any;
  userName: string;
  version: number;
}

const SHARED_EDITOR_ID = 'shared-editor';

const TeamEditor = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [isCollabInitialized, setIsCollabInitialized] = useState(false);

  const initializeCollab = async () => {
    if (!teamId || !user || isCollabInitialized) return;
    setIsSaving(true);
    setError('');
  
    try {
      // Verify team access first
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }
      
      const teamData = teamDoc.data();
      if (!teamData?.members?.[user.uid]) {
        throw new Error('You do not have permission to access this team');
      }
  
      const collabRef = doc(db, 'teams', teamId, 'collab', SHARED_EDITOR_ID);
      const collabDoc = await getDoc(collabRef);
  
      // If collab document already exists, just update the version
      if (collabDoc.exists()) {
        const data = collabDoc.data();
        setCode(data.content || '');
        setVersion(data.version || 1);
        setIsCollabInitialized(true);
        return;
      }

      // Create new collab document
      await setDoc(collabRef, {
        content: code,
        lastModifiedBy: user.uid,
        lastModifiedAt: serverTimestamp(),
        userName: user.displayName || user.email,
        version: 1
      });

      setIsCollabInitialized(true);
      setVersion(1);
    } catch (error) {
      console.error('Error initializing collaboration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize collaboration';
      setError(`Initialization failed: ${errorMessage}. Please try again.`);
      setIsCollabInitialized(false);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!teamId || !user) return;
  
    const fetchInitialData = async () => {
      try {
        const collabRef = doc(db, 'teams', teamId, 'collab', SHARED_EDITOR_ID);
        const unsubscribe = onSnapshot(collabRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as CollabData;
            setCode(data.content);
            setVersion(data.version);
            setIsCollabInitialized(true);
          }
          setIsLoading(false);
        });
  
        return unsubscribe;
      } catch (error) {
        console.error('Error fetching collab data:', error);
        setError('Failed to load collaboration data');
        setIsLoading(false);
      }
    };
  
    const unsubscribeCursors = onSnapshot(
      collection(db, 'teams', teamId, 'cursors'),
      (snapshot) => {
        const cursorData = snapshot.docs
          .filter((doc) => doc.id !== user.uid)
          .map((doc) => ({
            userId: doc.id,
            ...doc.data(),
          })) as CursorPosition[];
        setCursors(cursorData);
      }
    );
  
    const cleanup = fetchInitialData();
  
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.());
      unsubscribeCursors();
    };
  }, [teamId, user]);

  const handleCodeChange = async (newCode: string) => {
    if (!teamId || !user) return;

    try {
      const collabRef = doc(db, 'teams', teamId, 'collab', SHARED_EDITOR_ID);
      await setDoc(collabRef, {
        content: newCode,
        lastModifiedBy: user.uid,
        lastModifiedAt: serverTimestamp(),
        userName: user.displayName || user.email,
        version: version + 1
      });
      setVersion((prev) => prev + 1);
    } catch (error) {
      console.error('Error saving collab data:', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  const handleCursorChange = async (position: { line: number; column: number }) => {
    if (!teamId || !user) return;

    try {
      const cursorRef = doc(db, 'teams', teamId, 'cursors', user.uid);
      await setDoc(cursorRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        line: position.line,
        column: position.column,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)] pt-14 transition-[padding] duration-200">
        <div className="h-[calc(100vh-3.5rem)]">
          <div className="bg-gray-100 dark:bg-gray-900/40 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/30 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!isCollabInitialized && (
                <button
                  onClick={initializeCollab}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Initializing...</span>
                    </>
                  ) : (
                    'Start Collaboration'
                  )}
                </button>
              )}
              {error && <div className="text-red-500">{error}</div>}
            </div>
          </div>
          <Editor
            initialValue={code}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            cursors={cursors}
            readOnly={!isCollabInitialized}
          />
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;