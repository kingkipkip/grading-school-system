/**
 * Accessibility Utilities
 * เครื่องมือสำหรับปรับปรุง accessibility
 */

// VisuallyHidden - ซ่อนจากสายตาแต่ screen reader อ่านได้
export function VisuallyHidden({ children, as: Component = 'span' }) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  )
}

// FocusTrap - กักขัง focus ไว้ในองค์ประกอบ (สำหรับ modals)
import { useEffect, useRef } from 'react'

export function useFocusTrap(isActive = true) {
  const elementRef = useRef(null)

  useEffect(() => {
    if (!isActive) return

    const element = elementRef.current
    if (!element) return

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return elementRef
}

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      ข้ามไปยังเนื้อหาหลัก
    </a>
  )
}

// Announce to screen readers
export function LiveRegion({ children, politeness = 'polite' }) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Keyboard navigation helper
export function useKeyboardNav(onEnter, onEscape) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && onEnter) {
        onEnter(e)
      }
      if (e.key === 'Escape' && onEscape) {
        onEscape(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEnter, onEscape])
}

/**
 * ตัวอย่างการใช้งาน:
 * 
 * // VisuallyHidden
 * <button>
 *   <Icon />
 *   <VisuallyHidden>ลบรายการ</VisuallyHidden>
 * </button>
 * 
 * // FocusTrap
 * function Modal({ isOpen }) {
 *   const modalRef = useFocusTrap(isOpen)
 *   return <div ref={modalRef}>...</div>
 * }
 * 
 * // LiveRegion
 * <LiveRegion>
 *   {message && <p>{message}</p>}
 * </LiveRegion>
 */
