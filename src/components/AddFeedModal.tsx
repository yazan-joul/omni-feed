'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  FileCode,
  Share2,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/config/default-sources';
import { FeedSource, ContentPlatform } from '@/lib/types';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: FeedSource) => void;
  onImportSources?: (sources: FeedSource[]) => void;
}

export function AddFeedModal({ isOpen, onClose, onAddSource, onImportSources }: AddFeedModalProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<ContentPlatform>('rss');
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    title?: string;
    description?: string;
    channelId?: string;
    url?: string;
    platform?: ContentPlatform;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const validateUrl = async (inputUrl: string): Promise<any> => {
    const res = await fetch('/api/validate-feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: inputUrl.trim() }),
    });
    return await res.json();
  };

  const handleValidate = async () => {
    if (!url.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const data = await validateUrl(url);

      if (data.success) {
        setValidationResult({
          valid: true,
          title: data.title,
          description: data.description,
          channelId: data.channelId,
          url: data.url,
          platform: data.platform,
        });
        if (data.url) setUrl(data.url);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);

    try {
      // 1. Mandatory Validation Step before adding
      let currentValidation = validationResult;
      if (!currentValidation?.valid || currentValidation.url !== url.trim()) {
        const data = await validateUrl(url);
        if (!data.success) {
          setValidationResult({
            valid: false,
            error: data.error || 'Could not validate this stream source.',
          });
          setIsSubmitting(false);
          return;
        }
        currentValidation = {
          valid: true,
          title: data.title,
          description: data.description,
          channelId: data.channelId,
          url: data.url || url.trim(),
          platform: data.platform || platform,
        };
      }

      const finalUrl = currentValidation.url || url.trim();
      const finalPlatform = currentValidation.platform || platform;
      const sourceName = name.trim() || currentValidation.title || 'Custom Stream';

      const newSource: FeedSource = {
        id: `custom-${Date.now()}`,
        name: sourceName,
        platform: finalPlatform,
        url: finalUrl,
        channelId: currentValidation.channelId,
        description: currentValidation.description || `Custom stream from ${finalUrl}`,
        enabled: true,
        isCustom: true,
      };

      onAddSource(newSource);
      onClose();
      setUrl('');
      setName('');
      setValidationResult(null);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        error: err.message || 'Error adding feed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImportStatus(`Imported ${data.count} feeds from OPML!`);
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1200);
      } else {
        setImportStatus(`Import failed: ${data.error || 'Invalid structure'}`);
      }
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setPresetExample = (exampleUrl: string, detectedPlatform: ContentPlatform, defaultTitle: string) => {
    setUrl(exampleUrl);
    setPlatform(detectedPlatform);
    setName(defaultTitle);
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
              <h2 className="text-lg font-bold text-slate-100">Add Stream or Import</h2>
              <p className="text-xs text-slate-400">Add Reddit, YouTube, X, Instagram, RSS, or bulk OPML</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Bulk OPML Import Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/40 to-slate-900 border border-violet-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200">Massive OPML Import</p>
              <p className="text-[11px] text-slate-400 truncate">Import dozens of feeds from .opml or .xml</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".opml,.xml,text/xml"
            onChange={handleOpmlUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 flex items-center gap-1.5 flex-shrink-0 transition-all disabled:opacity-50"
          >
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>Upload OPML</span>
          </button>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feed URL / Handle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Stream Link or Handle</label>
              <span className="text-[11px] text-violet-400 font-medium">Auto-validated on add</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                placeholder="e.g. r/technology, @OpenAI, instagram.com/natgeo, or RSS"
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  if (val.includes('youtube.com') || val.includes('youtu.be')) setPlatform('youtube');
                  else if (val.includes('x.com') || val.includes('twitter.com') || val.startsWith('@')) setPlatform('twitter');
                  else if (val.startsWith('r/') || val.includes('reddit.com')) setPlatform('reddit');
                  else if (val.includes('instagram.com')) setPlatform('brightdata');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating || isSubmitting || !url.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Validate'}
              </button>
            </div>

            {/* Quick Format Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-medium mr-1">Examples:</span>
              <button
                type="button"
                onClick={() => setPresetExample('r/LocalLLaMA', 'reddit', 'r/LocalLLaMA')}
                className="px-2 py-0.5 rounded-lg bg-orange-950/40 hover:bg-orange-900/50 border border-orange-500/30 text-orange-300 text-[10px] transition-all"
              >
                🟠 r/LocalLLaMA
              </button>
              <button
                type="button"
                onClick={() => setPresetExample('https://www.instagram.com/natgeo/', 'brightdata', 'National Geographic')}
                className="px-2 py-0.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/30 text-pink-300 text-[10px] transition-all"
              >
                🟣 instagram.com/natgeo
              </button>
              <button
                type="button"
                onClick={() => setPresetExample('@realDonaldTrump', 'twitter', 'Donald J. Trump')}
                className="px-2 py-0.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-300 text-[10px] transition-all"
              >
                ⚪ @realDonaldTrump
              </button>
              <button
                type="button"
                onClick={() => setPresetExample('https://www.youtube.com/@Fireship', 'youtube', 'Fireship')}
                className="px-2 py-0.5 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-[10px] transition-all"
              >
                🔴 @Fireship
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
                  {validationResult.valid ? 'Stream verified successfully!' : 'Validation Note'}
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
            <label className="text-xs font-semibold text-slate-300">Display Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. LocalLLaMA Discussions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Platform Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="reddit">Reddit Subreddit (r/...)</option>
              <option value="twitter">X / Twitter (@...)</option>
              <option value="facebook">Facebook Page</option>
              <option value="instagram">Instagram Profile</option>
              <option value="youtube">YouTube Channel</option>
              <option value="rss">RSS / Atom / Blog</option>
              <option value="substack">Substack</option>
            </select>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating & Adding...</span>
                </>
              ) : (
                <span>Add Stream</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
