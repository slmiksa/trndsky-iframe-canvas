
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
          size="lg"
          className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-800 font-semibold rounded-xl shadow-lg px-6"
        >
          متجر آبل
        </Button>
        <Button 
          onClick={handleDownloadClick}
          variant="secondary" 
          size="lg"
          className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-800 font-semibold rounded-xl shadow-lg px-6"
        >
          قوقل بلاي
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
