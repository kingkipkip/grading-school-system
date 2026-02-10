import { X, AlertTriangle, Trash2, Save, Lock } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useFocusTrap, useKeyboardNav } from './Accessibility'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'default', // 'default', 'danger', 'warning'
  loading = false
}) {
  const modalRef = useFocusTrap(isOpen && !loading)
  
  // ESC to close
  useKeyboardNav(null, () => {
    if (isOpen && !loading) {
      onClose()
    }
  })
  
  if (!isOpen) return null
  
  const variants = {
    default: {
      icon: Save,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      confirmBg: 'bg-primary-600 hover:bg-primary-700',
      confirmText: 'text-white'
    },
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmText: 'text-white'
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      confirmText: 'text-white'
    }
  }
  
  const config = variants[variant] || variants.default
  const Icon = config.icon
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }
  
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }
  
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-scale-in"
      >
        {/* Close button */}
        {!loading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        )}
        
        {/* Icon */}
        <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mb-4`} aria-hidden="true">
          <Icon className={config.iconColor} size={24} />
        </div>
        
        {/* Title */}
        <h3 id="dialog-title" className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p id="dialog-description" className="text-gray-600 mb-6 whitespace-pre-line">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 ${config.confirmBg} ${config.confirmText} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            autoFocus
          >
            {loading ? 'กำลังดำเนินการ...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Hook สำหรับใช้ ConfirmDialog ง่ายขึ้น
import { useState } from 'react'

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({})
  
  const confirm = (options) => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        onConfirm: async () => {
          resolve(true)
        },
        onClose: () => {
          resolve(false)
          setIsOpen(false)
        }
      })
      setIsOpen(true)
    })
  }
  
  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      {...config}
    />
  )
  
  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
