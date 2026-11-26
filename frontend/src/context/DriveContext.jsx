import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DriveContext = createContext(null);

export const DriveProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Initial demonstration items for presentation and offline resiliency
  const INITIAL_FOLDERS = [
    { id: 101, name: 'Semester 5 Coursework', isDeleted: false, createdAt: '2026-09-20T10:00:00' },
    { id: 102, name: 'Documentation & SRS', isDeleted: false, createdAt: '2026-09-21T11:30:00' },
    { id: 103, name: 'System Design & Diagrams', isDeleted: false, createdAt: '2026-09-22T09:15:00' }
  ];

  const INITIAL_FILES = [
    {
      id: 201,
      name: 'CS24300_Project_SRS_Report.pdf',
      size: 6857053,
      contentType: 'application/pdf',
      createdAt: '2026-09-21T14:30:00',
      isDeleted: false,
      sampleText: 'Secure Cloud-Based File Storage and Document Management System - SRS Report (BIT Mesra MO-2026)'
    },
    {
      id: 202,
      name: 'System_Architecture_Diagram.png',
      size: 1450280,
      contentType: 'image/png',
      createdAt: '2026-09-22T08:20:00',
      isDeleted: false
    },
    {
      id: 203,
      name: 'Database_Schema_PostgreSQL.sql',
      size: 14820,
      contentType: 'text/plain',
      createdAt: '2026-09-22T10:15:00',
      isDeleted: false,
      sampleText: '-- PostgreSQL Database Schema for Secure Cloud File Storage\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  password_hash VARCHAR(255) NOT NULL,\n  name VARCHAR(255) NOT NULL,\n  storage_quota BIGINT DEFAULT 524288000,\n  used_storage BIGINT DEFAULT 0\n);\n\nCREATE TABLE folders (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  parent_id INT REFERENCES folders(id),\n  owner_id INT REFERENCES users(id),\n  is_deleted BOOLEAN DEFAULT FALSE\n);\n\nCREATE TABLE files (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  storage_path VARCHAR(500) NOT NULL,\n  size BIGINT NOT NULL,\n  content_type VARCHAR(100),\n  owner_id INT REFERENCES users(id),\n  folder_id INT REFERENCES folders(id),\n  is_deleted BOOLEAN DEFAULT FALSE\n);'
    },
    {
      id: 204,
      name: 'Project_Requirements_Notes.txt',
      size: 3240,
      contentType: 'text/plain',
      createdAt: '2026-09-22T12:00:00',
      isDeleted: false,
      sampleText: 'Project: Secure Cloud Storage and Document Management\nDepartment: Computer Science & Engineering, BIT Mesra\nTeam: Ravinder Dhayal, Utkarsh Tikkiwal, Naman Kumar\nSupervisor: Dr. Kuntal Mukherjee\nTech Stack: Spring Boot 3.x, React 19, Tailwind CSS, PostgreSQL / H2 Database'
    }
  ];

  const EMPTY_STORAGE_STATS = {
    usedBytes: 0,
    quotaBytes: 524288000, // 500 MB
    usedPercentage: 0,
    fileCount: 0,
    folderCount: 0
  };

  const DEMO_STORAGE_STATS = {
    usedBytes: 8325393,
    quotaBytes: 524288000, // 500 MB
    usedPercentage: 2,
    fileCount: 4,
    folderCount: 3
  };

  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
  // Keep authenticated drive strictly empty until fetched from backend; demo items are guest-only
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [demoFolders, setDemoFolders] = useState(INITIAL_FOLDERS);
  const [demoFiles, setDemoFiles] = useState(INITIAL_FILES);
  const [trashItems, setTrashItems] = useState({ files: [], folders: [] });
  const [isTrashView, setIsTrashView] = useState(false);
  const [loading, setLoading] = useState(() => isAuthenticated);
  const [hasLoadedAuthDrive, setHasLoadedAuthDrive] = useState(false);
  const [error, setError] = useState(null);

  // Mobile layout state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dark mode theme state with persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'date' | 'size'

  // Modals & Drawers state
  const [previewFile, setPreviewFile] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [activeItemMenu, setActiveItemMenu] = useState(null);

  // Storage Stats (Default 500MB per SRS FR-18)
  const [storageStats, setStorageStats] = useState(EMPTY_STORAGE_STATS);
  const [demoStorageStats, setDemoStorageStats] = useState(DEMO_STORAGE_STATS);

  // Clear authenticated user state immediately on sign-out so subsequent logins never flash old data
  useEffect(() => {
    const resetDriveState = () => {
      setFolders([]);
      setFiles([]);
      setTrashItems({ files: [], folders: [] });
      setCurrentFolder(null);
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
      setIsTrashView(false);
      setStorageStats(EMPTY_STORAGE_STATS);
      setHasLoadedAuthDrive(false);
      setError(null);
      setLoading(false);
    };
    window.addEventListener('auth-logout', resetDriveState);
    return () => window.removeEventListener('auth-logout', resetDriveState);
  }, []);

  // Fetch current folder contents or search
  const fetchContents = useCallback(async (folderId = currentFolder?.id || null) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      if (isTrashView) {
        const res = await api.get('/trash');
        setTrashItems({
          files: res.data.files || [],
          folders: res.data.folders || []
        });
      } else {
        const params = folderId ? { folderId } : {};
        const [folderRes, statsRes] = await Promise.all([
          api.get('/folders/contents', { params }),
          api.get('/dashboard/stats')
        ]);

        setFolders(folderRes.data.folders || []);
        setFiles(folderRes.data.files || []);
        setCurrentFolder(folderRes.data.currentFolder || null);

        if (folderRes.data.breadcrumbs) {
          setBreadcrumbs(folderRes.data.breadcrumbs);
        } else if (folderId === null) {
          setBreadcrumbs([{ id: null, name: 'My Drive' }]);
        }

        if (statsRes.data) {
          const used = statsRes.data.usedStorage || 0;
          const quota = statsRes.data.storageQuota || 524288000;
          setStorageStats({
            usedBytes: used,
            quotaBytes: quota,
            usedPercentage: Math.min(100, Math.round((used / quota) * 100)),
            fileCount: statsRes.data.fileCount || 0,
            folderCount: statsRes.data.folderCount || 0
          });
        }
      }
    } catch (err) {
      console.warn('API fetch failed:', err);
      setError('Unable to load your files right now. Please refresh or try again.');
    } finally {
      setLoading(false);
      setHasLoadedAuthDrive(true);
    }
  }, [isAuthenticated, isTrashView, currentFolder]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContents(currentFolder?.id || null);
    }
  }, [isAuthenticated, isTrashView, currentFolder?.id]);

  // Navigate folder
  const navigateToFolder = (folder) => {
    setIsTrashView(false);
    setIsMobileSidebarOpen(false); // Close mobile drawer on navigation
    if (!folder || folder.id === null) {
      setCurrentFolder(null);
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
      fetchContents(null);
    } else {
      setCurrentFolder(folder);
      setBreadcrumbs(prev => {
        const index = prev.findIndex(b => b.id === folder.id);
        if (index !== -1) {
          return prev.slice(0, index + 1);
        }
        return [...prev, { id: folder.id, name: folder.name }];
      });
      fetchContents(folder.id);
    }
  };

  // Upload file with progress tracking
  const uploadFile = async (file, folderId = currentFolder?.id, onProgress) => {
    if (!isAuthenticated) {
      const localFile = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        contentType: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString(),
        isDeleted: false,
        folderId: folderId || null,
        localBlobUrl: URL.createObjectURL(file)
      };
      setDemoFiles(prev => [localFile, ...prev]);
      setDemoStorageStats(prev => {
        const newUsed = prev.usedBytes + file.size;
        return {
          ...prev,
          usedBytes: newUsed,
          usedPercentage: Math.min(100, Math.round((newUsed / prev.quotaBytes) * 100)),
          fileCount: prev.fileCount + 1
        };
      });
      showToast(`Uploaded ${file.name} (Demo Preview)`, 'success');
      return { success: true, file: localFile };
    }

    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        }
      });
      await fetchContents(folderId);
      showToast(`Uploaded ${file.name} successfully`, 'success');
      return { success: true, file: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to upload ${file.name}.`;
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Create new folder
  const createFolder = async (name) => {
    if (!isAuthenticated) {
      const newFolder = {
        id: Date.now(),
        name,
        parentId: currentFolder?.id || null,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      setDemoFolders(prev => [...prev, newFolder]);
      setDemoStorageStats(prev => ({ ...prev, folderCount: prev.folderCount + 1 }));
      showToast(`Folder "${name}" created (Demo Preview)`, 'success');
      return { success: true, folder: newFolder };
    }

    try {
      const res = await api.post('/folders', {
        name,
        parentId: currentFolder?.id || null
      });
      await fetchContents(currentFolder?.id || null);
      showToast(`Folder "${name}" created`, 'success');
      return { success: true, folder: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create folder.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Rename file or folder
  const renameItem = async (id, type, newName) => {
    if (!isAuthenticated) {
      if (type === 'folder') {
        setDemoFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      } else {
        setDemoFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      }
      showToast(`Renamed to "${newName}"`, 'success');
      return { success: true };
    }

    try {
      const endpoint = type === 'folder' ? `/folders/${id}/rename` : `/files/${id}/rename`;
      await api.put(endpoint, { newName });
      await fetchContents(currentFolder?.id || null);
      showToast(`Renamed to "${newName}"`, 'success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to rename item.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Soft delete (move to trash)
  const moveToTrash = async (id, type) => {
    if (!isAuthenticated) {
      if (type === 'folder') {
        const target = demoFolders.find(f => f.id === id);
        if (target) {
          setDemoFolders(prev => prev.filter(f => f.id !== id));
          setTrashItems(prev => ({ ...prev, folders: [...prev.folders, { ...target, isDeleted: true }] }));
        }
      } else {
        const target = demoFiles.find(f => f.id === id);
        if (target) {
          setDemoFiles(prev => prev.filter(f => f.id !== id));
          setTrashItems(prev => ({ ...prev, files: [...prev.files, { ...target, isDeleted: true }] }));
        }
      }
      showToast('Moved to Trash / Recycle Bin', 'info');
      return { success: true };
    }

    try {
      const endpoint = type === 'folder' ? `/folders/${id}` : `/files/${id}`;
      await api.delete(endpoint);
      await fetchContents(currentFolder?.id || null);
      showToast('Moved to Trash / Recycle Bin', 'info');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to move item to Trash.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Restore from trash
  const restoreFromTrash = async (id, type) => {
    if (!isAuthenticated) {
      if (type === 'folder') {
        const target = trashItems.folders.find(f => f.id === id);
        if (target) {
          setTrashItems(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== id) }));
          setDemoFolders(prev => [...prev, { ...target, isDeleted: false }]);
        }
      } else {
        const target = trashItems.files.find(f => f.id === id);
        if (target) {
          setTrashItems(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
          setDemoFiles(prev => [...prev, { ...target, isDeleted: false }]);
        }
      }
      showToast('Restored successfully', 'success');
      return { success: true };
    }

    try {
      const endpoint = type === 'folder' ? `/folders/${id}/restore` : `/files/${id}/restore`;
      await api.post(endpoint);
      await fetchContents();
      showToast('Restored successfully', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to restore item.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Permanent Delete
  const permanentDelete = async (id, type) => {
    if (!isAuthenticated) {
      if (type === 'folder') {
        setTrashItems(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== id) }));
      } else {
        setTrashItems(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
      }
      showToast('Permanently deleted', 'warning');
      return { success: true };
    }

    try {
      const endpoint = type === 'folder' ? `/folders/${id}/permanent` : `/files/${id}/permanent`;
      await api.delete(endpoint);
      await fetchContents();
      showToast('Permanently deleted', 'warning');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to permanently delete item.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Move item to another folder
  const moveItem = async (id, type, targetFolderId) => {
    if (!isAuthenticated) {
      if (type === 'folder') {
        setDemoFolders(prev => prev.map(f => f.id === id ? { ...f, parentId: targetFolderId } : f));
      } else {
        setDemoFiles(prev => prev.map(f => f.id === id ? { ...f, folderId: targetFolderId } : f));
      }
      showToast('Moved item successfully', 'success');
      return { success: true };
    }

    try {
      const endpoint = type === 'folder' ? `/folders/${id}/move` : `/files/${id}/move`;
      await api.put(endpoint, { targetFolderId });
      await fetchContents(currentFolder?.id || null);
      showToast('Moved item successfully', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to move item.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const activeFolders = isAuthenticated ? folders : demoFolders;
  const activeFiles = isAuthenticated ? files : demoFiles;
  const activeStorageStats = isAuthenticated ? storageStats : demoStorageStats;

  // Filtered files & folders
  const filteredFiles = activeFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (fileTypeFilter === 'ALL') return true;
    if (fileTypeFilter === 'DOCUMENT') {
      return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'pptx'].some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
    }
    if (fileTypeFilter === 'IMAGE') {
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
    }
    if (fileTypeFilter === 'ARCHIVE') {
      return ['zip', 'rar', 'tar', 'gz', '7z'].some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
    }
    return true;
  });

  const filteredFolders = activeFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DriveContext.Provider value={{
      currentFolder,
      breadcrumbs,
      folders: filteredFolders,
      files: filteredFiles,
      trashItems,
      isTrashView,
      setIsTrashView,
      loading: loading || (isAuthenticated && !hasLoadedAuthDrive),
      error,
      searchQuery,
      setSearchQuery,
      fileTypeFilter,
      setFileTypeFilter,
      viewMode,
      setViewMode,
      sortBy,
      setSortBy,
      storageStats: activeStorageStats,
      navigateToFolder,
      fetchContents,
      uploadFile,
      createFolder,
      renameItem,
      moveToTrash,
      restoreFromTrash,
      permanentDelete,
      moveItem,
      // Mobile Drawer & Theme
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      isDarkMode,
      toggleDarkMode,
      // Toast
      toast,
      showToast,
      setToast,
      // Modals
      previewFile,
      setPreviewFile,
      shareItem,
      setShareItem,
      isNewFolderOpen,
      setIsNewFolderOpen,
      isUploadModalOpen,
      setIsUploadModalOpen,
      isActivityOpen,
      setIsActivityOpen,
      isSpecsModalOpen,
      setIsSpecsModalOpen,
      activeItemMenu,
      setActiveItemMenu
    }}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => useContext(DriveContext);
