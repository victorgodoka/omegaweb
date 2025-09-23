import React, { useRef, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import type { ImageUploadProps } from '../types';

const ImageUpload: React.FC<ImageUploadProps> = ({
  artworkUrl,
  artworkFile,
  onUrlChange,
  onFileChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      onFileChange(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [onFileChange]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Clear artwork
  const handleClear = useCallback(() => {
    onFileChange(null);
    onUrlChange('');
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileChange, onUrlChange]);

  // Get display image
  const getDisplayImage = () => {
    if (artworkFile && previewUrl) return previewUrl;
    if (artworkUrl) return artworkUrl;
    return null;
  };

  const displayImage = getDisplayImage();

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Artwork URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={artworkUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {artworkUrl && (
            <button
              type="button"
              onClick={() => onUrlChange('')}
              className="px-3 py-2 bg-zinc-600 text-zinc-300 rounded-lg hover:bg-zinc-500 transition-colors"
            >
              <Icon icon="mdi:close" />
            </button>
          )}
        </div>
      </div>

      {/* OR Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-zinc-600"></div>
        <span className="text-zinc-400 text-sm">OR</span>
        <div className="flex-1 h-px bg-zinc-600"></div>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Upload Image
        </label>
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${dragActive 
              ? 'border-orange-500 bg-orange-500/10' 
              : 'border-zinc-600 hover:border-zinc-500'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-3">
            <Icon icon="mdi:cloud-upload" className="text-4xl text-zinc-400 mx-auto" />
            <div>
              <p className="text-zinc-300">
                <span className="font-medium text-orange-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {displayImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">
              Preview
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-sm"
            >
              <Icon icon="mdi:delete" />
              Clear
            </button>
          </div>
          
          <div className="relative bg-zinc-700 rounded-lg p-4 flex justify-center">
            <img
              src={displayImage}
              alt="Card artwork preview"
              className="max-w-full max-h-48 object-contain rounded"
              onError={() => {
                if (artworkUrl) {
                  onUrlChange('');
                }
              }}
            />
          </div>
          
          <div className="text-xs text-zinc-500">
            {artworkFile ? `File: ${artworkFile.name}` : `URL: ${artworkUrl}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
