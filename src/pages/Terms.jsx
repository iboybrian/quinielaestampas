import { motion } from 'framer-motion'
import { ScrollText, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import PageTransition from '../components/layout/PageTransition'

function Section({ title, paragraphs, richFirstWord }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-emerald-400 rounded-full inline-block flex-shrink-0" />
        {title}
      </h2>
      <div className="text-slate-300 text-sm leading-relaxed space-y-2">
        {paragraphs.map((p, i) => {
          const bold = richFirstWord?.[i]
          if (bold && p.startsWith(bold)) {
            return (
              <p key={i}>
                <strong className="text-white">{bold}</strong>
                {p.slice(bold.length)}
              </p>
            )
          }
          return <p key={i}>{p}</p>
        })}
      </div>
    </div>
  )
}

export default function Terms() {
  const navigate = useNavigate()
  const { t } = useLang()
  const tt = t.terms

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {tt.back}
        </motion.button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ScrollText className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-black text-white">{tt.title}</h1>
          </div>
          <p className="text-slate-400 text-sm">{tt.lastUpdated}</p>
        </motion.div>

        {tt.preamble && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="text-slate-300 text-sm leading-relaxed mb-10"
          >
            {tt.preamble}
          </motion.p>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {tt.sections.map((section, i) => (
            <Section
              key={i}
              title={section.title}
              paragraphs={section.paragraphs}
              richFirstWord={section.richFirstWord}
            />
          ))}
        </motion.div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-500">
          {tt.footer}
        </div>
      </div>
    </PageTransition>
  )
}
