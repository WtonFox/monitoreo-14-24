import React, { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallPWA — Shows an install button when the browser fires `beforeinstallprompt`.
 * Handles the full install flow:
 * 1. Captures the `beforeinstallprompt` event
 * 2. Shows a floating install button
 * 3. Calls `prompt()` on click
 * 4. Hides after install or dismissal
 * 5. Gracefully does nothing if not eligible (no event fires)
 */
const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing automatically
      e.preventDefault();
      // Store the event so we can trigger the prompt later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // Hide the install button
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    // Show the browser install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    // Clear the deferred prompt — can only be used once
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Don't render if not eligible or already installed
  if (!deferredPrompt || isInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-sm font-medium"
      aria-label="Instalar aplicación"
    >
      <Download size={18} />
      Instalar App
    </button>
  );
};

export default InstallPWA;
