import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { PolygonCanvas } from '@/components/canvas/PolygonCanvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import astroshaLogo from '@/assets/astroshala-logo.png';

interface Point {
  x: number;
  y: number;
}

const Index = () => {
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [area, setArea] = useState<number>(0);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });

  const handleImageUpload = (file: File, imageUrl: string) => {
    setUploadedImage(imageUrl);
    // Reset polygon data when new image is uploaded
    setPolygon([]);
    setArea(0);
    setCenter({ x: 0, y: 0 });
  };

  const handleClearImage = () => {
    setUploadedImage('');
    setPolygon([]);
    setArea(0);
    setCenter({ x: 0, y: 0 });
  };

  const handlePolygonChange = (newPolygon: Point[], newArea: number, newCenter: Point) => {
    setPolygon(newPolygon);
    setArea(newArea);
    setCenter(newCenter);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - More compact */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg">
              <img src={astroshaLogo} alt="Astroshala Logo" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">VastuGrid</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">BY Somnath Banga</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 h-full flex-1 flex flex-col min-h-0">
        <div className="space-y-4 sm:space-y-6 h-full flex-1 flex flex-col min-h-0">
            {/* Upload Section */}
            {!uploadedImage && (
              <Card className="shadow-lg">
                <CardHeader className="pb-4 sm:pb-6 pt-6 sm:pt-8">
                  <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                    <Upload size={20} className="text-primary sm:w-6 sm:h-6" />
                    Upload House Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-6 sm:pb-8">
                  <FileUpload
                    onImageUpload={handleImageUpload}
                    className="h-64 sm:h-80"
                  />
                </CardContent>
              </Card>
            )}

            {/* Canvas Section - Takes full available height */}
            {uploadedImage && (
              <div className="flex-1 flex flex-col h-full min-h-0">
                <Card className="shadow-lg flex-1 flex flex-col min-h-0">
                  <CardContent className="p-2 sm:p-4 flex-1 flex flex-col min-h-0">
                    <div className="mb-2 sm:mb-4 shrink-0">
                      <FileUpload
                        onImageUpload={handleImageUpload}
                        uploadedImage={uploadedImage}
                        onClearImage={handleClearImage}
                        className="h-8 sm:h-10"
                      />
                    </div>
                    <div className="flex-1 min-h-0">
                      <PolygonCanvas
                        imageUrl={uploadedImage}
                        onPolygonChange={handlePolygonChange}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Instructions - Only show when no image is uploaded */}
            {!uploadedImage && (
              <Card className="bg-gradient-secondary border-primary/20 flex-1">
                <CardContent className="pt-6 sm:pt-8 pb-8 sm:pb-10 px-4 sm:px-6 h-full flex flex-col justify-center">
                  <div className="grid grid-cols-1 gap-6 sm:gap-8 text-sm max-w-md mx-auto w-full">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">1</div>
                      <div className="flex-1">
                        <p className="font-semibold mb-2 text-base sm:text-lg">Upload Image</p>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Upload your house map or floor plan to get started with the analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">2</div>
                      <div className="flex-1">
                        <p className="font-semibold mb-2 text-base sm:text-lg">Draw Polygon</p>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Tap to create points around your desired area and select the region for analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-success text-success-foreground rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-base font-bold flex-shrink-0">3</div>
                      <div className="flex-1">
                        <p className="font-semibold mb-2 text-base sm:text-lg">Analyze Area</p>
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">View detailed polygon area calculations and center point analysis</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
};

export default Index;