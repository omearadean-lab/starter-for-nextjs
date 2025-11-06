'use client';

import { useState, useRef } from 'react';
import { storageService } from '@/lib/storage';
import { CloudArrowUpIcon, XMarkIcon, PhotoIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function FileUpload({
  onFileUploaded,
  uploadType = 'image', // 'image', 'video', 'document', 'face', 'alert'
  maxSizeMB = 10,
  multiple = false,
  accept,
  className = '',
  disabled = false,
  organizationId,
  entityId, // personId, alertId, cameraId, etc.
  children
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Get allowed file types based on upload type
  const getAllowedTypes = () => {
    switch (uploadType) {
      case 'face':
      case 'image':
      case 'alert':
        return storageService.constructor.FILE_TYPES.IMAGES;
      case 'video':
        return storageService.constructor.FILE_TYPES.VIDEOS;
      case 'document':
        return storageService.constructor.FILE_TYPES.DOCUMENTS;
      default:
        return storageService.constructor.FILE_TYPES.ALL_MEDIA;
    }
  };

  const allowedTypes = accept ? accept.split(',').map(type => type.trim()) : getAllowedTypes();

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        // Validate file
        const validation = storageService.validateFile(file, allowedTypes, maxSizeMB);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Upload based on type
        let result;
        switch (uploadType) {
          case 'face':
            result = await storageService.uploadFaceImage(file, entityId, organizationId);
            break;
          case 'alert':
            if (file.type.startsWith('image/')) {
              result = await storageService.uploadAlertImage(file, entityId, organizationId);
            } else if (file.type.startsWith('video/')) {
              result = await storageService.uploadAlertVideo(file, entityId, organizationId);
            }
            break;
          case 'profile':
            result = await storageService.uploadProfilePicture(file, entityId);
            break;
          case 'detection':
            result = await storageService.uploadDetectionImage(file, entityId, organizationId);
            break;
          case 'config':
            result = await storageService.uploadCameraConfig(file, entityId, organizationId);
            break;
          default:
            // Generic upload to detection images bucket
            result = await storageService.uploadDetectionImage(file, entityId || 'generic', organizationId);
        }

        if (result) {
          uploadedFiles.push({
            ...result,
            originalFile: file
          });
          toast.success(`${file.name} uploaded successfully`);
        }
      }

      if (onFileUploaded && uploadedFiles.length > 0) {
        onFileUploaded(multiple ? uploadedFiles : uploadedFiles[0]);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get icon based on upload type
  const getIcon = () => {
    switch (uploadType) {
      case 'face':
      case 'image':
      case 'alert':
        return PhotoIcon;
      case 'video':
        return VideoCameraIcon;
      case 'document':
      case 'config':
        return DocumentIcon;
      default:
        return CloudArrowUpIcon;
    }
  };

  const Icon = getIcon();

  // Custom children or default UI
  if (children) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        <div onClick={openFileDialog}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <Icon className="mx-auto h-12 w-12 text-gray-400" />
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {uploadType === 'face' && 'Upload face images (JPG, PNG, GIF, WebP)'}
            {uploadType === 'image' && 'Upload images (JPG, PNG, GIF, WebP)'}
            {uploadType === 'video' && 'Upload videos (MP4, AVI, MOV, WebM)'}
            {uploadType === 'alert' && 'Upload images or videos'}
            {uploadType === 'document' && 'Upload documents (PDF, TXT, JSON)'}
            {uploadType === 'config' && 'Upload configuration files'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max size: {maxSizeMB}MB {multiple ? '• Multiple files allowed' : ''}
          </p>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-sm font-medium text-gray-900">Uploading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// File preview component
export function FilePreview({ file, onRemove, bucketId }) {
  const isImage = file.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = file.fileName?.match(/\.(mp4|avi|mov|wmv|webm)$/i);

  return (
    <div className="relative group">
      <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        {isImage ? (
          <img
            src={file.fileUrl}
            alt={file.fileName}
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <div className="w-full h-full flex items-center justify-center">
            <VideoCameraIcon className="h-8 w-8 text-gray-400" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DocumentIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
      
      {onRemove && (
        <button
          onClick={() => onRemove(file)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
      
      <p className="mt-1 text-xs text-gray-500 truncate w-24" title={file.fileName}>
        {file.fileName}
      </p>
    </div>
  );
}
