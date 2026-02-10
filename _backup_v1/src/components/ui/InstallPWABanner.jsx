import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { setupPWAInstallPrompt, promptPWAInstall, isPWA } from '../../utils/pwa'

export default function InstallPWABanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Don't show if already running as PWA
    if (isPWA()) {
      return
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      return
    }

    // Setup install prompt listener
    setupPWAInstallPrompt((canInstall) => {
      setShowBanner(canInstall)
    })
  }, [])

  const handleInstall = async () => {
    setIsInstalling(true)
    
    try {
      const accepted = await promptPWAInstall()
      
      if (accepted) {
        setShowBanner(false)
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-md z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Download className="text-primary-600" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              ติดตั้งแอพบนอุปกรณ์
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              ใช้งานง่ายขึ้นและเข้าถึงได้เร็วขึ้น
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isInstalling ? 'กำลังติดตั้ง...' : 'ติดตั้ง'}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
