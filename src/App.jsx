import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'

import Home from './pages/Home'
import Auth from './pages/Auth'
import QuinielaHub from './pages/QuinielaHub'
import QuinielaGroup from './pages/QuinielaGroup'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import PrivacyPolicy from './pages/PrivacyPolicy'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#050B1A] text-white">
      {/* Global top navbar */}
      <Navbar onMenuOpen={() => setSidebarOpen(true)} />

      {/* Left slide-out sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Page routes with transitions */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/quiniela" element={<QuinielaHub />} />
          <Route path="/quiniela/:id" element={<QuinielaGroup />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AnimatePresence>

      {/* Fixed bottom footer */}
      <Footer />
    </div>
  )
}
