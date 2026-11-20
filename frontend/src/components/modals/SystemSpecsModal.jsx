import React from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  Layers,
  FileCheck,
  Key,
  PieChart,
  Activity,
  GraduationCap
} from 'lucide-react';

export const SystemSpecsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">System Architecture & SRS Specs</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                  BIT Mesra MO-2026
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Secure Cloud-Based File Storage and Document Management System
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Grid of technical specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Card 1: Cryptography & Security */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs mb-2">
                <Lock className="w-4 h-4" />
                <span>Security & Cryptography</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>AES-256 Storage:</strong> Server-side file encryption at rest.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>BCrypt Hashing:</strong> 12-round salt derivation for passwords (FR-02).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>JWT Bearer:</strong> HMAC-SHA256 stateless session tokens.</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Access Control & Sharing */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>RBAC & Tokenization (FR-09 to FR-11)</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Granular RBAC:</strong> Owner, Collaborator (Edit), and Viewer roles.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Cryptographic Tokens:</strong> 256-bit entropy shareable URL tokens.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Custom Expiration:</strong> 24h, 7d, 30d, or permanent lifecycle rules.</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Storage & Dual-Engine */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs mb-2">
                <Database className="w-4 h-4" />
                <span>Dual-Engine Persistence (FR-20)</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>PostgreSQL Cloud:</strong> Supabase-backed relational schema + LOB binaries.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Local Filesystem:</strong> Automatic zero-setup disk fallback with H2.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Atomic Transactions:</strong> Rollback on storage failure.</span>
                </li>
              </ul>
            </div>

            {/* Card 4: Quota & Audit Trail */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs mb-2">
                <PieChart className="w-4 h-4" />
                <span>Quota & Audit Logging (FR-13 & FR-18)</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>500MB Dynamic Quota:</strong> Multi-tenant isolation with warnings at 80% and 95%.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Immutable Audit Trail:</strong> Timestamped action logging (Upload, Delete, Share).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span><strong>Soft-Delete Recovery:</strong> Recycle bin with 1-click restore (FR-17).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Academic Attribution Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Birla Institute of Technology, Mesra — Jaipur Campus
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI24300 / CS24300 Project-I • Supervisor: Dr. Kuntal Mukherjee
                </p>
              </div>
            </div>
            <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300">
              Team: Ravinder • Utkarsh • Naman
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-[11px] text-slate-400">
            Documented in SRS Section 3 & SDS Section 4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
};
