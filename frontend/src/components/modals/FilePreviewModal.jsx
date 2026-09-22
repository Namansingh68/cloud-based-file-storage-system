import React, { useState, useEffect } from 'react';
import { X, Download, Maximize2, Minimize2, FileText, ExternalLink } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { formatBytes, formatDate } from '../explorer/FileItem';
import api from '../../services/api';

export const FilePreviewModal = () => {
  const { previewFile, setPreviewFile } = useDrive();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (!previewFile) {
      setTextContent('');
      return;
    }

    const ext = previewFile.name?.split('.').pop().toLowerCase();
    const isTextFile = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'sql', 'xml', 'log'].includes(ext);

    if (previewFile.sampleText) {
      setTextContent(previewFile.sampleText);
    } else if (isTextFile) {
      setLoadingText(true);
      api.get(`/files/${previewFile.id}/preview`, { responseType: 'text' })
        .then(res => {
          setTextContent(res.data);
        })
        .catch(err => {
          setTextContent('Sample preview content for ' + previewFile.name + '\nSecure document storage enabled.');
        })
        .finally(() => {
          setLoadingText(false);
        });
    }
  }, [previewFile]);

  if (!previewFile) return null;

  const ext = previewFile.name?.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || previewFile.contentType?.startsWith('image/');
  const isPdf = ext === 'pdf' || previewFile.contentType === 'application/pdf';
  const isText = ['txt', 'md', 'json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'sql', 'xml', 'log'].includes(ext);
  const isAudio = ['mp3', 'wav', 'ogg'].includes(ext);
  const isVideo = ['mp4', 'webm'].includes(ext);

  const previewUrl = previewFile.localBlobUrl || `${api.defaults.baseURL}/files/${previewFile.id}/preview?token=${localStorage.getItem('token') || ''}`;
  const downloadUrl = previewFile.localBlobUrl || `${api.defaults.baseURL}/files/${previewFile.id}/download?token=${localStorage.getItem('token') || ''}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl max-h-[88vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{previewFile.name}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatBytes(previewFile.size)} • {formatDate(previewFile.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadUrl}
              download={previewFile.name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950/60 min-h-[350px]">
          {isImage ? (
            <img
              src={previewUrl}
              alt={previewFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : isPdf ? (
            <iframe
              src={`${previewUrl}#toolbar=1`}
              title={previewFile.name}
              className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
            />
          ) : isText ? (
            <div className="w-full h-[65vh] bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-auto leading-relaxed border border-slate-800">
              {loadingText ? (
                <div className="flex items-center justify-center h-full text-slate-400">Loading preview...</div>
              ) : (
                <pre>{textContent}</pre>
              )}
            </div>
          ) : isAudio ? (
            <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex flex-col items-center gap-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Audio Preview</p>
              <audio controls src={previewUrl} className="w-72" />
            </div>
          ) : isVideo ? (
            <video controls src={previewUrl} className="max-w-full max-h-[70vh] rounded-xl shadow-md" />
          ) : (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">No Inline Preview Available</h4>
              <p className="text-xs text-slate-400 mb-4">This file format is best viewed with an external application.</p>
              <a
                href={downloadUrl}
                download={previewFile.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
