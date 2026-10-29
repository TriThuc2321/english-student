'use client';

import { Button, cn } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import type { StudentMedia } from '@/types/student-test';

import { mmss } from './parts';

const SPEEDS = [0.75, 1, 1.25];

type ExamAudioProps = {
  media: StudentMedia;
  startMs?: number | null;
  endMs?: number | null;
  className?: string;
};

export function ExamAudio({
  media,
  startMs,
  endMs,
  className,
}: ExamAudioProps) {
  const t = useTranslations('taking.audio');
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const start = (startMs ?? 0) / 1000;
  const end =
    endMs != null ? endMs / 1000 : duration || (media.durationMs ?? 0) / 1000;

  const toggle = () => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.currentTime < start || audio.currentTime >= end) {
        audio.currentTime = start;
      }
      void audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div
      className={cn(
        'bg-default mb-3 flex items-center gap-3 rounded-full px-3 py-1.5',
        className,
      )}
    >
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- no transcripts are served */}
      <audio
        ref={ref}
        preload="metadata"
        src={media.url}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.currentTime = start;
          setTime(start);
        }}
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          if (endMs != null && audio.currentTime >= end) {
            audio.pause();
            audio.currentTime = end;
          }
          setTime(audio.currentTime);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <Button size="sm" onPress={toggle}>
        {playing ? t('pause') : t('play')}
      </Button>
      <input
        type="range"
        aria-label={t('seek')}
        className="accent-accent flex-1"
        min={start}
        max={end}
        step={0.1}
        value={Math.min(Math.max(time, start), end)}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (ref.current) ref.current.currentTime = next;
          setTime(next);
        }}
      />
      <small className="text-muted tabular-nums">
        {mmss(Math.max(0, Math.floor(time - start)))} /{' '}
        {mmss(Math.max(0, Math.floor(end - start)))}
      </small>
      <select
        aria-label={t('speed')}
        className="border-border bg-surface rounded-field border px-1 text-sm"
        defaultValue={1}
        onChange={(e) => {
          if (ref.current) ref.current.playbackRate = Number(e.target.value);
        }}
      >
        {SPEEDS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>
    </div>
  );
}

export function ExamImage({
  media,
  className,
}: {
  media: StudentMedia;
  className?: string;
}) {
  // oxlint-disable-next-line next/no-img-element -- project rule: plain <img>
  return <img src={media.url} alt="" className={className} />;
}

export function QuestionAudioButton({
  media,
  startMs,
}: {
  media: StudentMedia;
  startMs: number;
}) {
  const t = useTranslations('taking.audio');
  const ref = useRef<HTMLAudioElement>(null);

  return (
    <>
      {/* oxlint-disable-next-line jsx-a11y/media-has-caption -- no transcripts are served */}
      <audio ref={ref} preload="none" src={media.url} className="hidden" />
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          const audio = ref.current;
          if (!audio) return;
          audio.currentTime = startMs / 1000;
          void audio.play();
        }}
      >
        {t('playQuestion')}
      </Button>
    </>
  );
}
