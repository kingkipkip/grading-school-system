import { create } from 'zustand'

export const useToastStore = create((set, get) => ({
    toasts: [],

    addToast: (toast) => {
        const id = Math.random().toString(36).substring(7)
        const newToast = {
            id,
            type: 'info',
            duration: 3000,
            ...toast
        }

        set((state) => ({
            toasts: [...state.toasts, newToast]
        }))

        // Auto remove after duration
        if (newToast.duration > 0) {
            setTimeout(() => {
                get().removeToast(id)
            }, newToast.duration)
        }

        return id
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }))
    },

    success: (message, options = {}) => {
        return get().addToast({
            type: 'success',
            message,
            ...options
        })
    },

    error: (message, options = {}) => {
        return get().addToast({
            type: 'error',
            message,
            duration: 5000, // Error stays longer
            ...options
        })
    },

    warning: (message, options = {}) => {
        return get().addToast({
            type: 'warning',
            message,
            ...options
        })
    },

    info: (message, options = {}) => {
        return get().addToast({
            type: 'info',
            message,
            ...options
        })
    }
}))

export function useToast() {
    const { success, error, warning, info } = useToastStore()

    return {
        success,
        error,
        warning,
        info
    }
}
