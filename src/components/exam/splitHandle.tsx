'use client';

import { useTranslations } from 'next-intl';
import { useRef, type RefObject } from 'react';

import { SPLIT_MAX, SPLIT_MIN } from './useSplitRatio';

type SplitHandleProps = {
  containerRef: RefObject<HTMLElement | null>;
  ratio: number;
  onChange: (ratio: number, persist?: boolean) => void;
};

const STEP = 5;

export function SplitHandle({
  containerRef,
  ratio,
  onChange,
}: SplitHandleProps) {
  const t = useTranslations('taking');
  const dragging = useRef(false);

  const fromPointer = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChange(((clientX - rect.left) / rect.width) * 100, false);
  };

  // Also runs on pointercancel / lostpointercapture, so a gesture the browser
  // takes over can't leave the handle stuck in drag mode.
  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onChange(ratio);
  };

  return (
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a focusable splitter needs children and key handling, which <hr> can't take
      role="separator"
      aria-orientation="vertical"
      aria-label={t('resizePanes')}
      aria-valuenow={ratio}
      aria-valuemin={SPLIT_MIN}
      aria-valuemax={SPLIT_MAX}
      tabIndex={0}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragging.current) fromPointer(e.clientX);
      }}
      onPointerUp={(e) => {
        endDrag();
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onDoubleClick={() => onChange(50)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onChange(ratio - STEP);
        else if (e.key === 'ArrowRight') onChange(ratio + STEP);
        else return;
        e.preventDefault();
      }}
      className="group focus-visible:ring-brand-navy/40 relative z-10 hidden w-2 flex-none cursor-col-resize touch-none outline-none focus-visible:ring-2 lg:block"
    >
      <span
        aria-hidden
        className="bg-separator group-hover:bg-brand-navy/40 group-active:bg-brand-navy absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors"
      />
      <span
        aria-hidden
        className="bg-surface border-border shadow-surface absolute top-1/2 left-1/2 flex h-10 w-3 -translate-1/2 flex-col items-center justify-center gap-0.5 rounded-full border"
      >
        <span className="bg-muted size-0.5 rounded-full" />
        <span className="bg-muted size-0.5 rounded-full" />
        <span className="bg-muted size-0.5 rounded-full" />
      </span>
    </div>
  );
}
