import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DriveContext = createContext(null);

export const DriveProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();

  // Default demonstration items for public web visitors
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
      sampleText: '-- PostgreSQL Database Schema for Secure Cloud File Storage\nCREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, storage_quota BIGINT DEFAULT 524288000, used_storage BIGINT DEFAULT 0);\nCREATE TABLE folders (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, parent_id INT REFERENCES folders(id), owner_id INT REFERENCES users(id), is_deleted BOOLEAN DEFAULT FALSE);\nCREATE TABLE files (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, storage_path VARCHAR(500) NOT NULL, size BIGINT NOT NULL, content_type VARCHAR(100), owner_id INT REFERENCES users(id), folder_id INT REFERENCES folders(id), is_deleted BOOLEAN DEFAULT FALSE);'
    },
    {
      id: 204,
      name: 'Project_Requirements_Notes.txt',
      size: 3240,
      contentType: 'text/plain',
      createdAt: '2026-09-22T12:00:00',
      isDeleted: false,
      sampleText: 'Project: Secure Cloud Storage and Document Management\nDepartment: Computer Science & Engineering, BIT Mesra\nTeam: Ravinder Dhayal, Utkarsh Tikkiwal, Naman Kumar\nSupervisor: Dr. Kuntal Mukherjee\nTech Stack: Spring Boot 3.x, React 18, Tailwind CSS, PostgreSQL'
    }
  ];

  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [trashItems, setTrashItems] = useState({ files: [], folders: [] });
  const [isTrashView, setIsTrashView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
  const [activeItemMenu, setActiveItemMenu] = useState(null);

  // Storage Stats (Default 500MB per SRS)
  const [storageStats, setStorageStats] = useState({
    usedBytes: 8325393,
    quotaBytes: 524288000, // 500 MB
    usedPercentage: 2,
    fileCount: 4,
    folderCount: 3
  });

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
      console.warn('API fetch warning, using local state fallback if needed:', err);
      // If backend is booting, provide smooth UX without crashing
    } finally {
      setLoading(false);
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
      return { success: true, file: res.data };
    } catch (err) {
      console.warn('Backend upload offline, storing in local session state:', err);
      // Local fallback for GitHub Pages demo visitors
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
      setFiles(prev => [localFile, ...prev]);
      setStorageStats(prev => ({
        ...prev,
        usedBytes: prev.usedBytes + file.size,
        usedPercentage: Math.min(100, Math.round(((prev.usedBytes + file.size) / prev.quotaBytes) * 100)),
        fileCount: prev.fileCount + 1
      }));
      return { success: true, file: localFile };
    }
  };

  // Create new folder
  const createFolder = async (name) => {
    try {
      const res = await api.post('/folders', {
        name,
        parentId: currentFolder?.id || null
      });
      await fetchContents(currentFolder?.id || null);
      return { success: true, folder: res.data };
    } catch (err) {
      console.warn('Backend offline, creating local folder:', err);
      const newFolder = {
        id: Date.now(),
        name,
        parentId: currentFolder?.id || null,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      setFolders(prev => [...prev, newFolder]);
      setStorageStats(prev => ({ ...prev, folderCount: prev.folderCount + 1 }));
      return { success: true, folder: newFolder };
    }
  };

  // Rename file or folder
  const renameItem = async (id, type, newName) => {
    try {
      const endpoint = type === 'folder' ? `/folders/${id}/rename` : `/files/${id}/rename`;
      await api.put(endpoint, { newName });
      await fetchContents(currentFolder?.id || null);
      return { success: true };
    } catch (err) {
      if (type === 'folder') {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      }
      return { success: true };
    }
  };

  // Soft delete (move to trash)
  const moveToTrash = async (id, type) => {
    try {
      const endpoint = type === 'folder' ? `/folders/${id}` : `/files/${id}`;
      await api.delete(endpoint);
      await fetchContents(currentFolder?.id || null);
      return { success: true };
    } catch (err) {
      if (type === 'folder') {
        const target = folders.find(f => f.id === id);
        if (target) {
          setFolders(prev => prev.filter(f => f.id !== id));
          setTrashItems(prev => ({ ...prev, folders: [...prev.folders, { ...target, isDeleted: true }] }));
        }
      } else {
        const target = files.find(f => f.id === id);
        if (target) {
          setFiles(prev => prev.filter(f => f.id !== id));
          setTrashItems(prev => ({ ...prev, files: [...prev.files, { ...target, isDeleted: true }] }));
        }
      }
      return { success: true };
    }
  };

  // Restore from trash
  const restoreFromTrash = async (id, type) => {
    try {
      const endpoint = type === 'folder' ? `/folders/${id}/restore` : `/files/${id}/restore`;
      await api.post(endpoint);
      await fetchContents();
      return { success: true };
    } catch (err) {
      if (type === 'folder') {
        const target = trashItems.folders.find(f => f.id === id);
        if (target) {
          setTrashItems(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== id) }));
          setFolders(prev => [...prev, { ...target, isDeleted: false }]);
        }
      } else {
        const target = trashItems.files.find(f => f.id === id);
        if (target) {
          setTrashItems(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
          setFiles(prev => [...prev, { ...target, isDeleted: false }]);
        }
      }
      return { success: true };
    }
  };

  // Permanent Delete
  const permanentDelete = async (id, type) => {
    try {
      const endpoint = type === 'folder' ? `/folders/${id}/permanent` : `/files/${id}/permanent`;
      await api.delete(endpoint);
      await fetchContents();
      return { success: true };
    } catch (err) {
      if (type === 'folder') {
        setTrashItems(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== id) }));
      } else {
        setTrashItems(prev => ({ ...prev, files: prev.files.filter(f => f.id !== id) }));
      }
      return { success: true };
    }
  };

  // Move item to another folder
  const moveItem = async (id, type, targetFolderId) => {
    try {
      const endpoint = type === 'folder' ? `/folders/${id}/move` : `/files/${id}/move`;
      await api.put(endpoint, { targetFolderId });
      await fetchContents(currentFolder?.id || null);
      return { success: true };
    } catch (err) {
      if (type === 'folder') {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, parentId: targetFolderId } : f));
      } else {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, folderId: targetFolderId } : f));
      }
      return { success: true };
    }
  };

  // Filtered files & folders
  const filteredFiles = files.filter(file => {
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

  const filteredFolders = folders.filter(folder =>
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
      loading,
      error,
      searchQuery,
      setSearchQuery,
      fileTypeFilter,
      setFileTypeFilter,
      viewMode,
      setViewMode,
      sortBy,
      setSortBy,
      storageStats,
      navigateToFolder,
      fetchContents,
      uploadFile,
      createFolder,
      renameItem,
      moveToTrash,
      restoreFromTrash,
      permanentDelete,
      moveItem,
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
      activeItemMenu,
      setActiveItemMenu
    }}>
      {children}
    </DriveContext.Provider>
  );
};

export const useDrive = () => useContext(DriveContext);
