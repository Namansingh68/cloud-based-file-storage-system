import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowUp } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { formatBytes } from '../explorer/FileItem';

export const UploadModal = () => {
  const { isUploadModalOpen, setIsUploadModalOpen, uploadFile, currentFolder } = useDrive();
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isUploadModalOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    setError(null);
    setIsSuccess(false);
    setProgress(0);

    // Max 50MB per SRS Section 3.3
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File size exceeds the 50MB limit specified in SRS Section 3.3.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    const res = await uploadFile(selectedFile, currentFolder?.id, (percent) => {
      setProgress(percent);
    });

    setUploading(false);
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setIsSuccess(false);
        setProgress(0);
      }, 1200);
    } else {
      setError(res.error || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload File (FR-04, FR-08)</h3>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragOver
                ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[1.01]'
                : 'border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 bg-slate-50/40 dark:bg-slate-800/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm">
              <ArrowUp className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag and drop
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Supported: PDF, DOCX, Images, Audio, Video, Code (Max 50MB)
              </p>
            </div>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400">{formatBytes(selectedFile.size)}</p>
                </div>
              </div>

              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            </div>
          )}

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleStartUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
          >
            {isSuccess ? 'Upload Completed!' : uploading ? `Uploading (${progress}%)...` : 'Confirm Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};
