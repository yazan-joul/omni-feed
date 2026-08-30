'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Share2,
  Check,
  Clock,
  Type,
  BookOpen,
  Rss,
} from 'lucide-react';
import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ReaderDrawerProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: FeedItem) => void;
}

export function ReaderDrawer({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: ReaderDrawerProps) {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  const fontSizeClasses = {
    normal: 'text-base leading-relaxed',
    large: 'text-lg leading-loose',
    xlarge: 'text-xl leading-loose',
  }[fontSize];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-2xl h-full glass-panel bg-slate-900 border-l border-white/10 flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" /> Reader Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size toggler */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-white/10 text-xs text-slate-300">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-md ${fontSize === 'normal' ? 'bg-violet-600 text-white font-bold' : ''}`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-md ${fontSize === 'large' ? 'bg-violet-600 text-white font-bold' : ''}`}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(item)}
              title={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
              className={`p-2 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-violet-600/20 border-violet-500/40 text-violet-400'
                  : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-violet-400' : ''}`} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title="Copy Link"
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Original Link */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in source publication"
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
          {/* Cover Photo */}
          {item.thumbnailUrl && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10">
              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Article Header */}
          <div className="space-y-3 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-violet-400">{item.sourceName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formattedDate}
              </span>
              {item.metrics?.readTime && (
                <>
                  <span>•</span>
                  <span>{item.metrics.readTime}</span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
              {item.title}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-3 pt-2">
              {item.author.avatarUrl ? (
                <img
                  src={item.author.avatarUrl}
                  alt={item.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  {item.author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-200">{item.author.name}</p>
                <p className="text-xs text-slate-400">Author / Contributor</p>
              </div>
            </div>
          </div>

          {/* Article Content / Excerpt */}
          <div className={`text-slate-300 space-y-4 ${fontSizeClasses}`}>
            {item.content ? (
              <div
                className="prose prose-invert max-w-none space-y-4"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            ) : item.summary ? (
              <p>{item.summary}</p>
            ) : (
              <p className="italic text-slate-400">
                Full article body is protected or preview only. Click below to view on the original website.
              </p>
            )}
          </div>

          {/* Footer CTA */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Source: <span className="text-slate-200">{item.sourceName}</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all"
            >
              Read Full Post on {item.sourceName} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
