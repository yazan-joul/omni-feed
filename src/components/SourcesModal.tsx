'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  SlidersHorizontal,
  Youtube,
  Rss,
  Trash2,
  Check,
  RotateCcw,
  Plus,
  Headphones,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Upload,
  Download,
  Loader2,
  FileCode,
} from 'lucide-react';
import { FeedSource } from '@/lib/types';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: FeedSource[];
  onToggleSource: (id: string) => void;
  onRemoveSource: (id: string) => void;
  onResetSources: () => void;
  onOpenAddModal: () => void;
  onImportSources?: (imported: FeedSource[]) => void;
}

export function SourcesModal({
  isOpen,
  onClose,
  sources,
  onToggleSource,
  onRemoveSource,
  onResetSources,
  onOpenAddModal,
  onImportSources,
}: SourcesModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const enabledCount = sources.filter((s) => s.enabled).length;

  const getSourceBadgeInfo = (source: FeedSource) => {
    const platform = source.platform?.toLowerCase() || '';
    const url = source.url?.toLowerCase() || '';
    const id = source.id?.toLowerCase() || '';
    const isPodcast = id.startsWith('pod-') || url.includes('podcast') || url.includes('syntax') || url.includes('simplecast');

    if (platform === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return {
        Icon: Youtube,
        label: 'YouTube',
        badgeClass: 'bg-red-600/20 text-red-400 border border-red-500/30',
        iconBoxClass: 'bg-red-600/20 text-red-400 border border-red-500/20',
      };
    }
    if (isPodcast) {
      return {
        Icon: Headphones,
        label: 'Podcast',
        badgeClass: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
        iconBoxClass: 'bg-purple-600/20 text-purple-400 border border-purple-500/20',
      };
    }
    if (platform === 'instagram' || url.includes('instagram.com')) {
      return {
        Icon: Instagram,
        label: 'Instagram',
        badgeClass: 'bg-pink-600/20 text-pink-400 border border-pink-500/30',
        iconBoxClass: 'bg-pink-600/20 text-pink-400 border border-pink-500/20',
      };
    }
    if (platform === 'twitter' || url.includes('twitter.com') || url.includes('x.com') || (source.name.startsWith('@') && !url.includes('instagram'))) {
      return {
        Icon: Twitter,
        label: 'X (Twitter)',
        badgeClass: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
        iconBoxClass: 'bg-sky-500/20 text-sky-400 border border-sky-500/20',
      };
    }
    if (platform === 'reddit' || url.includes('reddit.com') || source.name.startsWith('r/')) {
      return {
        Icon: MessageCircle,
        label: 'Reddit',
        badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        iconBoxClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/20',
      };
    }
    if (platform === 'facebook' || url.includes('facebook.com')) {
      return {
        Icon: Facebook,
        label: 'Facebook',
        badgeClass: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
        iconBoxClass: 'bg-blue-600/20 text-blue-400 border border-blue-500/20',
      };
    }
    return {
      Icon: Rss,
      label: 'RSS Feed',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      iconBoxClass: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20',
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const xmlText = await file.text();
      const res = await fetch('/api/opml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: xmlText }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        onImportSources?.(data.sources);
        setImportStatus(`Successfully imported ${data.count} streams from OPML!`);
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus(`Import failed: ${data.error || 'Invalid OPML structure'}`);
      }
    } catch (err: any) {
      setImportStatus(`Error reading file: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportOPML = () => {
    window.location.href = `/api/opml?sources=${encodeURIComponent(JSON.stringify(sources))}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] glass-panel bg-slate-900 rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Manage Feed Streams</h2>
              <p className="text-xs text-slate-400">
                {enabledCount} of {sources.length} streams active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Massive OPML Import Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".opml,.xml,text/xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              title="Bulk import subscriptions from OPML file"
              className="p-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Import OPML</span>
            </button>

            {/* OPML Export */}
            <button
              onClick={handleExportOPML}
              title="Export subscriptions to OPML file"
              className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Reset */}
            <button
              onClick={onResetSources}
              title="Reset to default curated streams"
              className="p-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {importStatus && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-fadeIn">
            <FileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {sources.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-3">
              <p>All streams have been removed.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onResetSources}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-600/20"
                >
                  Restore Default Streams
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 border border-white/10 text-xs font-medium"
                >
                  Import from OPML
                </button>
              </div>
            </div>
          ) : (
            sources.map((source) => {
              const { Icon, label, badgeClass, iconBoxClass } = getSourceBadgeInfo(source);

              return (
                <div
                  key={source.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    source.enabled
                      ? 'bg-slate-950/60 border-white/10'
                      : 'bg-slate-950/20 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBoxClass}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {source.name}
                        </span>
                        {source.isCustom ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Custom
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
                            {label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {source.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => onToggleSource(source.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        source.enabled
                          ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {source.enabled ? 'Active' : 'Disabled'}
                    </button>

                    {/* Delete Stream Button */}
                    <button
                      onClick={() => onRemoveSource(source.id)}
                      title="Remove stream from your dashboard"
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Custom Stream
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
