import React from 'react';
import { ChevronRight, Home, Folder, HardDrive, Trash2 } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';

export const Breadcrumbs = () => {
  const { breadcrumbs, navigateToFolder, isTrashView, files, folders } = useDrive();

  if (isTrashView) {
    return (
      <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Trash / Recycle Bin</span>
        </div>
        <span className="text-xs text-slate-400">Items here can be restored or permanently removed</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-200 dark:border-slate-800">
      {/* Breadcrumb list */}
      <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id || 'root'}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              <button
                onClick={() => navigateToFolder(crumb)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                  isLast
                    ? 'font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium'
                }`}
              >
                {idx === 0 ? <HardDrive className="w-3.5 h-3.5 text-brand-600" /> : <Folder className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Item counts */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0 ml-4 hidden sm:block">
        {folders.length} {folders.length === 1 ? 'folder' : 'folders'}, {files.length} {files.length === 1 ? 'file' : 'files'}
      </div>
    </div>
  );
};
