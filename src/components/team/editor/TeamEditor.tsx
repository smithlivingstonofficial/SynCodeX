import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, setDoc, serverTimestamp, collection } from 'firebase/firestore';
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

const TeamEditor = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!teamId || !user) return;

    const collabRef = doc(db, 'teams', teamId, 'collab', 'current');
    const cursorsRef = collection(db, 'teams', teamId, 'cursors');
    
    const unsubscribeCollab = onSnapshot(collabRef, (snapshot) => {
      if (snapshot.exists()) {
        const collabData = snapshot.data() as CollabData;
        setCode(collabData.content);
        setVersion(collabData.version);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching collab data:', error);
      setError('Failed to sync with the team. Please check your connection.');
      setIsLoading(false);
    });

    const unsubscribeCursors = onSnapshot(cursorsRef, (snapshot) => {
      const newCursors: CursorPosition[] = [];
      snapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          newCursors.push({ ...doc.data() } as CursorPosition);
        }
      });
      setCursors(newCursors);
    });

    return () => {
      unsubscribeCollab();
      unsubscribeCursors();
    };
  }, [teamId, user]);

  const handleCodeChange = async (newCode: string) => {
    if (!teamId || !user) return;

    try {
      const collabRef = doc(db, 'teams', teamId, 'collab', 'current');
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
          <Editor
            initialValue={code}
            onChange={handleCodeChange}
            onCursorChange={handleCursorChange}
            cursors={cursors}
            language="javascript"
          />
        </div>
      </div>
    </div>
  );
};

export default TeamEditor;