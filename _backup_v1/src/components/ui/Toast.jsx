import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore } from '../../stores/toastStore'
export { useToast } from '../../stores/toastStore'

// Toast Component
function Toast({ toast, onRemove }) {
  const types = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: AlertCircle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  }

  const config = types[toast.type] || types.info
  const Icon = config.icon

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} flex-shrink-0`} size={20} />

        <div className="flex-1">
          {toast.title && (
            <p className={`font-semibold ${config.text} mb-1`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm ${config.text}`}>
            {toast.message}
          </p>
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className={`${config.iconColor} hover:opacity-70 flex-shrink-0`}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

// Toast Container
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

