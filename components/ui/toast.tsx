'use client'

import { useEffect, useState } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

let toastQueue: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  const toast: Toast = {
    id: Math.random().toString(36).substr(2, 9),
    message,
    type,
  }
  
  toastQueue = [...toastQueue, toast]
  listeners.forEach(listener => listener(toastQueue))
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== toast.id)
    listeners.forEach(listener => listener(toastQueue))
  }, 3000)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      listeners = listeners.filter(listener => listener !== setToasts)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] max-w-md px-5 py-4 rounded-xl shadow-2xl border-2 backdrop-blur-sm transform transition-all duration-300 ease-out animate-slideIn ${
            toast.type === 'success'
              ? 'bg-white/95 border-green-200'
              : toast.type === 'error'
              ? 'bg-white/95 border-red-200'
              : 'bg-white/95 border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              toast.type === 'success'
                ? 'bg-green-100'
                : toast.type === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
            }`}>
              {toast.type === 'success' && (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            
            {/* Message */}
            <p className="flex-1 text-sm font-medium text-slate-900">
              {toast.message}
            </p>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}