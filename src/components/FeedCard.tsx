'use client';

import React, { useState } from 'react';
import {
  Youtube,
  Rss,
  Bookmark,
  ExternalLink,
  Play,
  Clock,
  Eye,
  Share2,
  Check,
  BookOpen,
  CheckCircle2,
  Headphones,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedItem } from '@/lib/types';

interface FeedCardProps {
  item: FeedItem;
  viewMode: 'grid' | 'list';
  isBookmarked: boolean;
  isRead: boolean;
  onToggleBookmark: (item: FeedItem) => void;
  onToggleRead?: (id: string) => void;
  onOpenVideo: (item: FeedItem) => void;
  onOpenReader: (item: FeedItem) => void;
  onOpenPodcast: (item: FeedItem) => void;
}

export function FeedCard({
  item,
  viewMode,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onToggleRead,
  onOpenVideo,
  onOpenReader,
  onOpenPodcast,
}: FeedCardProps) {
  const [copied, setCopied] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [item.id, item.thumbnailUrl]);

  const formattedDate = (() => {
    try {
      return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  })();

  const handleCardClick = () => {
    if (item.mediaType === 'video' && item.videoId) {
      onOpenVideo(item);
      return;
    }

    onOpenReader(item);
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.mediaType === 'podcast') {
      onOpenPodcast(item);
      return;
    }

    if (item.mediaType === 'video' && item.videoId) {
      onOpenVideo(item);
      return;
    }

    onOpenReader(item);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(item);
  };

  const handleToggleRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleRead?.(item.id);
  };

  const isVideo = item.mediaType === 'video';
  const isPodcast = item.mediaType === 'podcast';
  
  const getImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const shouldUsePodcastFallback = isPodcast && (!item.thumbnailUrl || imageFailed);
  const shouldRenderThumbnail = Boolean(item.thumbnailUrl) && !imageFailed;
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

  if (viewMode === 'list') {
    return (
      <article
        onClick={handleCardClick}
        className={`group glass-panel rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all ${
          isRead ? 'opacity-40 grayscale-[50%] bg-slate-900/30' : 'opacity-100'
        }`}
      >
        {/* Left: Thumbnail & Title */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {(item.thumbnailUrl || isPodcast) && (
            <div
              onClick={handleMediaClick}
              className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-white/5 cursor-pointer group/thumb"
            >
              {shouldRenderThumbnail ? (
                <>
                  <img
                    src={getImageUrl(item.thumbnailUrl)}
                    alt={item.title}
                    onError={() => setImageFailed(true)}
                    className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-cyan-500/10" />
              )}

              {isVideo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/thumb:bg-black/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {isPodcast && !isVideo && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {shouldUsePodcastFallback && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-600/20 text-emerald-300 backdrop-blur-sm group-hover/thumb:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-emerald-300 ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header info */}
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md ${
                  item.platform === 'instagram'
                    ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
                    : isVideo
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : isPodcast
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                }`}
              >
                {item.platform === 'instagram' ? (
                  <Instagram className="w-3 h-3 text-pink-400" />
                ) : isVideo ? (
                  <Youtube className="w-3 h-3 text-red-500" />
                ) : isPodcast ? (
                  <Headphones className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Rss className="w-3 h-3 text-cyan-400" />
                )}
                {item.sourceName || item.author.name}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formattedDate}
              </span>
              {isPodcast && formattedDuration && (
                <span className="text-slate-400 hidden sm:inline">{formattedDuration}</span>
              )}
              {!isPodcast && item.metrics?.readTime && (
                <span className="text-slate-400 hidden sm:inline">{item.metrics.readTime}</span>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-semibold transition-colors line-clamp-1 text-sm sm:text-base ${
              isRead ? 'text-slate-400 line-through' : 'text-slate-100 group-hover:text-cyan-300'
            }`}>
              {item.title}
            </h3>

            {/* Snippet */}
            {item.summary && (
              <p className="text-xs text-slate-400 line-clamp-1 hidden md:block">
                {item.summary}
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 self-end sm:self-center">
          {onToggleRead && (
            <button
              onClick={handleToggleRead}
              title={isRead ? 'Mark as Unread' : 'Mark as Read'}
              className={`p-2 rounded-xl border transition-all ${
                isRead
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isRead ? 'fill-emerald-400/20' : ''}`} />
            </button>
          )}
          <button
            onClick={handleBookmarkClick}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            className={`p-2 rounded-xl border transition-all ${
              isBookmarked
                ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-cyan-400' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            title="Copy Link"
            className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open original page"
            className="p-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </article>
    );
  }

  // --- Grid View Card ---
  return (
    <article
      onClick={handleCardClick}
      className={`group glass-panel rounded-2xl overflow-hidden flex flex-col cursor-pointer border border-white/10 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 ${
        isRead ? 'opacity-40 grayscale-[50%]' : 'opacity-100'
      }`}
    >
      {/* Media Image Header */}
      {(item.thumbnailUrl || isPodcast) && (
        <div
          onClick={handleMediaClick}
          className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
        >
          {shouldRenderThumbnail ? (
            <>
              <img
                src={getImageUrl(item.thumbnailUrl)}
                alt={item.title}
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 media-overlay pointer-events-none" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-950 to-cyan-500/10" />
          )}

          {/* Video / Podcast Play Button Overlay */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          )}

          {isPodcast && !isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 group-hover:bg-emerald-500 transition-all duration-300">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          )}

          {shouldUsePodcastFallback && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-600/20 text-emerald-300 shadow-lg shadow-emerald-900/20 backdrop-blur-sm group-hover:scale-110 group-hover:bg-emerald-600/30 transition-all duration-300">
                <Play className="w-7 h-7 fill-emerald-300 ml-0.5" />
              </div>
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg text-xs backdrop-blur-md ${
                item.platform === 'instagram' ? 'bg-pink-600/90 text-white shadow-md shadow-pink-600/30' :
                item.platform === 'facebook' ? 'bg-blue-600/90 text-white shadow-md shadow-blue-600/30' :
                item.platform === 'twitter' ? 'bg-sky-500/90 text-white shadow-md shadow-sky-500/30' :
                item.platform === 'reddit' ? 'bg-orange-600/90 text-white shadow-md shadow-orange-600/30' :
                isVideo ? 'bg-red-600/90 text-white shadow-md shadow-red-600/30' :
                isPodcast ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-600/30' :
                'bg-cyan-600/90 text-white shadow-md shadow-cyan-600/30'
              }`}
            >
              {item.platform === 'instagram' ? <Instagram className="w-3.5 h-3.5" /> :
               item.platform === 'facebook' ? <Facebook className="w-3.5 h-3.5" /> :
               item.platform === 'twitter' ? <Twitter className="w-3.5 h-3.5" /> :
               item.platform === 'reddit' ? <MessageCircle className="w-3.5 h-3.5" /> :
               isVideo ? <Youtube className="w-3.5 h-3.5" /> :
               isPodcast ? <Headphones className="w-3.5 h-3.5" /> :
               <BookOpen className="w-3.5 h-3.5" />}
              {item.platform === 'instagram' ? 'Instagram' :
               item.platform === 'facebook' ? 'Facebook' :
               item.platform === 'twitter' ? 'X (Twitter)' :
               item.platform === 'reddit' ? 'Reddit' :
               isVideo ? 'Video' : isPodcast ? 'Podcast' : 'Article'}
            </span>
          </div>

          {/* Bottom stats inside media */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-slate-200 font-medium">
            <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
            {item.metrics?.views && (
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                {item.metrics.views} views
              </span>
            )}
            {isPodcast && formattedDuration && (
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                {formattedDuration}
              </span>
            )}
            {!isPodcast && item.metrics?.readTime && (
              <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md">
                {item.metrics.readTime}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Author / Source */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {item.author.avatarUrl ? (
                <img
                  src={getImageUrl(item.author.avatarUrl)}
                  alt={item.author.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                  {item.author.name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-medium text-slate-300 truncate">
                {item.sourceName || item.author.name}
              </span>
            </div>

            
          </div>

          {/* Title */}
          <h3 className={`font-semibold transition-colors line-clamp-2 text-base leading-snug ${
            isRead ? 'text-slate-400 line-through' : 'text-slate-100 group-hover:text-cyan-300'
          }`}>
            {item.title}
          </h3>

          {/* Summary */}
          {item.summary && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <button
            onClick={handleCardClick}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            {['instagram', 'facebook', 'twitter', 'reddit'].includes(item.platform) ? 'View Post' : isVideo ? 'Watch Video' : isPodcast ? 'Episode Details' : 'Read Article'} &rarr;
          </button>

          <div className="flex items-center gap-1.5">
            {onToggleRead && (
              <button
                onClick={handleToggleRead}
                title={isRead ? 'Mark as Unread' : 'Mark as Read'}
                className={`p-1.5 rounded-lg border transition-all ${
                  isRead
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isRead ? 'fill-emerald-400/20' : ''}`} />
              </button>
            )}
            <button
              onClick={handleBookmarkClick}
              title={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
              className={`p-1.5 rounded-lg border transition-all ${
                isBookmarked
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-800/60 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-cyan-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              title="Copy Link"
              className="p-1.5 rounded-lg bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Open in new tab"
              className="p-1.5 rounded-lg bg-slate-800/60 border border-white/5 text-slate-400 hover:text-white transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
