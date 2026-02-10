/**
 * Batch Operations Utility
 * ช่วยลด database calls โดยการรวม operations เข้าด้วยกัน
 */

export class BatchProcessor {
  constructor(options = {}) {
    this.queue = []
    this.processing = false
    this.batchSize = options.batchSize || 50
    this.delay = options.delay || 100 // ms
    this.processor = options.processor
    this.timer = null
  }

  add(item) {
    this.queue.push(item)
    
    // Auto-process if batch size reached
    if (this.queue.length >= this.batchSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    
    this.timer = setTimeout(() => {
      this.flush()
    }, this.delay)
  }

  async flush() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const batch = this.queue.splice(0, this.batchSize)

    try {
      if (this.processor) {
        await this.processor(batch)
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      // Re-add failed items to queue
      this.queue.unshift(...batch)
    } finally {
      this.processing = false
      
      // Process remaining items
      if (this.queue.length > 0) {
        this.scheduleFlush()
      }
    }
  }

  clear() {
    this.queue = []
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

/**
 * Debounce utility
 */
export function debounce(func, wait = 300) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle utility
 */
export function throttle(func, limit = 300) {
  let inThrottle
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Chunk array into smaller arrays
 */
export function chunk(array, size = 50) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Retry failed operations
 */
export async function retry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2
  } = options

  let lastError

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (i < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, delay * Math.pow(backoff, i))
        )
      }
    }
  }

  throw lastError
}

/**
 * Queue for sequential execution
 */
export class SequentialQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    const { fn, resolve, reject } = this.queue.shift()

    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      this.processing = false
      this.process()
    }
  }
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * // Batch processor for submissions
 * const submissionBatch = new BatchProcessor({
 *   batchSize: 50,
 *   delay: 500,
 *   processor: async (batch) => {
 *     await supabase
 *       .from('assignment_submissions')
 *       .upsert(batch)
 *   }
 * })
 * 
 * // Add items (will auto-batch and flush)
 * submissionBatch.add(submission1)
 * submissionBatch.add(submission2)
 * 
 * // Debounce search
 * const debouncedSearch = debounce(searchFunction, 300)
 * 
 * // Retry failed API call
 * const data = await retry(
 *   () => fetchData(),
 *   { retries: 3, delay: 1000 }
 * )
 */
