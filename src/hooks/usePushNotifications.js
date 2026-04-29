import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function registerSW() {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  return reg
}

async function getOrCreateSubscription(reg) {
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported] = useState(
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )

  // Check if already subscribed in DB
  useEffect(() => {
    if (!user || !supported) return
    let cancelled = false
    ;(async () => {
      const reg = await navigator.serviceWorker.register('/sw.js').catch(() => null)
      if (!reg || cancelled) return
      const sub = await reg.pushManager.getSubscription()
      if (!sub || cancelled) return
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', sub.endpoint)
        .maybeSingle()
      if (!cancelled) setSubscribed(Boolean(data))
    })()
    return () => { cancelled = true }
  }, [user, supported])

  const subscribe = useCallback(async () => {
    if (!user || !supported) return
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await registerSW()
      if (!reg) return
      const sub = await getOrCreateSubscription(reg)
      const json = sub.toJSON()

      await supabase.from('push_subscriptions').upsert(
        {
          user_id:  user.id,
          endpoint: json.endpoint,
          p256dh:   json.keys.p256dh,
          auth:     json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' }
      )
      setSubscribed(true)
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, supported])

  const unsubscribe = useCallback(async () => {
    if (!user || !supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error('Push unsubscribe error:', err)
    } finally {
      setLoading(false)
    }
  }, [user, supported])

  const toggle = subscribed ? unsubscribe : subscribe

  return { supported, permission, subscribed, loading, subscribe, unsubscribe, toggle }
}
