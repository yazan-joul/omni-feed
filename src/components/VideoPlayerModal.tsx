'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Bookmark,
  Share2,
  Check,
  Youtube,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FeedItem } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface VideoPlayerModalProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: FeedItem) => void;
}

export function VideoPlayerModal({
  item,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: VideoPlayerModalProps) {
  const [copied, setCopied] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col z-10 bg-slate-900">
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center flex-shrink-0">
              <Youtube className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-100 text-sm truncate">{item.title}</h2>
              <p className="text-xs text-slate-400 truncate">{item.author.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
            <button
              onClick={handleShare}
              title="Copy Link"
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in YouTube"
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-white/10 transition-all ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full bg-black">
          {item.videoId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={item.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <p>Direct video stream unavailable for embed.</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium flex items-center gap-1.5"
              >
                <Youtube className="w-4 h-4" /> Watch on YouTube
              </a>
            </div>
          )}
        </div>

        {/* Video Details & Meta Footer */}
        <div className="p-6 overflow-y-auto max-h-60 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Published {formattedDate}
              </span>
              {item.metrics?.views && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {item.metrics.views} views
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {item.content && (
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-white/5 space-y-2">
              <p className={showFullDescription ? '' : 'line-clamp-3 whitespace-pre-line'}>
                {item.content}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 mt-1"
              >
                {showFullDescription ? (
                  <>Show less <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Read full description <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
