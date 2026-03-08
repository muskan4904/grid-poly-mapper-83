import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, RotateCw, Check, Crop, ArrowLeft } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FileUploadProps {
  onImageUpload: (file: File, imageUrl: string) => void;
  uploadedImage?: string;
  onClearImage?: () => void;
  className?: string;
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<{ file: File; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        img,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        pixelCrop.width, pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'));
        const file = new File([blob], 'cropped.png', { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        resolve({ file, url });
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onImageUpload,
  uploadedImage,
  onClearImage,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewRotation, setPreviewRotation] = useState(0);

  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropAspect, setCropAspect] = useState<number | undefined>(4 / 3);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
      setPreviewRotation(0);
      setIsCropping(false);
    }
    setIsDragOver(false);
  }, []);

  const onCropComplete = useCallback((_: any, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApplyCrop = useCallback(async () => {
    if (!croppedAreaPixels || !previewUrl) return;
    try {
      const { file, url } = await getCroppedImg(previewUrl, croppedAreaPixels);
      URL.revokeObjectURL(previewUrl);
      setPreviewFile(file);
      setPreviewUrl(url);
      setIsCropping(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (e) {
      console.error('Crop failed', e);
    }
  }, [croppedAreaPixels, previewUrl]);

  const handleConfirmUpload = useCallback(() => {
    if (!previewFile || !previewUrl) return;

    if (previewRotation === 0) {
      onImageUpload(previewFile, previewUrl);
      setPreviewFile(null);
      setPreviewUrl('');
      setPreviewRotation(0);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const isRightAngle = previewRotation % 180 !== 0;
      const w = isRightAngle ? img.height : img.width;
      const h = isRightAngle ? img.width : img.height;
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((previewRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const rotatedFile = new File([blob], previewFile.name, { type: 'image/png' });
          const rotatedUrl = URL.createObjectURL(blob);
          onImageUpload(rotatedFile, rotatedUrl);
        }
        setPreviewFile(null);
        setPreviewUrl('');
        setPreviewRotation(0);
      }, 'image/png');
    };
    img.src = previewUrl;
  }, [previewFile, previewUrl, previewRotation, onImageUpload]);

  const handleCancelPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl('');
    setPreviewRotation(0);
    setIsCropping(false);
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

  // Crop mode
  if (isCropping && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-4 p-4 sm:p-6 border-2 border-primary/30 rounded-lg bg-card w-full">
        <p className="text-base sm:text-lg font-semibold text-foreground">Crop Image — Drag corners to adjust crop area</p>
        <div className="relative w-full rounded-lg overflow-hidden bg-muted/20 border border-border" style={{ height: '60vh', maxHeight: '500px' }}>
          <Cropper
            image={previewUrl}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={true}
            restrictPosition={false}
            style={{
              containerStyle: { borderRadius: '0.5rem' },
              cropAreaStyle: { border: '2px solid hsl(var(--primary))' },
            }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Ratio:</span>
          {[
            { label: 'Free', value: undefined },
            { label: '1:1', value: 1 },
            { label: '4:3', value: 4 / 3 },
            { label: '3:4', value: 3 / 4 },
          ].map((opt) => (
            <Button
              key={opt.label}
              size="sm"
              variant={cropAspect === opt.value ? 'default' : 'outline'}
              className="h-8 px-3 text-xs touch-manipulation"
              onClick={() => setCropAspect(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full max-w-xs">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom:</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <Button
            variant="outline"
            className="flex-1 gap-2 touch-manipulation h-10 sm:h-11 text-sm sm:text-base"
            onClick={() => {
              setIsCropping(false);
              setCrop({ x: 0, y: 0 });
              setZoom(1);
            }}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <Button
            className="flex-1 gap-2 touch-manipulation h-10 sm:h-11 text-sm sm:text-base"
            onClick={handleApplyCrop}
          >
            <Check size={16} />
            Apply Crop
          </Button>
        </div>
      </div>
    );
  }

  // Preview mode
  if (previewUrl && !uploadedImage) {
    return (
      <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6 border-2 border-primary/30 rounded-lg bg-card w-full">
        <p className="text-base sm:text-lg font-semibold text-foreground">Preview — Rotate or Crop before uploading</p>
        <div className="relative w-full flex items-center justify-center overflow-hidden rounded-lg bg-muted/20 border border-border md:max-w-[500px] md:mx-auto" style={{ minHeight: window.innerWidth >= 768 ? '300px' : '50vh', maxHeight: window.innerWidth >= 768 ? '400px' : '70vh' }}>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[65vh] md:max-h-[380px] object-contain transition-transform duration-300"
            style={{ transform: `rotate(${previewRotation}deg)` }}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Button
            variant="outline"
            onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
            className="gap-2 touch-manipulation h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
          >
            <RotateCw size={18} />
            Rotate 90°
          </Button>
          <span className="text-sm text-muted-foreground font-medium">{previewRotation}°</span>
          <Button
            variant="outline"
            onClick={() => setIsCropping(true)}
            className="gap-2 touch-manipulation h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base"
          >
            <Crop size={18} />
            Crop
          </Button>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <Button
            variant="outline"
            className="flex-1 touch-manipulation h-10 sm:h-11 text-sm sm:text-base"
            onClick={handleCancelPreview}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2 touch-manipulation h-10 sm:h-11 text-sm sm:text-base"
            onClick={handleConfirmUpload}
          >
            <Check size={18} />
            Upload
          </Button>
        </div>
      </div>
    );
  }

  if (uploadedImage) {
    return (
      <div className={cn("relative", className)}>
        <img
          src={uploadedImage}
          alt="Uploaded house map"
          className="w-full h-full object-contain rounded-lg shadow-md"
        />
        {onClearImage && (
          <button
            onClick={onClearImage}
            className="absolute top-2 right-2 p-2 bg-card hover:bg-destructive hover:text-destructive-foreground
                     text-muted-foreground rounded-full shadow-md transition-smooth"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-smooth",
        "hover:bg-secondary/50 hover:border-primary/50",
        isDragActive || isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border bg-card",
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          "p-4 rounded-full transition-smooth",
          isDragActive || isDragOver
            ? "bg-primary text-primary-foreground scale-110"
            : "bg-secondary text-secondary-foreground"
        )}>
          {isDragActive || isDragOver ? (
            <Upload size={32} />
          ) : (
            <Image size={32} />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-foreground">
            {isDragActive ? "Drop your house map here!" : "Upload House Map"}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag & drop an image file, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PNG, JPG, JPEG, GIF, WebP
          </p>
        </div>
      </div>
    </div>
  );
};
