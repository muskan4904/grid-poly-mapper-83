import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      onImageUpload(file, imageUrl);
    }
    setIsDragOver(false);
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

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