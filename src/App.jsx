import { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Navbar from './components/layout/Navbar'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import SiteFooter from './components/layout/SiteFooter'

import Home from './pages/Home'
import Auth from './pages/Auth'
import QuinielaHub from './pages/QuinielaHub'
import QuinielaGroup from './pages/QuinielaGroup'
import ManageQuiniela from './pages/ManageQuiniela'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Reset scroll on route change so users don't land mid-page after navigating
  useEffect(() => { window.scrollTo({ top: 0, left: 0 }) }, [location.pathname])

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
          <Route path="/quiniela/:id/manage" element={<ManageQuiniela />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Catch-all → home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AnimatePresence>

      {/* Site-wide legal footer (always in flow) */}
      <SiteFooter />

      {/* Mobile bottom nav (md:hidden, fixed) */}
      <Footer />
    </div>
  )
}
