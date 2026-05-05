import { Link } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'

// Site-wide legal footer rendered at the bottom of every page (in document flow,
// not fixed). The mobile bottom-nav `Footer` overlays on top with `md:hidden fixed`.
export default function SiteFooter() {
  const { t } = useLang()
  const f = t.siteFooter

  return (
    <footer className="mt-6 md:mt-12 border-t border-white/5 bg-gradient-to-b from-slate-900 to-emerald-950/40">
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-20 md:pb-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 text-center md:text-left">{f.rights}</span>
        <nav className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-emerald-500 hover:text-emerald-400 transition-colors font-semibold"
          >
            {f.privacy}
          </Link>
          <span className="text-slate-700">·</span>
          <Link
            to="/terms"
            className="text-emerald-500 hover:text-emerald-400 transition-colors font-semibold"
          >
            {f.terms}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
