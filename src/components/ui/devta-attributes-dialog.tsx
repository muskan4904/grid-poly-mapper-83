import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import devtaImage1 from "@/assets/devta-attributes-1.png";
import devtaImage2 from "@/assets/devta-attributes-2.png";

interface DevtaAttributesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevtaAttributesDialog({ isOpen, onClose }: DevtaAttributesDialogProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [devtaImage1, devtaImage2];

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] h-[100vh] w-[100vw] p-0 bg-background border-none overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-background/90 hover:bg-background shadow-lg"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Image container */}
        <div className="relative w-full h-full flex items-center justify-center bg-background overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-4 pb-24">
            <img
              src={images[currentImageIndex]}
              alt={`Devta Attributes ${currentImageIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
          <Button
            variant="secondary"
            size="icon"
            onClick={handlePrevious}
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-background shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <div className="px-4 py-2 rounded-full bg-background/90 text-sm font-medium shadow-lg">
            {currentImageIndex + 1} / {images.length}
          </div>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={handleNext}
            className="h-12 w-12 rounded-full bg-background/90 hover:bg-background shadow-lg"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
