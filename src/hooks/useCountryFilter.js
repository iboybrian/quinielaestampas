import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const STORAGE_KEY = 'country_filter_only'

// Toggle persisted in localStorage. Returns helpers to filter/sort lists by country
// so users can prioritise (or restrict to) collectors from their own country.
export function useCountryFilter() {
  const { profile } = useAuth()
  const myCountry = profile?.country ?? null

  const [onlyMyCountry, setOnlyMyCountry] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === '1'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, onlyMyCountry ? '1' : '0')
  }, [onlyMyCountry])

  const toggle = useCallback(() => setOnlyMyCountry((v) => !v), [])

  // Returns list filtered (when onlyMyCountry) or sorted (same-country first).
  // Reads `country` field from each item.
  const apply = useCallback((list) => {
    if (!Array.isArray(list)) return list
    if (!myCountry) return list
    if (onlyMyCountry) {
      return list.filter((it) => it.country === myCountry)
    }
    return [...list].sort((a, b) => {
      const aMine = a.country === myCountry ? 0 : 1
      const bMine = b.country === myCountry ? 0 : 1
      return aMine - bMine
    })
  }, [myCountry, onlyMyCountry])

  return { onlyMyCountry, toggle, myCountry, apply }
}
