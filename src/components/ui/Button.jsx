import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20',
  secondary: 'bg-white/10 hover:bg-white/15 border border-white/10 text-white',
  emerald: 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20',
  danger: 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400',
  ghost: 'hover:bg-white/5 text-slate-400 hover:text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-2xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}) {
  return (
    <motion.button
      type={type}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
}
