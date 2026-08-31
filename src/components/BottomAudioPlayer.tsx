'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Pause, Play, Radio, Volume2, X } from 'lucide-react';
import { FeedItem } from '@/lib/types';

interface BottomAudioPlayerProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${mins}:${secs}`;
};

export function BottomAudioPlayer({ item, isOpen, onClose }: BottomAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [hasError, setHasError] = useState(false);

  const getImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    return url;
  };


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!isOpen || !item) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setHasError(false);
      return;
    }

    if (!item.audioUrl) {
      setHasError(true);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    if (audio) {
      audio.src = item.audioUrl;
      audio.load();
      audio.volume = volume;
    }
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    setIsPlaying(false);
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleTogglePlay = async () => {
    const audio = audioRef.current;

    if (!item.audioUrl) {
      setHasError(true);
      return;
    }

    if (!audio) {
      setHasError(true);
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      await audio.play();
      setIsPlaying(true);
      setHasError(false);
    } catch (error) {
      console.warn('[BottomAudioPlayer] Playback error:', error);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = nextValue;
    setCurrentTime(nextValue);
  };

  const progressValue = duration > 0 ? (currentTime / duration) * 100 : 0;
  const sourceLabel = item.sourceName || item.author.name || 'Podcast';

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="mx-auto max-w-7xl">
        <div className="glass-panel relative w-full overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-slate-900/80 to-emerald-500/10" />

          <div className="relative flex max-w-full flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
            <div className="flex min-w-0 items-center gap-3">
              {item.thumbnailUrl ? (
                <img
                  src={getImageUrl(item.thumbnailUrl)}
                  alt={item.title}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover border border-white/10 bg-slate-950"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-600/10 text-cyan-300">
                  <Radio className="h-6 w-6" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="truncate text-xs text-slate-400">{sourceLabel}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  disabled={!item.audioUrl || hasError}
                  aria-label={isPlaying ? 'Pause podcast' : 'Play podcast'}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                </button>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <input
                    aria-label="Podcast playback progress"
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={Math.min(currentTime, duration || currentTime)}
                    onChange={handleRangeChange}
                    disabled={!item.audioUrl || hasError || !duration}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-500 disabled:cursor-not-allowed disabled:accent-slate-500"
                  />
                </div>
              </div>

              {hasError && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>Audio is unavailable for this episode.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 lg:w-auto lg:min-w-[180px] lg:justify-end">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-2.5 py-2 text-slate-300">
                <Volume2 className="h-4 w-4 shrink-0 text-cyan-300" />
                <input
                  aria-label="Adjust volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-500 sm:w-20"
                />
              </label>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close podcast player"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800/80 text-slate-300 transition hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        preload="metadata"
        src={item.audioUrl || undefined}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
          setCurrentTime(0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}
