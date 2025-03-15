import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { jellyTriangle } from 'ldrs'
import { SidebarProvider } from './contexts/SidebarContext'
import Home from './components/Home'
import Login from './components/auth/Login'
import Profile from './components/Profile'
import Channel from './components/Channel'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Projects from './components/Projects'
import Upload from './components/Upload'
import ProjectView from './components/ProjectView'
import CodeEditor from './components/CodeEditor'

jellyTriangle.register()

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <l-jelly-triangle
        size="40"
        speed="1.75"
        color="white"
      ></l-jelly-triangle>
    </div>
  }

  return (
    <Router>
      <SidebarProvider>
        {user && (
          <>
            <Navbar />
            <Sidebar />
          </>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/channel/:username" element={<Channel />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/editor/:projectId" element={<CodeEditor />} />
        </Routes>
      </SidebarProvider>
    </Router>
  )
}

export default App;