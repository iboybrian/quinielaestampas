import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Send, ArrowRightLeft, ShoppingBag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { buildContextPayload } from '../../hooks/useChats'

function ChatBubble({ message, isMine }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
        isMine
          ? 'bg-amber-500 text-black font-medium rounded-br-sm'
          : 'bg-white/10 text-white rounded-bl-sm'
      }`}>
        {message.content}
      </div>
    </motion.div>
  )
}

export default function TradeChat({ isOpen, onClose, partner, context, onTradeResolved }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [tradeId, setTradeId] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !user || !partner) return
    // Find or create trade request
    async function initChat() {
      let { data: trade } = await supabase
        .from('trade_requests')
        .select('id')
        .or(
          `and(from_user.eq.${user.id},to_user.eq.${partner.id}),` +
          `and(from_user.eq.${partner.id},to_user.eq.${user.id})`
        )
        .eq('status', 'pending')
        .maybeSingle()

      if (!trade) {
        const { data } = await supabase
          .from('trade_requests')
          .insert({
            from_user: user.id,
            to_user: partner.id,
            offering_stickers: [],
            wanting_stickers: buildContextPayload(context),
          })
          .select('id')
          .single()
        trade = data
      }

      if (trade) {
        setTradeId(trade.id)
        onTradeResolved?.(trade.id)
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('trade_id', trade.id)
          .order('created_at', { ascending: true })
        setMessages(msgs ?? [])
      }
    }
    initChat()
  }, [isOpen, user, partner])

  useEffect(() => {
    if (!tradeId) return
    const channel = supabase
      .channel(`chat-${tradeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trade_id=eq.${tradeId}` }, (payload) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === payload.new.id)
          return exists ? prev : [...prev, payload.new]
        })
      })
      .subscribe()
    return () => channel.unsubscribe()
  }, [tradeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !tradeId || !user || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    // Optimistic update — sender sees message immediately
    const optimistic = { id: `opt-${Date.now()}`, trade_id: tradeId, sender_id: user.id, content, created_at: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    try {
      const { data: saved } = await supabase
        .from('messages')
        .insert({ trade_id: tradeId, sender_id: user.id, content })
        .select()
        .single()
      // Replace optimistic with real record (Realtime dedup by id)
      if (saved) setMessages((prev) => prev.map((m) => m.id === optimistic.id ? saved : m))
    } catch {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!partner) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-md bg-[#0A1628] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: '520px' }}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/5">
              {partner.avatar_url ? (
                <img src={partner.avatar_url} alt={partner.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black font-black flex-shrink-0">
                  {partner.username?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{partner.username}</div>
                {context?.type === 'mercado' ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShoppingBag className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-xs text-violet-400 truncate">
                      Mercado{context.sticker ? ` · ${context.sticker.name}` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ArrowRightLeft className="w-3 h-3" />
                    Intercambio
                  </div>
                )}
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-600 text-sm mt-8">
                  Start the conversation! Propose a trade with {partner.username}.
                </div>
              )}
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-400/40 transition-colors"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500 text-white disabled:opacity-40 hover:bg-emerald-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
