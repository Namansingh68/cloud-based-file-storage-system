import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DriveProvider } from './context/DriveContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ExplorerView } from './components/explorer/ExplorerView';
import { AuthModal } from './components/auth/AuthModal';
import { SharedView } from './components/share/SharedView';

function AppContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [sharedToken, setSharedToken] = useState(null);

  useEffect(() => {
    // Check path or query param for shared link
    const path = window.location.pathname;
    if (path.startsWith('/shared/')) {
      const token = path.replace('/shared/', '');
      if (token) setSharedToken(token);
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setSharedToken(params.get('token'));
    }
  }, []);

  if (sharedToken) {
    return <SharedView token={sharedToken} onBack={() => {
      window.history.pushState({}, '', '/');
      setSharedToken(null);
    }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          onUploadClick={() => setIsUploadModalOpen(true)}
          onNewFolderClick={() => setIsNewFolderOpen(true)}
        />

        {/* Dynamic Drive Explorer Area */}
        <ExplorerView />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DriveProvider>
        <AppContent />
      </DriveProvider>
    </AuthProvider>
  );
}
