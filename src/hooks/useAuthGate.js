import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Wraps an action behind an auth check. If the user is signed in, runs the
// callback immediately. Otherwise opens the AuthGateModal with optional context
// (title/message). Consumer renders <AuthGateModal {...gateProps} />.
export function useAuthGate() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState({ title: undefined, message: undefined })

  const close = useCallback(() => setOpen(false), [])

  const requireAuth = useCallback((cb, ctx) => {
    if (user) {
      cb?.()
      return true
    }
    setContext({ title: ctx?.title, message: ctx?.message })
    setOpen(true)
    return false
  }, [user])

  return {
    requireAuth,
    isAuthed: !!user,
    gateProps: { open, onClose: close, title: context.title, message: context.message },
  }
}
