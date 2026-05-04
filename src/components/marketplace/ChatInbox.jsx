import { motion } from 'framer-motion'
import { MessageSquare, Loader2, ArrowRightLeft, ShoppingBag } from 'lucide-react'
import { useChats } from '../../hooks/useChats'
import { useAuth } from '../../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLang } from '../../contexts/LangContext'
import { countryNameToCode } from '../../lib/countries'
import Flag from '../ui/Flag'

function ContextBadge({ type, sticker }) {
  if (!type) return null
  if (type === 'mercado') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/15 text-violet-400">
        <ShoppingBag className="w-2.5 h-2.5" />
        Mercado{sticker ? ` · ${sticker.name}` : ''}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
      <ArrowRightLeft className="w-2.5 h-2.5" />
      Intercambio
    </span>
  )
}

function ChatRow({ chat, onOpen, unread, currentUserId }) {
  const letter    = chat.partner.username?.[0]?.toUpperCase() ?? '?'
  const hasUnread = unread && unread.count > 0
  const isMine    = chat.lastMsg?.sender_id === currentUserId
  const timeAgo   = chat.lastMsg
    ? formatDistanceToNow(new Date(chat.lastMsg.created_at), { addSuffix: true, locale: es })
    : ''

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(chat)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
        hasUnread
          ? 'bg-amber-400/8 border border-amber-400/25 hover:bg-amber-400/12'
          : 'bg-white/5 border border-white/5 hover:bg-white/8'
      }`}
    >
      {/* Avatar + unread dot */}
      <div className="relative flex-shrink-0">
        {chat.partner.avatar_url ? (
          <img src={chat.partner.avatar_url} alt={chat.partner.username}
            className="w-11 h-11 rounded-full object-cover" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black font-black">
            {letter}
          </div>
        )}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
            {unread.count > 9 ? '9+' : unread.count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`flex items-center gap-1.5 font-bold truncate ${hasUnread ? 'text-white' : 'text-slate-200'}`}>
            <span className="truncate">{chat.partner.username ?? 'Collector'}</span>
            {chat.partner.country && countryNameToCode(chat.partner.country) && (
              <Flag code={countryNameToCode(chat.partner.country)} size="xs" />
            )}
          </span>
          <span className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo}</span>
        </div>
        <ContextBadge type={chat.context.type} sticker={chat.context.sticker} />
        {chat.lastMsg && (
          <p className={`text-xs mt-1 truncate ${hasUnread ? 'text-slate-300 font-semibold' : 'text-slate-500'}`}>
            {isMine ? 'Tú: ' : ''}{chat.lastMsg.content}
          </p>
        )}
      </div>
    </motion.button>
  )
}

export default function ChatInbox({ onOpenChat, unreadByTradeId = {} }) {
  const { user } = useAuth()
  const { lang } = useLang()
  const { chats, loading } = useChats()

  if (!user) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-slate-400">Inicia sesión para ver tus chats</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando chats…
      </div>
    )
  }

  if (!chats.length) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-slate-400 font-semibold mb-1">Sin conversaciones aún</p>
        <p className="text-slate-600 text-sm">Contacta a coleccionistas desde Intercambios o Mercado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-amber-400" />
        <h3 className="font-bold text-white">Mis Conversaciones</h3>
        <span className="text-xs bg-amber-400/20 text-amber-400 font-bold px-2 py-0.5 rounded-full">{chats.length}</span>
      </div>
      {chats.map((chat) => (
        <ChatRow
          key={chat.tradeId}
          chat={chat}
          onOpen={(c) => onOpenChat(c.partner, c.context, c.tradeId)}
          unread={unreadByTradeId[chat.tradeId]}
          currentUserId={user.id}
        />
      ))}
    </div>
  )
}
