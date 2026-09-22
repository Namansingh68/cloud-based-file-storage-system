import React, { useState } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Moon,
  Sun,
  HardDrive,
  LogOut,
  User as UserIcon,
  Filter,
  X,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onOpenAuth }) => {
  const {
    searchQuery,
    setSearchQuery,
    fileTypeFilter,
    setFileTypeFilter,
    viewMode,
    setViewMode,
    isActivityOpen,
    setIsActivityOpen
  } = useDrive();

  const { user, isAuthenticated, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const filterOptions = [
    { label: 'All Files', value: 'ALL' },
    { label: 'Documents', value: 'DOCUMENT' },
    { label: 'Images', value: 'IMAGE' },
    { label: 'Archives', value: 'ARCHIVE' }
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">CloudVault</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              SRS v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Secure Document Management</p>
        </div>
      </div>

      {/* Center: Search & Filter Bar */}
      <div className="flex-1 max-w-2xl relative">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search files and folders (FR-12)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 mr-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                fileTypeFilter !== 'ALL'
                  ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{filterOptions.find(f => f.value === fileTypeFilter)?.label}</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-float py-1.5 z-40">
                {filterOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFileTypeFilter(opt.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      fileTypeFilter === opt.value
                        ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List View"
            className={`p-1.5 rounded-lg text-xs transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Drawer Toggle (FR-13) */}
        <button
          onClick={() => setIsActivityOpen(!isActivityOpen)}
          title="Activity Log"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          title="Toggle Theme"
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* User Auth Section */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">{user.name || user.email}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{user.email}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow-brand-500/25"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
