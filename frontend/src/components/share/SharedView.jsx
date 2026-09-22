import React, { useState, useEffect } from 'react';
import { HardDrive, Download, Eye, FileText, Lock, AlertCircle, ShieldCheck, CheckCircle } from 'lucide-react';
import { formatBytes, formatDate, getFileDetails } from '../explorer/FileItem';
import api from '../../services/api';

export const SharedView = ({ token, onBack }) => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedResource = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/share/${token}`);
        setResource(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Shared link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedResource();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Validating secure share link...</p>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Access Denied or Expired</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This shareable link cannot be accessed.'}</p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Go to CloudVault Home
          </button>
        </div>
      </div>
    );
  }

  const { file, folder, permission } = resource;
  const targetItem = file || folder;
  const isFile = !!file;
  const { icon: FileIcon, color } = getFileDetails(targetItem.name, file?.contentType);

  const downloadUrl = `${api.defaults.baseURL}/share/${token}/download`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-sm">CloudVault Shared Document</h1>
            <span className="text-[10px] text-slate-400">Secure Cloud Storage</span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
        >
          Open CloudVault
        </button>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${color}`}>
              <FileIcon className="w-7 h-7" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                {permission} ACCESS
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate" title={targetItem.name}>
                {targetItem.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFile ? formatBytes(targetItem.size) : 'Shared Folder'} • Shared via Secure Link
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {isFile && (
              <a
                href={downloadUrl}
                download={targetItem.name}
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Shared File</span>
              </a>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Security:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Link
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Created:</span>
                <span>{formatDate(targetItem.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Secure Cloud-Based File Storage System • BIT Mesra Project-I (MO-2026)
      </footer>
    </div>
  );
};
