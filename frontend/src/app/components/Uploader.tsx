'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { FileRejection, useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

type UploadFile = {
  id: string;
  file: File;
  uploading: boolean;
  progress: number;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
};

export function Uploader() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [result, setResult] = useState(null);

  const uploadFile = useCallback(async (file: File) => {
    setFiles(prev => 
      prev.map(f => 
        f.file === file ? { ...f, uploading: true } : f
      )
    );

    try {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setFiles(prev => 
          prev.map(f => 
            f.file === file ? { ...f, progress } : f
          )
        );
      }
      toast.success(`${file.name} uploaded successfully!`);
    } catch (error) {
      setFiles(prev => 
        prev.map(f => 
          f.file === file ? { ...f, error: true } : f
        )
      );
      toast.error(`Failed to upload ${file.name}`);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {

    if (acceptedFiles.length === 0) return;

    const newFiles = acceptedFiles.map(file => ({
      id: uuidv4(),
      file,
      uploading: false,
      progress: 0,
      isDeleting: false,
      error: false,
      objectUrl: URL.createObjectURL(file)
    }));

    setFiles(prev => [...prev, ...newFiles]);
    acceptedFiles.forEach(uploadFile);
  }, [uploadFile]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    rejections.forEach(({ file, errors }) => {
      errors.forEach(error => {
        switch (error.code) {
          case 'too-many-files':
            toast.error('Maximum 5 files allowed');
            break;
          case 'file-too-large':
            toast.error(`${file.name} exceeds 5MB limit`);
            break;
          case 'file-invalid-type':
            toast.error(`${file.name} is not an image`);
            break;
          default:
            toast.error(`Cannot upload ${file.name}`);
        }
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    accept: { 'image/*': [] }
  });

  return (
    <div className="space-y-4">
      <Card className={cn(
        'border-2 border-dashed cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/10' : 'border-border'
      )} {...getRootProps()}>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-primary">Drop files here</p>
          ) : (
            <div className="text-center space-y-2">
              <p>Drag & drop files here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
          )}
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map(file => (
            <div key={file.id} className="relative border rounded-md overflow-hidden">
              <img 
                src={file.objectUrl} 
                alt={file.file.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-2">
                <p className="truncate text-sm">{file.file.name}</p>
                {file.uploading && (
                  <progress 
                    value={file.progress} 
                    max="100" 
                    className="w-full mt-1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}