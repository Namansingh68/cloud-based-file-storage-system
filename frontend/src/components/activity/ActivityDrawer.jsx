import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  UploadCloud,
  Download,
  Share2,
  Trash2,
  FolderPlus,
  Edit2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import api from '../../services/api';

export const ActivityDrawer = () => {
  const { isActivityOpen, setIsActivityOpen } = useDrive();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity');
      setActivities(res.data || []);
    } catch (err) {
      console.warn('Activity fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActivityOpen) {
      fetchActivities();
    }
  }, [isActivityOpen]);

  if (!isActivityOpen) return null;

  const getActivityIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'UPLOAD':
        return <UploadCloud className="w-3.5 h-3.5 text-emerald-500" />;
      case 'DOWNLOAD':
        return <Download className="w-3.5 h-3.5 text-blue-500" />;
      case 'SHARE':
        return <Share2 className="w-3.5 h-3.5 text-indigo-500" />;
      case 'CREATE_FOLDER':
        return <FolderPlus className="w-3.5 h-3.5 text-purple-500" />;
      case 'RENAME':
        return <Edit2 className="w-3.5 h-3.5 text-amber-500" />;
      case 'DELETE':
        return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
      date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsActivityOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Log (FR-13)</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchActivities}
                title="Refresh"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsActivityOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No recent activity</p>
                <p className="text-[10px] text-slate-400 mt-1">Actions like upload, download, and share will appear here.</p>
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3 text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                    {getActivityIcon(act.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {act.targetName || act.details || 'Resource action'}
                    </p>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {act.action?.toLowerCase()} • {act.targetType?.toLowerCase()}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">
                      {formatTimestamp(act.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
