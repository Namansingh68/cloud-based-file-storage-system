import React, { useState } from 'react';
import {
  UploadCloud,
  FolderPlus,
  ArrowUpDown,
  Download,
  Share2,
  Trash2,
  Eye,
  Plus,
  Search,
  LayoutGrid,
  List
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
    setViewMode,
    sortBy,
    setSortBy,
    uploadFile,
    currentFolder,
    moveToTrash,
    setShareItem,
    setPreviewFile,
    setIsUploadModalOpen,
    setIsNewFolderOpen,
    searchQuery,
    setSearchQuery
  } = useDrive();

  const [renameTarget, setRenameTarget] = useState(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);
  const [showMobileFabMenu, setShowMobileFabMenu] = useState(false);

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
    if (file.localBlobUrl) {
      const a = document.createElement('a');
      a.href = file.localBlobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
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
      className={`flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto relative transition-colors duration-150 safe-bottom ${
        isDragOverCanvas ? 'bg-brand-50/50 dark:bg-brand-950/20' : ''
      }`}
    >
      {/* Visual drag-over overlay */}
      {isDragOverCanvas && (
        <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-brand-500 bg-brand-50/90 dark:bg-brand-950/90 z-20 flex flex-col items-center justify-center pointer-events-none backdrop-blur-xs animate-in fade-in">
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
        <div className="space-y-6 sm:space-y-8">
          {/* Folders Section */}
          {sortedFolders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Folders ({sortedFolders.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
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
            <div className="flex items-center justify-between mb-2.5 sm:mb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Files ({sortedFiles.length})
              </h3>

              {/* Toolbar Controls: Sort & Mobile View Switch */}
              <div className="flex items-center gap-2">
                {/* Mobile View Toggle */}
                <div className="flex sm:hidden items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded-md text-xs ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-2xs font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded-md text-xs ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-2xs font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sort Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="date">Sort: Date</option>
                    <option value="size">Sort: Size</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Empty State when no folders or files exist */}
            {sortedFolders.length === 0 && sortedFiles.length === 0 ? (
              searchQuery ? (
                /* Search Not Found State */
                <div className="text-center py-16 px-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    No results found for "{searchQuery}"
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Try checking for typos or clear your search query to see all items.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                /* Empty Folder State */
                <div className="text-center py-16 sm:py-20 px-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
                    Folder is currently empty
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Upload documents or create folders to organize your files securely.
                  </p>

                  <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload File</span>
                    </button>
                    <button
                      onClick={() => setIsNewFolderOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all active:scale-[0.98]"
                    >
                      <FolderPlus className="w-4 h-4 text-indigo-500" />
                      <span>New Folder</span>
                    </button>
                  </div>
                </div>
              )
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
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
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 font-bold">
                      <th className="py-3 px-3 sm:px-4">Name</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                      <th className="py-3 px-4 hidden md:table-cell">Last Modified</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedFiles.map(file => {
                      const { icon: FileIcon, color } = getFileDetails(file.name, file.contentType);
                      return (
                        <tr
                          key={file.id}
                          onClick={() => setPreviewFile(file)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
                                <FileIcon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 block max-w-[150px] sm:max-w-xs md:max-w-md">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 sm:hidden block">
                                  {formatBytes(file.size)} • {formatDate(file.updatedAt || file.createdAt)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden sm:table-cell font-mono text-[11px]">
                            {formatBytes(file.size)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 hidden md:table-cell text-[11px]">
                            {formatDate(file.updatedAt || file.createdAt)}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setPreviewFile(file)}
                                title="Preview"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(file)}
                                title="Download"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShareItem({ ...file, type: 'file' })}
                                title="Share"
                                className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveToTrash(file.id, 'file')}
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

      {/* Mobile Floating Action Button (FAB) (md:hidden) */}
      <div className="md:hidden fixed bottom-5 right-5 z-40">
        {showMobileFabMenu && (
          <div className="mb-3 flex flex-col gap-2 items-end animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowMobileFabMenu(false);
                setIsNewFolderOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-lg text-xs font-bold"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
            <button
              onClick={() => {
                setShowMobileFabMenu(false);
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600 text-white shadow-lg text-xs font-bold"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload File</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowMobileFabMenu(!showMobileFabMenu)}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-500/30 transition-all active:scale-95 ${
            showMobileFabMenu ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-tr from-brand-600 to-indigo-600'
          }`}
          aria-label="Add new file or folder"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

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
