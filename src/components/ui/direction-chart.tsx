import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { toast } from 'sonner';

interface DirectionData {
  direction: string;
  percentage: number;
  area: number;
}

interface DirectionChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: DirectionData[];
}

// Dialog component for 16-direction bar chart
export const DirectionChartDialog: React.FC<DirectionChartDialogProps> = ({ 
  isOpen, 
  onClose, 
  data 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const maxPercentage = Math.max(...data.map(d => d.percentage));
  
  // Calculate statistical measures
  const average = data.reduce((sum, d) => sum + d.percentage, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.percentage - average, 2), 0) / data.length;
  const standardDeviation = Math.sqrt(variance);
  const avgPlusStd = average + standardDeviation;
  const avgMinusStd = Math.max(0, average - standardDeviation);
  
  // Categorize directions
  const aboveAvgPlusStd = data.filter(d => d.percentage > avgPlusStd).length;
  const betweenAvgAndPlusStd = data.filter(d => d.percentage <= avgPlusStd && d.percentage > average).length;
  const betweenAvgAndMinusStd = data.filter(d => d.percentage <= average && d.percentage >= avgMinusStd).length;
  const belowAvgMinusStd = data.filter(d => d.percentage < avgMinusStd).length;
  
  const exportChart = async () => {
    if (!chartRef.current) {
      toast.error("Chart not available for export");
      return;
    }

    try {
      // Use html2canvas to capture the chart
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `16-direction-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Chart exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export chart');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">16 Direction Bar Chart</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={exportChart}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Export PNG
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>
        
        <div ref={chartRef} id="direction-chart-capture" data-role="direction-chart" className="p-2 max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Area Distribution by Direction</h3>
              <p className="text-sm text-muted-foreground">Percentage of total area in each compass direction</p>
            </div>
            
            <div className="relative flex items-end gap-1 h-48 bg-muted/10 rounded-lg p-4">
              {/* Statistical Reference Lines */}
              <div 
                className="absolute left-4 right-4 border-t-2 border-dashed border-yellow-500 z-10 pointer-events-none"
                style={{ 
                  bottom: `${4 + (average / maxPercentage) * (100 - 8)}%`
                }}
                title={`Average: ${average.toFixed(1)}%`}
              />
              <div 
                className="absolute left-4 right-4 border-t-2 border-dashed border-green-600 z-10 pointer-events-none"
                style={{ 
                  bottom: `${4 + (avgPlusStd / maxPercentage) * (100 - 8)}%`
                }}
                title={`Average + 1 Std Dev: ${avgPlusStd.toFixed(1)}%`}
              />
              <div 
                className="absolute left-4 right-4 border-t-2 border-dashed border-red-500 z-10 pointer-events-none"
                style={{ 
                  bottom: `${4 + (avgMinusStd / maxPercentage) * (100 - 8)}%`
                }}
                title={`Average - 1 Std Dev: ${avgMinusStd.toFixed(1)}%`}
              />
              
              {/* Legend for reference lines */}
              <div className="absolute top-2 right-2 text-xs space-y-1 bg-background/80 rounded p-2 border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-yellow-500"></div>
                  <span>Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-green-600"></div>
                  <span>Average + 1 Std Dev</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-red-500"></div>
                  <span>Average - 1 Std Dev</span>
                </div>
              </div>

              {data.map((item, index) => {
                // Determine bar color based on statistical category
                let barColor = "bg-primary";
                if (item.percentage > avgPlusStd) {
                  barColor = "bg-green-600";
                } else if (item.percentage < avgMinusStd) {
                  barColor = "bg-red-500";
                } else if (item.percentage > average) {
                  barColor = "bg-blue-500";
                } else {
                  barColor = "bg-blue-400";
                }

                return (
                  <div key={item.direction} className="flex flex-col items-center h-full" style={{ width: `${100/data.length}%` }}>
                    <div className="flex-1 flex items-end w-full px-1">
                      <div 
                        className={`${barColor} rounded-t-md w-full relative group transition-all duration-200 hover:opacity-80`}
                        style={{ 
                          height: `${(item.percentage / maxPercentage) * 100}%`,
                          minHeight: item.percentage > 0 ? '8px' : '0px'
                        }}
                        title={`${item.direction}: ${item.percentage.toFixed(1)}% (${item.area.toFixed(0)} sq units)`}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs bg-foreground text-background rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-medium">
                          {item.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-center mt-2 transform -rotate-45 origin-center whitespace-nowrap">
                      {item.direction}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm bg-muted/20 rounded-lg p-4">
              <div className="text-center">
                <div className="font-medium">Total Area</div>
                <div className="text-muted-foreground">{data.reduce((sum, d) => sum + d.area, 0).toFixed(0)} sq units</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Average</div>
                <div className="text-muted-foreground">{average.toFixed(1)}% ± {standardDeviation.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Max Direction</div>
                <div className="text-muted-foreground">{data.find(d => d.percentage === maxPercentage)?.direction} ({maxPercentage.toFixed(1)}%)</div>
              </div>
              <div className="text-center">
                <div className="font-medium">Directions</div>
                <div className="text-muted-foreground">{data.length} compass points</div>
              </div>
            </div>
            
            {/* Statistical Distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="text-center p-3 bg-green-600/10 rounded-lg border border-green-600/20">
                <div className="font-medium text-green-700 dark:text-green-400">Above Avg + 1σ</div>
                <div className="text-lg font-bold text-green-800 dark:text-green-300">{aboveAvgPlusStd}</div>
                <div className="text-xs text-muted-foreground">directions</div>
              </div>
              <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="font-medium text-blue-700 dark:text-blue-400">Above Average</div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-300">{betweenAvgAndPlusStd}</div>
                <div className="text-xs text-muted-foreground">directions</div>
              </div>
              <div className="text-center p-3 bg-blue-400/10 rounded-lg border border-blue-400/20">
                <div className="font-medium text-blue-600 dark:text-blue-400">Below Average</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{betweenAvgAndMinusStd}</div>
                <div className="text-xs text-muted-foreground">directions</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="font-medium text-red-700 dark:text-red-400">Below Avg - 1σ</div>
                <div className="text-lg font-bold text-red-800 dark:text-red-300">{belowAvgMinusStd}</div>
                <div className="text-xs text-muted-foreground">directions</div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <div>Hover over bars to see detailed values • Chart updates automatically with rotation changes</div>
              <div>Bar colors: <span className="text-green-600">Green</span> = Above Avg+1σ, <span className="text-blue-500">Blue</span> = Above Avg, <span className="text-blue-400">Light Blue</span> = Below Avg, <span className="text-red-500">Red</span> = Below Avg-1σ</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};