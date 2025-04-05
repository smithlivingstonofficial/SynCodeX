import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: Date;
  visibility: string;
  userId: string;
  programmingLanguages: string[];
  views: number;
  likes: string[];
  channel?: {
    name: string;
    handle: string;
    logoUrl: string;
  };
}

interface UserPreferences {
  recentSearches: string[];
  viewedProjects: string[];
  preferredLanguages: string[];
  likedProjects: string[];
}

export const useRecommendations = () => {
  const [trendingProjects, setTrendingProjects] = useState<Project[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!auth.currentUser) return null;
      
      try {
        const userPrefsDoc = await getDoc(doc(db, 'userPreferences', auth.currentUser.uid));
        if (!userPrefsDoc.exists()) return null;
        
        return userPrefsDoc.data() as UserPreferences;
      } catch (err) {
        console.error('Error fetching user preferences:', err);
        return null;
      }
    };

    const fetchTrendingProjects = async () => {
      try {
        const projectsRef = collection(db, 'projects');
        const q = query(
          projectsRef,
          where('visibility', '==', 'public'),
          orderBy('views', 'desc'),
          limit(8)
        );

        const querySnapshot = await getDocs(q);
        const projects = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const channelDoc = await getDoc(doc(db, 'channels', data.userId));
            const channelData = channelDoc.exists() ? channelDoc.data() : {};

            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              channel: channelData ? {
                name: channelData.name,
                handle: channelData.handle,
                logoUrl: channelData.logoUrl
              } : undefined
            } as Project;
          })
        );

        setTrendingProjects(projects);
      } catch (err) {
        console.error('Error fetching trending projects:', err);
        setError('Failed to load trending projects');
      }
    };

    const fetchRecommendedProjects = async (userPrefs: UserPreferences | null) => {
      try {
        const projectsRef = collection(db, 'projects');
        let q;

        if (userPrefs?.preferredLanguages?.length) {
          // If user has preferences, query based on those
          q = query(
            projectsRef,
            where('visibility', '==', 'public'),
            where('programmingLanguages', 'array-contains-any', userPrefs.preferredLanguages),
            orderBy('views', 'desc'),
            limit(8)
          );
        } else {
          // Fallback to trending projects if no preferences
          q = query(
            projectsRef,
            where('visibility', '==', 'public'),
            orderBy('views', 'desc'),
            limit(8)
          );
        }

        const querySnapshot = await getDocs(q);
        const projects = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            try {
              const channelDoc = await getDoc(doc(db, 'channels', data.userId));
              const channelData = channelDoc.exists() ? channelDoc.data() : {};

              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                channel: channelData ? {
                  name: channelData.name,
                  handle: channelData.handle,
                  logoUrl: channelData.logoUrl
                } : undefined
              } as Project;
            } catch (channelErr) {
              console.error('Error fetching channel data:', channelErr);
              // Return project without channel data rather than failing completely
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date()
              } as Project;
            }
          })
        );

        setRecommendedProjects(projects);
      } catch (err) {
        console.error('Error fetching recommended projects:', err);
        setError('Failed to load recommended projects');
        // Set empty array to prevent undefined state
        setRecommendedProjects([]);
      }
    };

    const fetchRecentlyViewed = async (userPrefs: UserPreferences | null) => {
      if (!userPrefs || !userPrefs.viewedProjects.length) return;

      try {
        const recentProjects = await Promise.all(
          userPrefs.viewedProjects.slice(0, 4).map(async (projectId) => {
            const projectDoc = await getDoc(doc(db, 'projects', projectId));
            if (!projectDoc.exists()) return null;

            const data = projectDoc.data();
            const channelDoc = await getDoc(doc(db, 'channels', data.userId));
            const channelData = channelDoc.exists() ? channelDoc.data() : {};

            return {
              ...project,
              channel: {
                name: channelData.name || '',
                handle: channelData.handle || '',
                logoUrl: channelData.logoUrl || ''
              }
            };
          })
        );

        setRecentlyViewed(recentProjects.filter((p): p is Project => p !== null));
      } catch (err) {
        console.error('Error fetching recently viewed projects:', err);
        setError('Failed to load recently viewed projects');
      }
    };

    const initializeRecommendations = async () => {
      setLoading(true);
      const userPrefs = await fetchUserPreferences();
      await Promise.all([
        fetchTrendingProjects(),
        fetchRecommendedProjects(userPrefs),
        fetchRecentlyViewed(userPrefs)
      ]);
      setLoading(false);
    };

    initializeRecommendations();
  }, []);

  return {
    trendingProjects,
    recommendedProjects,
    recentlyViewed,
    loading,
    error
  };
};