'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function Uploader() {
  const [result, setResult] = useState<ReceiptData | null>(null);
  
  const onDrop = useCallback(async (files: File[]) => {
    const formData = new FormData();
    formData.append('receipt', files[0]);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    setResult(await res.json());
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': ['.jpg', '.png'] },
    maxFiles: 1
  });

  return (
    <div {...getRootProps()} className="border-2 border-dashed p-6 rounded-lg">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop receipt here...</p>
      ) : (
        <p>Drag & drop receipt, or click to browse</p>
      )}
      {result && <Results data={result} />}
    </div>
  );
}

type ReceiptData = {
  total: number;
  date: string;
  items: { 
    description: string; 
    amount: number 
  }[];
};