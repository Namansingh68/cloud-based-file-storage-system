import React, { useState } from 'react';
import { X, Share2, Copy, Check, Calendar, Shield, Globe } from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import api from '../../services/api';

export const ShareModal = () => {
  const { shareItem, setShareItem, showToast } = useDrive();
  const [permission, setPermission] = useState('VIEWER');
  const [expiresInHours, setExpiresInHours] = useState('168'); // 7 days
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!shareItem) return null;

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/share', {
        fileId: shareItem.type === 'file' ? shareItem.id : null,
        folderId: shareItem.type === 'folder' ? shareItem.id : null,
        permission,
        expiresInHours: expiresInHours === '0' ? null : parseInt(expiresInHours, 10)
      });

      const token = res.data.token;
      const origin = window.location.origin;
      const fullUrl = `${origin}/shared/${token}`;
      setGeneratedLink(fullUrl);
      showToast('Shareable link generated successfully', 'success');
    } catch (err) {
      console.warn('Backend offline, generating demo share link:', err);
      // Demo link generation
      const demoToken = 'demo-share-' + (shareItem.id || 'res') + '-' + Math.random().toString(36).substring(2, 9);
      const fullUrl = `${window.location.origin}/shared/${demoToken}`;
      setGeneratedLink(fullUrl);
      showToast('Shareable link generated (Demo Mode)', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast('Link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Resource (FR-09)</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">{shareItem.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShareItem(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Configurable Permissions (FR-10) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Access Permission (FR-10 & FR-11)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPermission('VIEWER')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  permission === 'VIEWER'
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">Viewer (Read-Only)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Can view & download file</span>
              </button>

              <button
                type="button"
                onClick={() => setPermission('EDITOR')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  permission === 'EDITOR'
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">Collaborator (Edit)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Can edit & rename content</span>
              </button>
            </div>
          </div>

          {/* Expiration Settings (FR-10) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Link Expiration Timeline</span>
            </label>
            <select
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="24">Expires in 24 hours</option>
              <option value="168">Expires in 7 days</option>
              <option value="720">Expires in 30 days</option>
              <option value="0">Never expires (Permanent token)</option>
            </select>
          </div>

          {/* Generate button or Generated Link */}
          {!generatedLink ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 active:scale-[0.98]"
            >
              <Globe className="w-4 h-4" />
              <span>{loading ? 'Generating Link...' : 'Create Shareable Link (FR-09)'}</span>
            </button>
          ) : (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Shareable Link Ready</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 dark:text-slate-200 select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Anyone with this link can access according to {permission === 'VIEWER' ? 'Viewer' : 'Collaborator'} rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
