'use client';

import React, { useEffect, useRef } from 'react';
import {
  Layers,
  Radio,
  Bookmark,
  Plus,
  SlidersHorizontal,
  FolderTree,
  X,
  LogIn,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'feed' | 'bookmarks';
  setActiveTab: (tab: 'feed' | 'bookmarks') => void;
  bookmarkCount: number;
  sourcesCount: number | null;
  onOpenAddModal: () => void;
  onOpenSourcesModal: () => void;
}

export function NavDrawer({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  bookmarkCount,
  sourcesCount,
  onOpenAddModal,
  onOpenSourcesModal,
}: NavDrawerProps) {
  const { user, loading, signIn, signOut } = useAuth();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTab = (tab: 'feed' | 'bookmarks') => {
    setActiveTab(tab);
    onClose();
  };

  const handleOpenAddFeed = () => {
    onOpenAddModal();
    onClose();
  };

  const handleOpenSources = () => {
    onOpenSourcesModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-start">
      {/* Backdrop overlay */}
      <div
        data-testid="drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer */}
      <aside
        className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-slate-900/95 border-r border-white/10 shadow-2xl flex flex-col z-10 backdrop-blur-md animate-in slide-in-from-left duration-250 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-600 to-emerald-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Layers className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  OmniFeed
                </span>
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-semibold uppercase text-cyan-400">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Aggregated Stream</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-6">
          {/* Section: Streams & Views */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Streams & Views
            </p>

            {/* Live Feed */}
            <button
              onClick={() => handleSelectTab('feed')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/40 font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${activeTab === 'feed' ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>Live Feed</span>
              </div>
              {sourcesCount !== null && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/5 text-slate-400">
                  {sourcesCount} streams
                </span>
              )}
            </button>

            {/* Saved Bookmarks */}
            <button
              onClick={() => handleSelectTab('bookmarks')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'bookmarks'
                  ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/40 font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className={`w-4 h-4 ${activeTab === 'bookmarks' ? 'text-cyan-400 fill-cyan-400/20' : 'text-slate-400'}`} />
                <span>Saved</span>
              </div>
              {bookmarkCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 font-semibold">
                  {bookmarkCount}
                </span>
              )}
            </button>
          </div>

          {/* Section: Manage & Feeds */}
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Manage Feeds
            </p>

            {/* Add Custom Feed */}
            <button
              onClick={handleOpenAddFeed}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-cyan-600/10 hover:text-cyan-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Add Custom Feed</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Manage Sources */}
            <button
              onClick={handleOpenSources}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                <span>Manage Sources</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Section: Future Roadmap Placeholder */}
          <div className="space-y-1.5 pt-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Roadmap
            </p>

            <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-950/20 border border-white/5 opacity-80 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <FolderTree className="w-4 h-4 text-slate-500" />
                <span>Collections & Series</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Footer: User Profile & Auth */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60">
          {!loading && user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-300 text-xs font-bold border border-white/10 shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                title="Sign out"
                className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : !loading ? (
            <button
              onClick={() => {
                signIn();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
