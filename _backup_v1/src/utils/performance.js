/**
 * Performance Monitoring Utilities
 */

// Performance metrics logger
export class PerformanceMonitor {
  static marks = new Map()
  static measures = []

  static mark(name) {
    if (performance.mark) {
      performance.mark(name)
      this.marks.set(name, performance.now())
    }
  }

  static measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        
        const entries = performance.getEntriesByName(name)
        if (entries.length > 0) {
          const measure = entries[entries.length - 1]
          this.measures.push({
            name,
            duration: measure.duration,
            timestamp: Date.now()
          })
          
          // Log slow operations
          if (measure.duration > 1000) {
            console.warn(`Slow operation: ${name} took ${measure.duration}ms`)
          }
        }
      } catch (error) {
        console.error('Performance measure error:', error)
      }
    }
  }

  static getMetrics() {
    return {
      marks: Array.from(this.marks.entries()),
      measures: this.measures
    }
  }

  static clear() {
    if (performance.clearMarks) {
      performance.clearMarks()
    }
    if (performance.clearMeasures) {
      performance.clearMeasures()
    }
    this.marks.clear()
    this.measures = []
  }
}

/**
 * React Hook for performance monitoring
 */
import { useEffect, useRef } from 'react'

export function usePerformance(name, enabled = true) {
  const startTime = useRef(null)

  useEffect(() => {
    if (!enabled) return

    const startMark = `${name}-start`
    const endMark = `${name}-end`
    const measureName = `${name}-duration`

    // Mark start
    PerformanceMonitor.mark(startMark)
    startTime.current = performance.now()

    return () => {
      // Mark end and measure
      PerformanceMonitor.mark(endMark)
      PerformanceMonitor.measure(measureName, startMark, endMark)

      const duration = performance.now() - startTime.current
      
      if (duration > 100) {
        console.log(`⚡ ${name} took ${duration.toFixed(2)}ms`)
      }
    }
  }, [name, enabled])
}

/**
 * Web Vitals monitoring
 */
export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

/**
 * Resource timing observer
 */
export function observeResourceTiming() {
  if (!('PerformanceObserver' in window)) {
    return
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) {
        console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`)
      }
    }
  })

  observer.observe({ entryTypes: ['resource'] })
}

/**
 * Long task observer
 */
export function observeLongTasks() {
  if (!('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn(`Long task detected: ${entry.duration}ms`)
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    // longtask may not be supported in all browsers
  }
}

/**
 * Network information
 */
export function getNetworkInfo() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    
    return {
      effectiveType: connection.effectiveType, // 4g, 3g, 2g, slow-2g
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // ms
      saveData: connection.saveData // boolean
    }
  }
  
  return null
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * // Component level
 * function MyComponent() {
 *   usePerformance('MyComponent')
 *   // ...
 * }
 * 
 * // Manual timing
 * PerformanceMonitor.mark('fetch-start')
 * await fetchData()
 * PerformanceMonitor.mark('fetch-end')
 * PerformanceMonitor.measure('data-fetch', 'fetch-start', 'fetch-end')
 */
