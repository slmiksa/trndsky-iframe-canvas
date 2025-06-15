
import React from 'react';
import { Button } from '@/components/ui/button';
import { Apple, Smartphone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MobileDownloadButtons = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleDownloadClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-[70] flex flex-col gap-3">
        <Button 
          onClick={handleDownloadClick}
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Apple className="h-6 w-6 text-gray-800" />
          <span className="sr-only">Add to Home Screen</span>
        </Button>
        <Button 
          onClick={handleDownloadClick}
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Smartphone className="h-6 w-6 text-gray-800" />
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
