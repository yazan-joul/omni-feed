'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Rss,
  Youtube,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/config/default-sources';
import { FeedSource, ContentPlatform } from '@/lib/types';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: FeedSource) => void;
}

export function AddFeedModal({ isOpen, onClose, onAddSource }: AddFeedModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Tech');
  const [platform, setPlatform] = useState<ContentPlatform>('rss');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    title?: string;
    description?: string;
    channelId?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!url.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/validate-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setValidationResult({
          valid: true,
          title: data.title,
          description: data.description,
          channelId: data.channelId,
        });
        if (data.title && !name) setName(data.title);
        if (data.platform) setPlatform(data.platform);
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Failed to parse stream.',
        });
      }
    } catch {
      setValidationResult({
        valid: false,
        error: 'Network error validating feed URL.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const sourceName = name.trim() || validationResult?.title || 'Custom Stream';
    const newSource: FeedSource = {
      id: `custom-${Date.now()}`,
      name: sourceName,
      category: (category as any) || 'Tech',
      platform,
      url: url.trim(),
      channelId: validationResult?.channelId,
      description: validationResult?.description || `Custom stream from ${url}`,
      enabled: true,
      isCustom: true,
    };

    onAddSource(newSource);
    onClose();
    // Reset fields
    setUrl('');
    setName('');
    setValidationResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-panel bg-slate-900 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Add Custom Feed</h2>
              <p className="text-xs text-slate-400">Add any RSS, Substack, or YouTube channel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feed URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Feed or Channel URL</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                placeholder="https://... (RSS feed or YouTube channel)"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value.includes('youtube.com')) setPlatform('youtube');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Validate'}
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                validationResult.valid
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">
                  {validationResult.valid ? 'Feed detected successfully!' : 'Validation Note'}
                </p>
                <p className="text-[11px] opacity-80">
                  {validationResult.valid
                    ? validationResult.description || `Title: ${validationResult.title}`
                    : validationResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Feed Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Custom Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. My Favorite Tech Blog"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Category & Platform Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Type</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="rss">RSS / Atom</option>
                <option value="youtube">YouTube</option>
                <option value="substack">Substack</option>
              </select>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
            >
              Add Stream
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
