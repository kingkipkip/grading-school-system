/**
 * Simple in-memory cache with TTL (Time To Live)
 */

class Cache {
  constructor() {
    this.store = new Map()
  }

  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
    const expiresAt = Date.now() + ttl
    this.store.set(key, { value, expiresAt })
  }

  get(key) {
    const item = this.store.get(key)

    if (!item) return null

    if (Date.now() > item.expiresAt) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }

  // Clear expired items
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key)
      }
    }
  }
}

// Global cache instance
export const cache = new Cache()

// Cleanup expired items every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000)

/**
 * Hook for caching data fetching
 */
import { useState, useEffect } from 'react'

export function useCachedData(key, fetcher, options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    staleWhileRevalidate = true
  } = options

  const [data, setData] = useState(() => cache.get(key))
  const [loading, setLoading] = useState(!cache.has(key))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      // If we have cached data and staleWhileRevalidate is false, don't refetch
      if (cache.has(key) && !staleWhileRevalidate) {
        return
      }

      // If staleWhileRevalidate, show cached data immediately but fetch in background
      if (cache.has(key) && staleWhileRevalidate) {
        setLoading(false)
      } else {
        setLoading(true)
      }

      try {
        const result = await fetcher()
        cache.set(key, result, ttl)
        setData(result)
        setError(null)
      } catch (err) {
        console.error(`Error fetching ${key}:`, err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, ttl, staleWhileRevalidate])

  const invalidate = () => {
    cache.delete(key)
  }

  const refetch = async () => {
    setLoading(true)
    try {
      const result = await fetcher()
      cache.set(key, result, ttl)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, invalidate, refetch }
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * const { data, loading, error, refetch } = useCachedData(
 *   'courses-list',
 *   async () => {
 *     const { data } = await supabase.from('courses').select('*')
 *     return data
 *   },
 *   { ttl: 10 * 60 * 1000 } // Cache for 10 minutes
 * )
 */
