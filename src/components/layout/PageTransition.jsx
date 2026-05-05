import { motion, useReducedMotion } from 'framer-motion'

export default function PageTransition({ children }) {
  const shouldReduce = useReducedMotion()

  const variants = {
    initial: { opacity: 0, y: shouldReduce ? 0 : 12 },
    enter:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit:    { opacity: 0, y: shouldReduce ? 0 : -6, transition: { duration: 0.12 } },
  }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="min-h-screen pt-16 pb-6 md:pb-8"
    >
      {children}
    </motion.div>
  )
}
