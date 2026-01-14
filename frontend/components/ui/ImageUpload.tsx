'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
    value?: string | string[];
    onChange: (files: File | File[]) => void;
    multiple?: boolean;
    maxSize?: number; // in MB
    accept?: string;
    preview?: boolean;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    multiple = false,
    maxSize = 5,
    accept = 'image/*',
    preview = true,
    className = '',
}: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setError('');
        const fileArray = Array.from(files);

        // Validate file size
        const invalidFiles = fileArray.filter((file) => file.size > maxSize * 1024 * 1024);
        if (invalidFiles.length > 0) {
            setError(`ไฟล์บางไฟล์มีขนาดเกิน ${maxSize}MB`);
            return;
        }

        // Validate file type
        const invalidTypes = fileArray.filter((file) => !file.type.startsWith('image/'));
        if (invalidTypes.length > 0) {
            setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
            return;
        }

        // Create previews
        if (preview) {
            const newPreviews: string[] = [];
            fileArray.forEach((file) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    if (newPreviews.length === fileArray.length) {
                        setPreviews(multiple ? [...previews, ...newPreviews] : newPreviews);
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // Call onChange
        if (multiple) {
            onChange(fileArray);
        } else {
            onChange(fileArray[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const removePreview = (index: number) => {
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className={className}>
            {/* Upload Area */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-2">
                    <div className={`p-3 rounded-full ${error ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <Upload className={`w-6 h-6 ${error ? 'text-red-500' : 'text-gray-500'}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                        {isDragging ? 'วางไฟล์ที่นี่' : 'คลิกหรือลากไฟล์มาที่นี่'}
                    </p>
                    <p className="text-xs text-gray-500">
                        {multiple ? 'รองรับหลายไฟล์' : 'รองรับไฟล์เดียว'} (สูงสุด {maxSize}MB)
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {/* Preview Grid */}
            {preview && previews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removePreview(index);
                                }}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Simplified version for single image
export function SingleImageUpload({
    value,
    onChange,
    className = '',
}: {
    value?: string;
    onChange: (file: File | null) => void;
    className?: string;
}) {
    const [preview, setPreview] = useState<string | undefined>(value);

    const handleChange = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onChange(file);
    };

    const handleRemove = () => {
        setPreview(undefined);
        onChange(null);
    };

    if (preview) {
        return (
            <div className={`relative ${className}`}>
                <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                />
                <button
                    onClick={handleRemove}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <ImageUpload
            onChange={(file) => handleChange(file as File)}
            multiple={false}
            preview={false}
            className={className}
        />
    );
}
