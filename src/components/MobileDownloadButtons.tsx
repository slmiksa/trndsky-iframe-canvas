
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppleLogo from './icons/AppleLogo';
import GooglePlayLogo from './icons/GooglePlayLogo';

const MobileDownloadButtons = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDownloadClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleDownloadClick}
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-14 w-14 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <AppleLogo className="h-7 w-7" />
          <span className="sr-only">Add to Home Screen</span>
        </Button>
        <Button 
          onClick={handleDownloadClick}
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-14 w-14 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <GooglePlayLogo className="h-7 w-7" />
          <span className="sr-only">Add to Home Screen</span>
        </Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إضافة إلى الشاشة الرئيسية</AlertDialogTitle>
            <AlertDialogDescription>
              لإضافة هذا الموقع إلى شاشتك الرئيسية كتطبيق، اتبع الخطوات الخاصة بمتصفحك. على أجهزة آيفون، اضغط على زر المشاركة ثم 'إضافة إلى الشاشة الرئيسية'. على أجهزة أندرويد، اضغط على قائمة الخيارات (ثلاث نقاط) ثم 'تثبيت التطبيق' أو 'إضافة إلى الشاشة الرئيسية'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>فهمت</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileDownloadButtons;
