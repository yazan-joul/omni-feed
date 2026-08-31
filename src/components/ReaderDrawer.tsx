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
  Headphones,
  Play,
} from 'lucide-react';
import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface ReaderDrawerProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: FeedItem) => void;
  onPlayPodcast?: (item: FeedItem) => void;
}

export function ReaderDrawer({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
  onPlayPodcast,
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

  const isPodcast = item.mediaType === 'podcast';

  const getImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  };


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

  const formattedDuration =
    item.durationSeconds !== undefined && item.durationSeconds !== null
      ? (() => {
          const hours = Math.floor(item.durationSeconds / 3600);
          const minutes = Math.floor((item.durationSeconds % 3600) / 60);
          const seconds = item.durationSeconds % 60;

          if (hours > 0) {
            return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
          }

          return `${minutes}:${String(seconds).padStart(2, '0')}`;
        })()
      : undefined;

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
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                isPodcast
                  ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20'
              }`}
            >
              {isPodcast ? <Headphones className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
              {isPodcast ? 'Podcast Episode' : 'Reader Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size toggler */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-white/10 text-xs text-slate-300">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded-md ${fontSize === 'normal' ? 'bg-cyan-600 text-white font-bold' : ''}`}
                title="Normal text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded-md ${fontSize === 'large' ? 'bg-cyan-600 text-white font-bold' : ''}`}
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
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-cyan-400' : ''}`} />
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
          {/* Cover Photo or Podcast Hero */}
          {item.thumbnailUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 group">
              <img src={getImageUrl(item.thumbnailUrl)} alt={item.title} className="w-full h-full object-cover" />
              {isPodcast && onPlayPodcast && (
                <div
                  onClick={() => onPlayPodcast(item)}
                  className="absolute inset-0 bg-black/40 hover:bg-black/30 flex items-center justify-center cursor-pointer transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-600/90 hover:bg-emerald-500 hover:scale-110 text-white flex items-center justify-center shadow-xl shadow-emerald-950/50 transition-all">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          ) : isPodcast ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-cyan-900/20 flex flex-col items-center justify-center p-6 text-center">
              {onPlayPodcast ? (
                <button
                  onClick={() => onPlayPodcast(item)}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-600/20 text-emerald-300 shadow-xl hover:scale-110 hover:bg-emerald-600/30 transition-all cursor-pointer mb-3"
                >
                  <Play className="w-7 h-7 fill-emerald-300 ml-0.5" />
                </button>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-600/20 text-emerald-300 shadow-xl mb-3">
                  <Headphones className="w-7 h-7" />
                </div>
              )}
              <span className="text-xs font-semibold text-emerald-400">{item.sourceName}</span>
            </div>
          ) : null}

          {/* Podcast Play Banner if audio is available */}
          {isPodcast && onPlayPodcast && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-600/30">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">Listen to Episode</p>
                  <p className="text-xs text-emerald-400">
                    {formattedDuration ? `Runtime: ${formattedDuration}` : 'Full audio track available'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onPlayPodcast(item)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Play in Player
              </button>
            </div>
          )}

          {/* Article / Podcast Header */}
          <div className="space-y-3 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`font-semibold ${isPodcast ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {item.sourceName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formattedDate}
              </span>
              {isPodcast && formattedDuration && (
                <>
                  <span>•</span>
                  <span>{formattedDuration}</span>
                </>
              )}
              {!isPodcast && item.metrics?.readTime && (
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
                  src={getImageUrl(item.author.avatarUrl)}
                  alt={item.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isPodcast ? 'bg-emerald-600/20 text-emerald-400' : 'bg-cyan-600/20 text-cyan-400'
                  }`}
                >
                  {item.author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-200">{item.author.name}</p>
                <p className="text-xs text-slate-400">
                  {isPodcast ? 'Host / Producer' : 'Author / Contributor'}
                </p>
              </div>
            </div>
          </div>

          {/* Article / Show Notes Content */}
          <div className={`text-slate-300 space-y-4 ${fontSizeClasses}`}>
            {item.content ? (
              item.content.includes('<') ? (
                <div
                  className="prose prose-invert max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              ) : (
                <div className="text-slate-200 whitespace-pre-line leading-relaxed">
                  {item.content}
                </div>
              )
            ) : item.summary ? (
              <p className="whitespace-pre-line leading-relaxed text-slate-200">{item.summary}</p>
            ) : (
              <p className="italic text-slate-400">
                {isPodcast
                  ? 'No show notes provided for this episode. Click below to view on the original platform.'
                  : 'Full article body is protected or preview only. Click below to view on the original website.'}
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
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 shadow-lg transition-all ${
                isPodcast
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/20'
              }`}
            >
              {isPodcast ? `Open Episode on ${item.sourceName}` : `Read Full Post on ${item.sourceName}`}{' '}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
