import React from 'react';
import { Trash2, RefreshCw, AlertCircle, FileText, Folder, Check } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { formatBytes, formatDate, getFileDetails } from '../explorer/FileItem';

export const TrashView = () => {
  const { trashItems, restoreFromTrash, permanentDelete } = useDrive();
  const { files = [], folders = [] } = trashItems;

  const totalItems = files.length + folders.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Trash / Recycle Bin (FR-17)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deleted files and folders are retained here and can be restored at any time.
          </p>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <Trash2 className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Trash is empty</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Items you delete from your drive will appear here before being permanently removed.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Deleted Folders */}
            {folders.map(folder => (
              <div key={`folder-${folder.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{folder.name}</p>
                    <span className="text-[10px] text-slate-400">Folder • Deleted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restoreFromTrash(folder.id, 'folder')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => permanentDelete(folder.id, 'folder')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Deleted Files */}
            {files.map(file => {
              const { icon: FileIcon, color } = getFileDetails(file.name, file.contentType);
              return (
                <div key={`file-${file.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                      <FileIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{file.name}</p>
                      <span className="text-[10px] text-slate-400">{formatBytes(file.size)} • Deleted</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restoreFromTrash(file.id, 'file')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => permanentDelete(file.id, 'file')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
