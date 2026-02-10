import { AlertCircle, X } from 'lucide-react'

export default function ErrorAlert({ 
  error, 
  onClose,
  title = 'เกิดข้อผิดพลาด',
  dismissible = true 
}) {
  if (!error) return null
  
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
          <p className="text-red-700 text-sm whitespace-pre-line">{errorMessage}</p>
        </div>
        
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

// Success Alert variant
export function SuccessAlert({ 
  message, 
  onClose,
  title = 'สำเร็จ',
  dismissible = true 
}) {
  if (!message) return null
  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 mb-1">{title}</h3>
          <p className="text-green-700 text-sm">{message}</p>
        </div>
        
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-800 flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

// Warning Alert variant
export function WarningAlert({ 
  message, 
  onClose,
  title = 'คำเตือน',
  dismissible = true 
}) {
  if (!message) return null
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
        
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 mb-1">{title}</h3>
          <p className="text-yellow-700 text-sm">{message}</p>
        </div>
        
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
