
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
  const [dialogContent, setDialogContent] = React.useState({ title: '', description: '' });

  const handleDownloadClick = (platform: 'iOS' | 'Android') => {
    setDialogContent({
      title: `تثبيت التطبيق على ${platform}`,
      description: `لتحويل هذا الموقع إلى تطبيق على جهازك، يجب عليك بناء التطبيق يدوياً. لقد قمتُ بإعداد المشروع لذلك. يرجى اتباع التعليمات التي سأذكرها لك في المحادثة.`,
    });
    setDialogOpen(true);
  };

  return (
    <>
      <div className="absolute top-4 right-4 z-[70] flex flex-col gap-3">
        <Button 
          onClick={() => handleDownloadClick('iOS')} 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Apple className="h-6 w-6 text-gray-800" />
          <span className="sr-only">Download for iOS</span>
        </Button>
        <Button 
          onClick={() => handleDownloadClick('Android')} 
          variant="secondary" 
          size="icon" 
          className="rounded-full shadow-lg h-12 w-12 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Smartphone className="h-6 w-6 text-gray-800" />
          <span className="sr-only">Download for Android</span>
        </Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
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
