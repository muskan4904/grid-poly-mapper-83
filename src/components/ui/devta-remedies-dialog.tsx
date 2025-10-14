import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import devtaRemediesImage from "@/assets/devta-remedies.png";

interface DevtaRemediesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DevtaRemediesDialog({ isOpen, onClose }: DevtaRemediesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-background border-none">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-50 bg-background/80 hover:bg-background"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Image container */}
        <div className="relative w-full h-full flex items-center justify-center bg-background p-4">
          <img
            src={devtaRemediesImage}
            alt="45 Devta Remedies"
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
