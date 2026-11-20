import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, FileText, Copy, Check } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { formatBytes, formatDate } from '../explorer/FileItem';
import api from '../../services/api';

export const FilePreviewModal = () => {
  const { previewFile, setPreviewFile, showToast } = useDrive();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (!previewFile) {
      setTextContent('');
      return;
    }

    const ext = previewFile.name?.split('.').pop().toLowerCase();
    const isTextFile = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'sql', 'xml', 'log', 'sh'].includes(ext);

    if (previewFile.sampleText) {
      setTextContent(previewFile.sampleText);
    } else if (isTextFile) {
      setLoadingText(true);
      api.get(`/files/${previewFile.id}/preview`, { responseType: 'text' })
        .then(res => {
          setTextContent(res.data);
        })
        .catch(err => {
          setTextContent(`// Preview for ${previewFile.name}\n// Encrypted file stored securely in CloudVault.\n// Created: ${previewFile.createdAt || 'Recent'}\n// Size: ${formatBytes(previewFile.size)}`);
        })
        .finally(() => {
          setLoadingText(false);
        });
    }
  }, [previewFile]);

  if (!previewFile) return null;

  const ext = previewFile.name?.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || previewFile.contentType?.startsWith('image/');
  const isPdf = ext === 'pdf' || previewFile.contentType === 'application/pdf';
  const isText = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'sql', 'xml', 'log', 'sh'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a'].includes(ext) || previewFile.contentType?.startsWith('audio/');
  const isVideo = ['mp4', 'webm', 'mov'].includes(ext) || previewFile.contentType?.startsWith('video/');

  const token = localStorage.getItem('token') || '';
  const previewUrl = previewFile.localBlobUrl || `${api.defaults.baseURL}/files/${previewFile.id}/preview?token=${token}`;
  const downloadUrl = previewFile.localBlobUrl || `${api.defaults.baseURL}/files/${previewFile.id}/download?token=${token}`;

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    showToast('Text copied to clipboard', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="min-w-0 pr-3 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="truncate">{previewFile.name}</span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
              {formatBytes(previewFile.size)} • {formatDate(previewFile.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isText && textContent && (
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                title="Copy content"
              >
                {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <a
              href={downloadUrl}
              download={previewFile.name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setPreviewFile(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer (FR-16) */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/70 min-h-[300px]">
          {isImage ? (
            <img
              src={previewUrl}
              alt={previewFile.name}
              className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : isPdf ? (
            <div className="w-full h-full min-h-[50vh] sm:min-h-[65vh] flex flex-col">
              <iframe
                src={`${previewUrl}#toolbar=1`}
                title={previewFile.name}
                className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
              />
              <div className="mt-2 text-center sm:hidden">
                <a
                  href={downloadUrl}
                  download={previewFile.name}
                  className="text-xs text-brand-600 dark:text-brand-400 font-semibold underline"
                >
                  If preview doesn't display on phone, tap here to download PDF
                </a>
              </div>
            </div>
          ) : isText ? (
            <div className="w-full h-[55vh] sm:h-[65vh] bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-auto leading-relaxed border border-slate-800 select-text">
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading document content...</div>
              ) : (
                <pre className="whitespace-pre-wrap break-all">{textContent}</pre>
              )}
            </div>
          ) : isAudio ? (
            <div className="p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm flex flex-col items-center gap-4 max-w-sm w-full">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Audio Preview</p>
              <audio controls src={previewUrl} className="w-full" />
            </div>
          ) : isVideo ? (
            <video controls src={previewUrl} className="max-w-full max-h-[65vh] rounded-2xl shadow-md" />
          ) : (
            <div className="text-center p-6 sm:p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 max-w-sm w-full">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Preview Not Supported Directly</h4>
              <p className="text-xs text-slate-400 mb-4">This file format is best viewed with an external application.</p>
              <a
                href={downloadUrl}
                download={previewFile.name}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download {previewFile.name}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
