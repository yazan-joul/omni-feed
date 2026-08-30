'use client';

import React from 'react';
import {
  X,
  SlidersHorizontal,
  Youtube,
  Rss,
  Trash2,
  Check,
  RotateCcw,
  Plus,
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
}

export function SourcesModal({
  isOpen,
  onClose,
  sources,
  onToggleSource,
  onRemoveSource,
  onResetSources,
  onOpenAddModal,
}: SourcesModalProps) {
  if (!isOpen) return null;

  const enabledCount = sources.filter((s) => s.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] glass-panel bg-slate-900 rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Manage Feed Sources</h2>
              <p className="text-xs text-slate-400">
                {enabledCount} of {sources.length} streams enabled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetSources}
              title="Reset to default feeds"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {sources.map((source) => {
            const isYt = source.platform === 'youtube';
            return (
              <div
                key={source.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  source.enabled
                    ? 'bg-slate-950/60 border-white/10'
                    : 'bg-slate-950/20 border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isYt ? 'bg-red-600/20 text-red-500' : 'bg-violet-600/20 text-violet-400'
                    }`}
                  >
                    {isYt ? <Youtube className="w-4 h-4" /> : <Rss className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100 truncate">
                        {source.name}
                      </span>
                      {source.isCustom && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {source.description || source.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => onToggleSource(source.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      source.enabled
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 hover:bg-violet-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {source.enabled ? 'Active' : 'Disabled'}
                  </button>

                  {/* Delete custom feed */}
                  {source.isCustom && (
                    <button
                      onClick={() => onRemoveSource(source.id)}
                      title="Delete Custom Feed"
                      className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Stream
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
