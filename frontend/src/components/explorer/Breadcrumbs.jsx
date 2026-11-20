import React from 'react';
import { ChevronRight, HardDrive, Folder, Trash2 } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';

export const Breadcrumbs = () => {
  const { breadcrumbs, navigateToFolder, isTrashView, files, folders } = useDrive();

  if (isTrashView) {
    return (
      <div className="flex items-center justify-between py-2 mb-3 sm:mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm">
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>Trash / Recycle Bin</span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:block">
          Deleted items can be restored or permanently purged
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 sm:py-2 mb-3 sm:mb-4 border-b border-slate-200/80 dark:border-slate-800/80 gap-2">
      {/* Breadcrumb list */}
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id || 'root'}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <button
                onClick={() => navigateToFolder(crumb)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                  isLast
                    ? 'font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 font-medium'
                }`}
              >
                {idx === 0 ? (
                  <HardDrive className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                )}
                <span className="truncate max-w-[120px] sm:max-w-[200px]">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Item counts */}
      <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
        <span className="hidden sm:inline">
          {folders.length} {folders.length === 1 ? 'folder' : 'folders'}, {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
        <span className="sm:hidden">
          {folders.length + files.length} items
        </span>
      </div>
    </div>
  );
};
