import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  FileAudio,
  FileVideo,
  File as FileDefault,
  MoreVertical,
  Download,
  Eye,
  Share2,
  Edit2,
  Trash2
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';

export const getFileDetails = (fileName, contentType) => {
  const ext = fileName ? fileName.split('.').pop().toLowerCase() : '';

  if (['pdf'].includes(ext) || contentType === 'application/pdf') {
    return { icon: FileText, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50', type: 'PDF' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext) || contentType?.startsWith('image/')) {
    return { icon: FileImage, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50', type: 'IMAGE' };
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return { icon: FileArchive, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50', type: 'ARCHIVE' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'sql', 'xml', 'log', 'sh', 'bat'].includes(ext)) {
    return { icon: FileCode, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50', type: 'CODE' };
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || contentType?.startsWith('audio/')) {
    return { icon: FileAudio, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50', type: 'AUDIO' };
  }
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || contentType?.startsWith('video/')) {
    return { icon: FileVideo, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900/50', type: 'VIDEO' };
  }
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'pptx'].includes(ext)) {
    return { icon: FileText, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50', type: 'DOC' };
  }
  return { icon: FileDefault, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', type: ext.toUpperCase() || 'FILE' };
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateStr) => {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const FolderItem = ({ folder, onRename, onDelete }) => {
  const { navigateToFolder, moveItem } = useDrive();
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const item = JSON.parse(data);
        if (item.id !== folder.id) {
          moveItem(item.id, item.type, folder.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFolderClick = (e) => {
    if (menuRef.current && menuRef.current.contains(e.target)) return;
    navigateToFolder(folder);
  };

  return (
    <div
      onClick={handleFolderClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
        isDragOver
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 shadow-md ring-2 ring-brand-500/20'
          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
          <Folder className="w-5 h-5 fill-indigo-500/20" />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <p
            className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 break-words"
            title={folder.name}
          >
            {folder.name}
          </p>
          <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">Folder</span>
        </div>
      </div>

      {/* Menu Trigger */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Folder options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onRename(folder);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDelete(folder);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Move to Trash</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const FileItem = ({ file, onRename, onDelete, onShare, onDownload }) => {
  const { setPreviewFile } = useDrive();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const { icon: FileIcon, color, type } = getFileDetails(file.name, file.contentType);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: file.id, type: 'file' }));
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => setPreviewFile(file)}
      className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer select-none active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color} group-hover:scale-105 transition-transform shadow-2xs`}>
            <FileIcon className="w-5 h-5" />
          </div>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            {type}
          </span>
        </div>

        {/* Action Controls & Menu */}
        <div className="flex items-center gap-1">
          {/* Desktop Hover Quick Actions */}
          <div className="hidden lg:group-hover:flex items-center gap-0.5 animate-in fade-in duration-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewFile(file);
              }}
              title="Quick Preview"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
              title="Download File"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menu button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="File options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setPreviewFile(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-500" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDownload(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>Download</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onShare(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Link</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onRename(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rename</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete(file);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <p
          className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 break-words min-h-[2.1rem]"
          title={file.name}
        >
          {file.name}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="font-mono">{formatBytes(file.size)}</span>
          <span className="truncate ml-1">{formatDate(file.updatedAt || file.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};
