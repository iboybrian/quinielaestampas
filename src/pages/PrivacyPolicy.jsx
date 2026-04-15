import { motion } from 'framer-motion'
import { Shield, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/layout/PageTransition'

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-amber-400 rounded-full inline-block" />
        {title}
      </h2>
      <div className="text-slate-400 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyPolicy() {
  const navigate = useNavigate()
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-amber-400" />
            <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
          </div>
          <p className="text-slate-500 text-sm">Last updated: April 14, 2026</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section title="Information We Collect">
            <p>We collect information you provide directly to us when you create an account, including your email address, username, and optional country.</p>
            <p>We also collect usage data such as match predictions you submit, stickers you mark in your collection, and messages you send through the trade chat.</p>
            <p>When using the app, we automatically receive basic technical information such as your browser type, IP address, and session identifiers.</p>
          </Section>

          <Section title="How We Use Your Information">
            <p>Your information is used to operate and provide the WC 2026 Hub services, including maintaining your account, displaying leaderboards, and enabling sticker trading.</p>
            <p>We do not sell, rent, or share your personal information with third parties for their marketing purposes.</p>
            <p>Match predictions are visible to other members of the same Quiniela group after match kick-off.</p>
          </Section>

          <Section title="Data Storage">
            <p>All user data is stored securely in Supabase, which provides encrypted storage and row-level security. Only you can read and modify your own predictions, sticker collection, and profile information.</p>
            <p>Chat messages within trade conversations are stored and visible only to the two participants of the trade.</p>
          </Section>

          <Section title="Cookies & Local Storage">
            <p>We use browser local storage to maintain your session so you remain logged in across visits. No third-party tracking cookies are used.</p>
          </Section>

          <Section title="Third-Party Services">
            <p><strong className="text-white">Supabase</strong> — database and authentication provider. Subject to Supabase's privacy policy.</p>
            <p><strong className="text-white">API-Football</strong> — used to fetch live match scores. No personal data is shared with this service.</p>
            <p><strong className="text-white">Google Fonts</strong> — the Inter typeface is loaded from Google's CDN. Google may log font requests.</p>
          </Section>

          <Section title="Your Rights">
            <p>You may request deletion of your account and all associated data at any time by contacting us. Upon deletion, your predictions, sticker data, and chat messages will be permanently removed.</p>
            <p>You can update your username and country at any time from the Profile page.</p>
          </Section>

          <Section title="Children's Privacy">
            <p>WC 2026 Hub is not directed at children under the age of 13. We do not knowingly collect personal information from children.</p>
          </Section>

          <Section title="Changes to This Policy">
            <p>We may update this privacy policy from time to time. We will notify you of any changes by updating the date at the top of this document. Continued use of the app after changes constitutes acceptance of the revised policy.</p>
          </Section>

          <Section title="Contact">
            <p>If you have questions about this privacy policy, please open an issue in the project repository or contact the administrator of your WC 2026 Hub instance.</p>
          </Section>
        </motion.div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-700">
          WC 2026 Hub — built with React, Supabase & ❤️
        </div>
      </div>
    </PageTransition>
  )
}
