/**
 * Service Worker Registration
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('SW registered:', registration)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Every hour
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

/**
 * PWA Install Prompt
 */
let deferredPrompt = null

export function setupPWAInstallPrompt(onInstallable) {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()
    
    // Stash the event so it can be triggered later
    deferredPrompt = e
    
    // Notify that app can be installed
    if (onInstallable) {
      onInstallable(true)
    }
  })

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed')
    deferredPrompt = null
    
    if (onInstallable) {
      onInstallable(false)
    }
  })
}

export async function promptPWAInstall() {
  if (!deferredPrompt) {
    return false
  }

  // Show the install prompt
  deferredPrompt.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice
  
  console.log(`User response to the install prompt: ${outcome}`)
  
  // Clear the deferredPrompt
  deferredPrompt = null
  
  return outcome === 'accepted'
}

/**
 * Check if running as PWA
 */
export function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/**
 * Check if app is installable
 */
export function canInstallPWA() {
  return deferredPrompt !== null
}
