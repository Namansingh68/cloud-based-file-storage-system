import React, { useState } from 'react';
import {
  HardDrive,
  FolderPlus,
  UploadCloud,
  Trash2,
  Plus,
  AlertTriangle,
  ChevronDown,
  X,
  PieChart,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';

export const Sidebar = ({ onUploadClick, onNewFolderClick }) => {
  const {
    isTrashView,
    setIsTrashView,
    storageStats,
    navigateToFolder,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    setIsSpecsModalOpen
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 select-none">
      <div className="space-y-5">
        {/* "+ New" Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/25 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Action</span>
            <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
          </button>

          {showNewMenu && (
            <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setShowNewMenu(false);
                  setIsMobileSidebarOpen(false);
                  onUploadClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">Upload File</p>
                  <p className="text-[10px] text-slate-400">Up to 50MB</p>
                </div>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1" />

              <button
                onClick={() => {
                  setShowNewMenu(false);
                  setIsMobileSidebarOpen(false);
                  onNewFolderClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">New Folder</p>
                  <p className="text-[10px] text-slate-400">Organize files into folders</p>
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
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isTrashView
                ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className={`w-4 h-4 ${!isTrashView ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>My Storage</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
              {storageStats.fileCount}
            </span>
          </button>

          <button
            onClick={() => {
              setIsTrashView(true);
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isTrashView
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Trash2 className={`w-4 h-4 ${isTrashView ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Trash</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom: Storage Quota Widget */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-brand-600" />
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

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{formatBytes(storageStats.usedBytes)} used</span>
            <span>{formatBytes(storageStats.quotaBytes)} total</span>
          </div>

          {isWarning && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-[10px] text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Approaching quota limit</span>
            </div>
          )}
        </div>

        {/* Project & Architecture Info Card */}
        <div
          onClick={() => {
            setIsSpecsModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          title="Click to view Architecture & Specifications"
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer hover:border-brand-500/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
        >
          <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-200 mb-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
              <span>CloudVault Storage</span>
            </span>
            <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 underline">Specs →</span>
          </div>
          <p className="text-[10px] text-slate-400">BIT Mesra • Enterprise Document Vault</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (docked) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-slate-200 dark:border-slate-800 animate-slide-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  CloudVault
                </span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
