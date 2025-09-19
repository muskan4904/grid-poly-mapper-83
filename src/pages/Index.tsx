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
        <div className="container mx-auto px-1 sm:px-2 py-1.5 sm:py-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-white rounded-md sm:rounded-lg">
              <img src={astroshaLogo} alt="Astroshala Logo" className="h-4 w-4 sm:h-5 sm:w-5 object-contain" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-foreground">Astroshala Vastu Software</h1>
              <p className="text-xs text-muted-foreground">BY Somnath Banga</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-0.5 sm:px-1 py-1 sm:py-2 h-full flex-1 flex flex-col min-h-0">
        <div className="space-y-1 sm:space-y-2 h-full flex-1 flex flex-col min-h-0">
            {/* Upload Section */}
            {!uploadedImage && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Upload size={18} className="text-primary sm:w-5 sm:h-5" />
                    Upload House Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onImageUpload={handleImageUpload}
                    className="h-48 sm:h-64"
                  />
                </CardContent>
              </Card>
            )}

            {/* Canvas Section - Takes full available height */}
            {uploadedImage && (
              <div className="flex-1 flex flex-col h-full min-h-0">
                <Card className="shadow-lg flex-1 flex flex-col min-h-0">
                  <CardContent className="p-1 sm:p-2 flex-1 flex flex-col min-h-0">
                    <div className="mb-1 sm:mb-2 shrink-0">
                      <FileUpload
                        onImageUpload={handleImageUpload}
                        uploadedImage={uploadedImage}
                        onClearImage={handleClearImage}
                        className="h-6 sm:h-8"
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
              <Card className="bg-gradient-secondary border-primary/20">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                      <div>
                        <p className="font-medium mb-1 text-sm sm:text-base">Upload Image</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">Upload your house map or floor plan</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-accent text-accent-foreground rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="font-medium mb-1 text-sm sm:text-base">Draw Polygon</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">Tap to create points and select your area</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-1">
                      <div className="bg-success text-success-foreground rounded-full w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                      <div>
                        <p className="font-medium mb-1 text-sm sm:text-base">Analyze Area</p>
                        <p className="text-muted-foreground text-xs sm:text-sm">View polygon area and center point</p>
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