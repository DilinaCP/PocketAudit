'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { ReceiptText as ReceiptIcon, Loader as LoaderIcon } from 'lucide-react';

type ReceiptItem = {
  description: string;
  price: number;
};

export default function Uploader() {
  const [receipts, setReceipts] = useState<{ items: ReceiptItem[]; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simple parser to extract description and price from OCR text lines
  const extractItems = (text: string): ReceiptItem[] => {
    const lines = text.split('\n');
    const items: ReceiptItem[] = [];

    lines.forEach((line) => {
      // Try to find a price like 12.34 at the end of line
      const priceMatch = line.match(/(\d+\.\d{2})$/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const description = line.replace(priceMatch[1], '').trim();
        if (description.length > 0 && price > 0) {
          items.push({ description, price });
        }
      }
    });

    return items.slice(0, 10); 
  };

  const uploadToBackend = async (file: File) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:4000/api/uploadReceipt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const data = await res.json();

      const items = extractItems(data.text);

      setReceipts((prev) => [...prev, { text: data.text, items }]);
      toast.success(`Processed: ${file.name}`);
    } catch (error: any) {
      toast.error(`Failed to process ${file.name}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadToBackend(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const grandTotal = receipts.reduce(
    (sum, receipt) => sum + receipt.items.reduce((s, item) => s + item.price, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="text-blue-600">Pocket</span>Audit
          </h1>
          <p className="text-lg text-gray-600">
            Smart receipt scanning for effortless expense tracking
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <ReceiptIcon className="w-14 h-14 text-blue-500" />
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Drag & drop receipts here
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPG, PNG (max 5MB each)
                </p>
              </div>
              <button
                type="button"
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Select Files
              </button>
            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <LoaderIcon className="animate-spin h-6 w-6 text-blue-600 mr-3" />
            <span className="text-gray-700 font-medium">Processing receipts...</span>
          </div>
        )}

        {/* Results */}
        {receipts.length > 0 && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Receipts</p>
                  <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    RM{grandTotal.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Receipts List */}
            <div className="space-y-4">
              {receipts.map((receipt, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center">
                    <ReceiptIcon className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="font-medium text-gray-800">Receipt #{i + 1}</h3>
                  </div>

                  {receipt.items.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {receipt.items.map((item, j) => (
                        <div key={j} className="px-5 py-3 flex justify-between">
                          <span className="text-gray-700">{item.description}</span>
                          <span className="font-medium text-gray-900">
                            RM{item.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="px-5 py-3 bg-gray-50 flex justify-between font-semibold text-gray-900">
                        <span>Subtotal</span>
                        <span>
                          {receipt.items
                            .reduce((sum, item) => sum + item.price, 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>No items detected in this receipt</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
