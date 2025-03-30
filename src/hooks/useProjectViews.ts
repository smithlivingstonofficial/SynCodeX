import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export const useProjectViews = (projectId: string) => {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackView = async () => {
      if (!projectId || !auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        const viewKey = `${userId}_${projectId}`;
        const viewRef = doc(db, 'project_views', viewKey);
        const projectRef = doc(db, 'projects', projectId);

        // Get the current view count
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          setViewCount(projectDoc.data().views || 0);
        }

        // Check if user has viewed this project before
        const viewDoc = await getDoc(viewRef);
        const now = new Date();
        const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

        if (!viewDoc.exists() || viewDoc.data().lastViewed.toDate() < threeHoursAgo) {
          // Update view timestamp
          await setDoc(viewRef, { lastViewed: now }, { merge: true });

          // Increment project view count
          await updateDoc(projectRef, {
            views: increment(1)
          });

          setViewCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error tracking view:', error);
      } finally {
        setLoading(false);
      }
    };

    trackView();
  }, [projectId]);

  return { viewCount, loading };
};