import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Profile from './components/pages/Profile';
import Upload from './components/pages/Upload';
import ProjectView from './components/pages/ProjectView';
import Projects from './components/project/Projects';
import Channel from './components/pages/Channel';
import TeamCreate from './components/team/TeamCreate';
import Teams from './components/team/Teams';
import TeamView from './components/team/TeamView';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('user');
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/home" element={user ? <Home /> : <Login />} />
        <Route path="/profile" element={user ? <Profile /> : <Login />} />
        <Route path="/upload" element={user ? <Upload /> : <Login />} />
        <Route path="/:projectId" element={<ProjectView />} />
        <Route path="/projects" element={user? <Projects /> : <Login />} />
        <Route path="/channel/:handle" element={<Channel />} />

        <Route path="/teams" element={user ? <Teams /> : <Login />} />
        <Route path="/teams/create" element={user ? <TeamCreate /> : <Login />} />
        <Route path="/teams/:teamId" element={user ? <TeamView /> : <Login />} />
      </Routes>
    </Router>
  );
}

export default App;
