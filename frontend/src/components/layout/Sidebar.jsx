import React, { useState } from 'react';
import {
  HardDrive,
  FolderPlus,
  UploadCloud,
  Trash2,
  Share2,
  Plus,
  AlertTriangle,
  FileText,
  Clock,
  ChevronDown
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';

export const Sidebar = ({ onUploadClick, onNewFolderClick }) => {
  const {
    isTrashView,
    setIsTrashView,
    storageStats,
    navigateToFolder
  } = useDrive();

  const [showNewMenu, setShowNewMenu] = useState(false);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isWarning = storageStats.usedPercentage >= 80;
  const isDanger = storageStats.usedPercentage >= 95;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between h-[calc(100vh-4rem)] select-none">
      <div className="space-y-6">
        {/* "+ New" Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>New Action</span>
            <ChevronDown className="w-4 h-4 ml-auto opacity-75" />
          </button>

          {showNewMenu && (
            <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onUploadClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Upload File</p>
                  <p className="text-[10px] text-slate-400">Up to 50MB per SRS</p>
                </div>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />

              <button
                onClick={() => {
                  setShowNewMenu(false);
                  onNewFolderClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-indigo-500" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">New Folder</p>
                  <p className="text-[10px] text-slate-400">Hierarchical organization</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Categories */}
        <nav className="space-y-1">
          <button
            onClick={() => {
              setIsTrashView(false);
              navigateToFolder(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              !isTrashView
                ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className={`w-4 h-4 ${!isTrashView ? 'text-brand-600' : 'text-slate-400'}`} />
            <span>My Storage</span>
          </button>

          <button
            onClick={() => setIsTrashView(true)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              isTrashView
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <Trash2 className={`w-4 h-4 ${isTrashView ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Trash / Recycle</span>
          </button>
        </nav>
      </div>

      {/* Bottom: Storage Quota Widget (FR-18) */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>Storage Quota</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {storageStats.usedPercentage}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDanger
                  ? 'bg-rose-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-brand-500 to-indigo-500'
              }`}
              style={{ width: `${Math.max(3, storageStats.usedPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{formatBytes(storageStats.usedBytes)} used</span>
            <span>{formatBytes(storageStats.quotaBytes)} total</span>
          </div>

          {isWarning && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Approaching quota limit (FR-18)</span>
            </div>
          )}
        </div>

        {/* Academic Project Badge */}
        <div className="text-[10px] text-center text-slate-400 dark:text-slate-500">
          <p className="font-semibold text-slate-600 dark:text-slate-400">BIT Mesra • Project-I</p>
          <p>Dept. of Computer Science & Engg.</p>
        </div>
      </div>
    </aside>
  );
};
