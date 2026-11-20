import React, { useState, useEffect } from 'react';
import { HardDrive, Download, Eye, FileText, Lock, AlertCircle, ShieldCheck, CheckCircle, ExternalLink } from 'lucide-react';
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

      // Handle demo mode token for offline presentations
      if (token && token.startsWith('demo-share')) {
        setTimeout(() => {
          setResource({
            file: {
              id: 999,
              name: 'CS24300_Project_SRS_Report.pdf',
              size: 6857053,
              contentType: 'application/pdf',
              createdAt: '2026-09-21T14:30:00'
            },
            permission: 'VIEWER',
            expiresAt: '2026-12-31T23:59:59'
          });
          setLoading(false);
        }, 400);
        return;
      }

      try {
        const res = await api.get(`/share/${token}`);
        setResource(res.data);
      } catch (err) {
        console.warn('Share fetch error, providing demo fallback:', err);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Validating secure share token...</p>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">Access Denied or Expired</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This shareable link cannot be accessed.'}</p>
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
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
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">CloudVault Shared Link</h1>
            <span className="text-[10px] text-slate-400">Encrypted Cloud Storage</span>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
        >
          Open App
        </button>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4 mb-6">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 ${color}`}>
              <FileIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>{permission === 'EDITOR' ? 'Collaborator Access' : 'Viewer Access'}</span>
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate" title={targetItem.name}>
                {targetItem.name}
              </h2>
              {isFile && (
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {formatBytes(targetItem.size)} • {formatDate(targetItem.createdAt)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {isFile && (
              <a
                href={downloadUrl}
                download={targetItem.name}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </a>
            )}

            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Sign In to CloudVault
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] text-slate-400">
              Protected by 256-bit Token Validation • BIT Mesra Project-I
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[10px] text-slate-400">
        CloudVault Document Management System • Presentation Release
      </footer>
    </div>
  );
};
