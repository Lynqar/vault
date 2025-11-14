/**
 * Favicon detection and caching utilities
 */

import React from 'react'

export interface FaviconResult {
  url: string
  size: number
  type: 'ico' | 'png' | 'svg' | 'fallback'
  loaded: boolean
}

export interface FaviconCache {
  [domain: string]: {
    timestamp: number
    favicons: FaviconResult[]
  }
}

// Cache configuration
const FAVICON_CACHE_KEY = 'vault_favicon_cache'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_CACHE_ENTRIES = 50 // Limit cache size

/**
 * Get domain from URL
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Favicon priority detection order
 */
const FAVICON_PRIORITIES = [
  // High priority - specific favicon endpoints
  (domain: string) => `https://${domain}/favicon.ico`,
  (domain: string) => `https://${domain}/favicon.png`,
  (domain: string) => `https://${domain}/icons/favicon.ico`,

  // Medium priority - common locations
  (domain: string) => `https://${domain}/apple-touch-icon.png`,
  (domain: string) => `https://${domain}/android-chrome-192x192.png`,
  (domain: string) => `https://${domain}/android-chrome-512x512.png`,

  // Low priority - fallbacks
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
  (domain: string) => `https://icon.horse/icon/${domain}`,
]

/**
 * Check if URL is accessible
 */
async function checkUrlAccess(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues
      cache: 'force-cache',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    return response.ok || response.type === 'opaque'
  } catch {
    return false
  }
}

/**
 * Generate favicon URLs for a domain
 */
export function generateFaviconUrls(domain: string): string[] {
  return FAVICON_PRIORITIES.map(fn => fn(domain))
}

/**
 * Find best favicon URL for a domain
 */
export async function findBestFavicon(domain: string): Promise<FaviconResult | null> {
  if (!domain) return null

  // Check cache first
  const cached = getCachedFavicons(domain)
  if (cached && cached.timestamp > Date.now() - CACHE_DURATION) {
    const bestCached = cached.favicons.find(f => f.loaded)
    if (bestCached) return bestCached
  }

  const faviconUrls = generateFaviconUrls(domain)
  const results: FaviconResult[] = []

  // Test favicons in parallel with concurrency limit
  const concurrency = 3
  for (let i = 0; i < faviconUrls.length; i += concurrency) {
    const batch = faviconUrls.slice(i, i + concurrency)
    const batchPromises = batch.map(async (url) => {
      const isAccessible = await checkUrlAccess(url)

      const result: FaviconResult = {
        url,
        size: getFaviconSize(url),
        type: getFaviconType(url),
        loaded: isAccessible
      }

      return result
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Early exit if we found a good favicon
    if (batchResults.some(r => r.loaded && r.size >= 32)) {
      break
    }
  }

  // Find the best result
  const bestResult = results
    .filter(r => r.loaded)
    .sort((a, b) => b.size - a.size)[0] || null

  // Cache the results
  if (bestResult) {
    cacheFavicons(domain, results.filter(r => r.loaded))
  }

  return bestResult
}

/**
 * Get favicon size from URL pattern
 */
function getFaviconSize(url: string): number {
  const sizeMatch = url.match(/(\d+)x(\d+)/)
  if (sizeMatch) {
    return Math.min(parseInt(sizeMatch[1]), parseInt(sizeMatch[2]))
  }

  if (url.includes('favicon.ico') && !url.includes('google.com/s2')) {
    return 16 // Default favicon size
  }

  return 32 // Default reasonable size
}

/**
 * Get favicon type from URL
 */
function getFaviconType(url: string): FaviconResult['type'] {
  if (url.endsWith('.ico')) return 'ico'
  if (url.endsWith('.svg')) return 'svg'
  if (url.endsWith('.png') || url.includes('png')) return 'png'
  return 'ico'
}

/**
 * Load favicon cache from localStorage
 */
function loadFaviconCache(): FaviconCache {
  try {
    const stored = localStorage.getItem(FAVICON_CACHE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Save favicon cache to localStorage
 */
function saveFaviconCache(cache: FaviconCache): void {
  try {
    // Clean old entries
    const now = Date.now()
    const cleanedCache: FaviconCache = {}

    const entries = Object.entries(cache)
      .sort(([,a], [,b]) => b.timestamp - a.timestamp) // Most recent first
      .slice(0, MAX_CACHE_ENTRIES) // Keep only most recent + limit size

    for (const [domain, data] of entries) {
      if (now - data.timestamp < CACHE_DURATION) {
        cleanedCache[domain] = data
      }
    }

    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cleanedCache))
  } catch (error) {
    console.warn('Failed to save favicon cache:', error)
  }
}

/**
 * Get cached favicons for domain
 */
function getCachedFavicons(domain: string): FaviconCache[string] | null {
  const cache = loadFaviconCache()
  return cache[domain] || null
}

/**
 * Cache favicons for domain
 */
function cacheFavicons(domain: string, favicons: FaviconResult[]): void {
  const cache = loadFaviconCache()
  cache[domain] = {
    timestamp: Date.now(),
    favicons
  }
  saveFaviconCache(cache)
}

/**
 * Prefetch favicons for multiple domains
 */
export async function prefetchFavicons(domains: string[]): Promise<void> {
  const uniqueDomains = [...new Set(domains.filter(d => d))]
  const promises = uniqueDomains.map(domain => findBestFavicon(domain))
  await Promise.allSettled(promises)
}

/**
 * Clear favicon cache
 */
export function clearFaviconCache(): void {
  try {
    localStorage.removeItem(FAVICON_CACHE_KEY)
  } catch (error) {
    console.warn('Failed to clear favicon cache:', error)
  }
}

/**
 * React hook for favicon URLs
 */
export function useFavicon(domain: string): {
  favicon: FaviconResult | null
  loading: boolean
  error: boolean
} {
  const [state, setState] = React.useState({
    favicon: null as FaviconResult | null,
    loading: true,
    error: false
  })

  React.useEffect(() => {
    if (!domain) {
      setState({ favicon: null, loading: false, error: false })
      return
    }

    let mounted = true

    findBestFavicon(domain)
      .then(favicon => {
        if (mounted) {
          setState({
            favicon: favicon || {
              url: '',
              size: 16,
              type: 'fallback' as const,
              loaded: false
            },
            loading: false,
            error: !favicon
          })
        }
      })
      .catch(error => {
        console.warn('Failed to load favicon for', domain, error)
        if (mounted) {
          setState({
            favicon: {
              url: '',
              size: 16,
              type: 'fallback' as const,
              loaded: false
            },
            loading: false,
            error: true
          })
        }
      })

    return () => {
      mounted = false
    }
  }, [domain])

  return state
}
