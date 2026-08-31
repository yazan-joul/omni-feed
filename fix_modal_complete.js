const fs = require('fs');

const path = 'src/components/AddFeedModal.tsx';
let old = fs.readFileSync(path, 'utf8');

const match1 = old.match(/(const handleFileChange = async[\s\S]*?)(?=\n\n  const handleSubmit = async)/);
const handleFileChangeCode = match1[1];

const match2 = old.match(/(const handleSubmit = async[\s\S]*?)(?=\n\n  return \()/);
const handleSubmitCode = match2[1];

const newContent = `'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Youtube,
  Radio,
  MessageSquare,
  Twitter,
  Instagram,
  Facebook
} from 'lucide-react';
import { FeedSource, ContentPlatform } from '@/lib/types';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: FeedSource) => void;
  onImportSources?: (sources: FeedSource[]) => void;
}

export function AddFeedModal({ isOpen, onClose, onAddSource, onImportSources }: AddFeedModalProps) {
  const [platform, setPlatform] = useState<ContentPlatform>('rss');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
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

  // Clear validation when url changes
  useEffect(() => {
    setValidationResult(null);
  }, [url, platform]);

  if (!isOpen) return null;

  const platforms = [
    { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" /> },
    { id: 'rss', label: 'Podcast / RSS', icon: <Radio className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" /> },
    { id: 'reddit', label: 'Reddit', icon: <MessageSquare className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors" /> },
    { id: 'twitter', label: 'X (Twitter)', icon: <Twitter className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" /> },
    { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" /> },
    { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" /> },
  ];

  const getPlaceholder = (p: string) => {
    switch (p) {
      case 'youtube': return 'Channel name, @handle, or URL';
      case 'rss': return 'Podcast name or RSS URL';
      case 'reddit': return 'e.g. r/technology or URL';
      case 'twitter': return 'e.g. @OpenAI or URL';
      case 'instagram': return 'e.g. @natgeo or URL';
      case 'facebook': return 'Page URL or ID';
      default: return 'Paste URL here...';
    }
  };

  const getHelperText = (p: string) => {
    switch (p) {
      case 'youtube': return 'Search by channel name, or paste a direct YouTube URL.';
      case 'rss': return 'Search by podcast name, or paste an RSS XML link directly.';
      case 'reddit': return 'Enter a subreddit name to stream its posts (e.g. r/news).';
      case 'twitter': return 'Enter an X/Twitter handle to stream their timeline.';
      case 'instagram': return 'Enter a public Instagram profile handle.';
      case 'facebook': return 'Enter a public Facebook page URL.';
      default: return '';
    }
  };

  const handleValidate = async () => {
    if (!url.trim()) return;
    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/validate-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform }),
      });
      const data = await res.json();
      setValidationResult(data);
      if (data.success && data.platform) {
        setPlatform(data.platform as ContentPlatform);
      }
    } catch (err) {
      setValidationResult({ valid: false, error: 'Validation request failed.' });
    } finally {
      setIsValidating(false);
    }
  };

  ${handleFileChangeCode}

  ${handleSubmitCode}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/30">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Add Stream</h2>
              <p className="text-sm text-slate-400">Discover and follow new content sources.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OPML Import (Top Right Action) */}
        <div className="absolute top-8 right-16">
          <input
            type="file"
            accept=".xml,.opml"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 text-slate-300 hover:text-white text-[11px] font-medium transition-all"
            title="Import feeds from an OPML file"
          >
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>OPML</span>
          </button>
        </div>

        {importStatus && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{importStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Platform Selector Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Source Type</label>
            <div className="grid grid-cols-3 gap-2">
              {platforms.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlatform(p.id as ContentPlatform);
                    setValidationResult(null);
                  }}
                  className={\`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all group \${
                    platform === p.id 
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-inner shadow-cyan-500/10' 
                      : 'bg-slate-900/50 border-white/5 hover:bg-slate-800/80 hover:border-white/10'
                  }\`}
                >
                  {p.icon}
                  <span className={\`text-[11px] font-medium \${platform === p.id ? 'text-cyan-100' : 'text-slate-400 group-hover:text-slate-300'}\`}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Feed URL / Handle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Source Link or Name</label>
              <span className="text-[10px] text-cyan-500 font-medium">Auto-validated</span>
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                placeholder={getPlaceholder(platform)}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-4 pr-24 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating || isSubmitting || !url.trim()}
                className="absolute right-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Validate'}
              </button>
            </div>
            
            {/* Helper Text */}
            <p className="text-[11px] text-slate-500 pt-1 px-1">
              {getHelperText(platform)}
            </p>
          </div>

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={\`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 \${
                validationResult.valid
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/20 border-red-500/30 text-red-300'
              }\`}
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
                <p className="text-[11px] opacity-90">
                  {validationResult.valid
                    ? validationResult.description || \`Title: \${validationResult.title}\`
                    : validationResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Feed Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Display Title (Optional)</label>
            <input
              type="text"
              placeholder={validationResult?.title ? \`e.g. \${validationResult.title}\` : 'Custom name for this feed'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-900/50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Source</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;

fs.writeFileSync(path, newContent);
console.log('Fixed modal');
