import React, { useState } from 'react';
import {
  Folder,
  FileText,
  UploadCloud,
  FolderPlus,
  ArrowUpDown,
  Download,
  Share2,
  Trash2,
  Eye,
  Edit2,
  Layers
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { Breadcrumbs } from './Breadcrumbs';
import { FolderItem, FileItem, formatBytes, formatDate, getFileDetails } from './FileItem';
import { RenameModal } from '../modals/RenameModal';
import { ShareModal } from '../modals/ShareModal';
import { FilePreviewModal } from '../modals/FilePreviewModal';
import { UploadModal } from '../modals/UploadModal';
import { NewFolderModal } from '../modals/NewFolderModal';
import { ActivityDrawer } from '../activity/ActivityDrawer';
import { TrashView } from '../trash/TrashView';
import api from '../../services/api';

export const ExplorerView = () => {
  const {
    folders,
    files,
    isTrashView,
    viewMode,
    sortBy,
    setSortBy,
    uploadFile,
    currentFolder,
    moveToTrash,
    setShareItem,
    setPreviewFile,
    setIsUploadModalOpen,
    setIsNewFolderOpen
  } = useDrive();

  const [renameTarget, setRenameTarget] = useState(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // Sorting
  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
    if (sortBy === 'date') return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    return 0;
  });

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name));

  // Canvas drag & drop file upload (FR-08)
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = async (e) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      for (let i = 0; i < droppedFiles.length; i++) {
        await uploadFile(droppedFiles[i], currentFolder?.id);
      }
    }
  };

  const handleDownload = (file) => {
    const token = localStorage.getItem('token') || '';
    const downloadUrl = `${api.defaults.baseURL}/files/${file.id}/download?token=${token}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
      className={`flex-1 p-6 overflow-y-auto relative transition-colors duration-150 ${
        isDragOverCanvas ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
      }`}
    >
      {/* Visual drag-over overlay */}
      {isDragOverCanvas && (
        <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-brand-500 bg-brand-50/80 dark:bg-brand-950/80 z-20 flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs animate-in fade-in">
          <UploadCloud className="w-16 h-16 text-brand-600 dark:text-brand-400 mb-2 animate-bounce" />
          <h3 className="text-base font-bold text-brand-900 dark:text-brand-100">Drop files here to upload</h3>
          <p className="text-xs text-brand-600 dark:text-brand-300 mt-1">Upload to {currentFolder?.name || 'My Drive'}</p>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumbs />

      {/* Main View: Trash vs Standard Explorer */}
      {isTrashView ? (
        <TrashView />
      ) : (
        <div className="space-y-8">
          {/* Folders Section */}
          {sortedFolders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Folders ({sortedFolders.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {sortedFolders.map(folder => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onRename={(f) => setRenameTarget({ ...f, type: 'folder' })}
                    onDelete={(f) => moveToTrash(f.id, 'folder')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Files ({sortedFiles.length})
              </h3>

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                  <option value="size">Sort by Size</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {sortedFolders.length === 0 && sortedFiles.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Folder is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Drag and drop files here, or use the buttons below to add content.
                </p>

                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload File</span>
                  </button>
                  <button
                    onClick={() => setIsNewFolderOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sortedFiles.map(file => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onRename={(f) => setRenameTarget({ ...f, type: 'file' })}
                    onDelete={(f) => moveToTrash(f.id, 'file')}
                    onShare={(f) => setShareItem({ ...f, type: 'file' })}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                      <th className="py-3 px-4 hidden md:table-cell">Last Modified</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedFiles.map(file => {
                      const { icon: FileIcon, color } = getFileDetails(file.name, file.contentType);
                      return (
                        <tr
                          key={file.id}
                          onDoubleClick={() => setPreviewFile(file)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
                                <FileIcon className="w-4 h-4" />
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600">
                                {file.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden sm:table-cell font-mono text-[11px]">
                            {formatBytes(file.size)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden md:table-cell text-[11px]">
                            {formatDate(file.updatedAt || file.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewFile(file);
                                }}
                                title="Preview"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                title="Download"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareItem({ ...file, type: 'file' });
                                }}
                                title="Share"
                                className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveToTrash(file.id, 'file');
                                }}
                                title="Delete"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals & Slide-overs */}
      <UploadModal />
      <NewFolderModal />
      <ShareModal />
      <FilePreviewModal />
      <ActivityDrawer />

      {renameTarget && (
        <RenameModal
          item={renameTarget}
          isOpen={!!renameTarget}
          onClose={() => setRenameTarget(null)}
        />
      )}
    </div>
  );
};
