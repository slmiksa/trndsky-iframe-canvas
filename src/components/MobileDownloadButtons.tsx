import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from '@/hooks/useLanguage';
const MobileDownloadButtons = () => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isPWA, setIsPWA] = React.useState(false);
  React.useEffect(() => {
    // Check if the app is running as a PWA (installed app)
    const checkPWA = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check if running in fullscreen mode
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      // Check for iOS PWA
      const isIOSPWA = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isFullscreen || isIOSPWA);
    };
    checkPWA();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);
    return () => {
      mediaQuery.removeEventListener('change', checkPWA);
    };
  }, []);
  const handleDownloadClick = () => {
    setDialogOpen(true);
  };

  // Don't render the download buttons if the app is already installed as PWA
  if (isPWA) {
    return null;
  }
  return <>
      <div className="flex justify-center gap-4">
        
        <Button onClick={handleDownloadClick} variant="secondary" size="lg" className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-800 font-semibold rounded-xl shadow-lg px-6 text-xl">{t('downloadButtonText')}</Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('addToHomeScreen')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('addToHomeScreenInstructions')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t('understood')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
};
export default MobileDownloadButtons;