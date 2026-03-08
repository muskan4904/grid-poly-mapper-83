import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, RotateCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onImageUpload: (file: File, imageUrl: string) => void;
  uploadedImage?: string;
  onClearImage?: () => void;
  className?: string;
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewFile(file);
      setPreviewUrl(url);
      setPreviewRotation(0);
    }
    setIsDragOver(false);
  }, []);

  const handleConfirmUpload = useCallback(() => {
    if (!previewFile || !previewUrl) return;

    if (previewRotation === 0) {
      onImageUpload(previewFile, previewUrl);
      setPreviewFile(null);
      setPreviewUrl('');
      setPreviewRotation(0);
      return;
    }

    // Apply rotation by drawing to a canvas
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
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

  // Preview mode - show image with rotate option before uploading
  if (previewUrl && !uploadedImage) {
    return (
      <div className={cn("flex flex-col items-center gap-4 p-4 border-2 border-primary/30 rounded-lg bg-card", className)}>
        <p className="text-sm font-medium text-foreground">Preview — Rotate if needed before uploading</p>
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center overflow-hidden rounded-lg bg-muted/30">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{ transform: `rotate(${previewRotation}deg)` }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
            className="gap-1 touch-manipulation"
          >
            <RotateCw size={16} />
            Rotate 90°
          </Button>
          <span className="text-xs text-muted-foreground">{previewRotation}°</span>
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            variant="outline"
            className="flex-1 touch-manipulation"
            onClick={handleCancelPreview}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 gap-1 touch-manipulation"
            onClick={handleConfirmUpload}
          >
            <Check size={16} />
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
