import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface DevtaNamesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const devtaNames = [
  { number: 1, name: "Brahma" },
  { number: 2, name: "Aryama" },
  { number: 3, name: "Viswaan" },
  { number: 4, name: "Mitra" },
  { number: 5, name: "Bhudhar" },
  { number: 6, name: "Aap" },
  { number: 7, name: "Aapa Vasta" },
  { number: 8, name: "Savita" },
  { number: 9, name: "Savitra" },
  { number: 10, name: "Indra" },
  { number: 11, name: "Indra jay" },
  { number: 12, name: "Rudra" },
  { number: 13, name: "Rudra jay" },
  { number: 14, name: "Shikhi" },
  { number: 15, name: "Prajanyaa" },
  { number: 16, name: "Jayant" },
  { number: 17, name: "Mahendra" },
  { number: 18, name: "Surya" },
  { number: 19, name: "Satya" },
  { number: 20, name: "Bhrish" },
  { number: 21, name: "Antriksh" },
  { number: 22, name: "Agni" },
  { number: 23, name: "Pusha" },
  { number: 24, name: "Vitath" },
  { number: 25, name: "Grakshat" },
  { number: 26, name: "Yamm" },
  { number: 27, name: "Gandhrav" },
  { number: 28, name: "Bhring" },
  { number: 29, name: "Mrish" },
  { number: 30, name: "Pitra" },
  { number: 31, name: "Dwarik" },
  { number: 32, name: "Sugriv" },
  { number: 33, name: "Pushpdant" },
  { number: 34, name: "Varun" },
  { number: 35, name: "Asur" },
  { number: 36, name: "Shosh" },
  { number: 37, name: "Rogg" },
  { number: 38, name: "Marut" },
  { number: 39, name: "Naag" },
  { number: 40, name: "Mukhya" },
  { number: 41, name: "Bhallaat" },
  { number: 42, name: "Som" },
  { number: 43, name: "Mrig" },
  { number: 44, name: "Aditi" },
  { number: 45, name: "Diti" }
];

export const DevtaNamesDialog: React.FC<DevtaNamesDialogProps> = ({ isOpen, onClose }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportChart = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
        });
        
        const link = document.createElement('a');
        link.download = 'devta-names.png';
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error exporting chart:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-background" data-dialog-content>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">45 Devtas Names</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportChart}
              className="flex items-center gap-2 text-foreground border-border"
            >
              <Download className="h-4 w-4" />
              Export PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2 text-foreground border-border"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]" data-scroll-container>
          <div ref={chartRef} className="bg-background p-6" data-devta-names-content>
            <h2 className="text-xl font-semibold text-center mb-6 text-foreground">45 Devtas Names</h2>
            
            <div className="grid grid-cols-3 gap-x-8 gap-y-2">
              {devtaNames.map((devta) => (
                <div key={devta.number} className="flex items-center justify-between p-2 rounded border-b border-border/30">
                  <span className="font-medium text-primary text-sm">{devta.number}</span>
                  <span className="text-foreground text-sm">{devta.name}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Complete list of 45 Devtas with their corresponding numbers
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};