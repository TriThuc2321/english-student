'use client';

import {
  AlertDialog,
  Button,
  buttonVariants,
  Checkbox,
  CheckboxGroup,
  cn,
  Label,
  Radio,
  RadioGroup,
  Slider,
} from '@heroui/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  LuArrowRight,
  LuHeadphones,
  LuPause,
  LuPlay,
  LuRotateCcw,
  LuVolume2,
} from 'react-icons/lu';

import type { ExamDraft } from '@/lib/exam/draft';
import type { SkillType } from '@/types/student-test';

import { SKILL_CLASSES } from '@/constants/exam';
import { ROUTES } from '@/constants/routes';
import { clearExamDraft, loadExamDraft } from '@/lib/exam/draft';
import { isAnswered } from '@/lib/exam/structure';

import { SKILL_ICONS } from './skillBadges';
import { useFormatDuration } from './useFormatDuration';

export type IntroQuestion = {
  sectionId: number;
  questionId: number;
  size: number;
};

export type OverviewSection = {
  id: number;
  skill: SkillType;
  questionCount: number;
  minutes: number | null;
};

type DraftProgress = {
  answered: number;
  total: number;
  flagged: number;
  sectionId: number;
  remaining: number | null;
  sectionIds: number[] | null;
};

type Mode = 'full' | 'practice';

type TestOverviewProps = {
  slug: string;
  questions: IntroQuestion[];
  sections: OverviewSection[];
  rules: ReactNode;
};

const SAMPLE_AUDIO_SRC = '/audio/sample.mp3';

const CARD = 'bg-surface shadow-surface flex flex-col rounded-2xl p-6';

const subscribe = () => () => {};

const pad = (n: number) => String(n).padStart(2, '0');

function formatClock(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function summarize(
  draft: ExamDraft,
  questions: IntroQuestion[],
): DraftProgress {
  const sectionIds = draft.sectionIds ?? null;
  let answered = 0;
  let total = 0;
  for (const q of questions) {
    if (sectionIds && !sectionIds.includes(q.sectionId)) continue;
    total += q.size;
    if (isAnswered(draft.answers[q.sectionId]?.[q.questionId], q.size)) {
      answered += q.size;
    }
  }
  const flagged = Object.values(draft.flagged).reduce(
    (sum, list) => sum + list.length,
    0,
  );
  return {
    answered,
    total,
    flagged,
    sectionId: draft.sectionId,
    remaining: draft.remaining[draft.sectionId] ?? null,
    sectionIds,
  };
}

const sameProgress = (a: DraftProgress, b: DraftProgress) =>
  a.answered === b.answered &&
  a.total === b.total &&
  a.flagged === b.flagged &&
  a.sectionId === b.sectionId &&
  a.remaining === b.remaining &&
  a.sectionIds?.join() === b.sectionIds?.join();

function useDraftProgress(slug: string, questions: IntroQuestion[]) {
  // useSyncExternalStore needs a referentially stable snapshot, but each load parses a fresh object.
  const last = useRef<DraftProgress | null>(null);
  const getSnapshot = () => {
    const draft = loadExamDraft(slug);
    const next = draft ? summarize(draft, questions) : null;
    if (next && last.current && sameProgress(next, last.current)) {
      return last.current;
    }
    last.current = next;
    return next;
  };
  // The server snapshot keeps the first client render identical to SSR (no draft).
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export default function TestOverview({
  slug,
  questions,
  sections,
  rules,
}: TestOverviewProps) {
  const t = useTranslations();
  const formatDuration = useFormatDuration();
  const progress = useDraftProgress(slug, questions);
  // Clearing localStorage doesn't notify the snapshot, so a re-render has to pick it up.
  const [, setRestarts] = useState(0);
  const [chosenMode, setMode] = useState<Mode>('full');
  const [chosenIds, setPicked] = useState<string[]>([]);

  // An open attempt pins the selection it was started with.
  const mode: Mode = progress
    ? progress.sectionIds
      ? 'practice'
      : 'full'
    : chosenMode;
  const picked = progress ? (progress.sectionIds ?? []).map(String) : chosenIds;
  const isFull = mode === 'full';
  const chosen = isFull
    ? sections
    : sections.filter((s) => picked.includes(String(s.id)));
  const nothingChosen = chosen.length === 0;
  const minutes = chosen.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
  const href = ROUTES.takeTest(
    slug,
    isFull || chosen.length === sections.length
      ? null
      : chosen.map((s) => s.id),
  );

  let details: string[] = [];
  if (progress) {
    const skill = sections.find((s) => s.id === progress.sectionId)?.skill;
    details = [
      t('taking.answeredCount', {
        answered: progress.answered,
        total: progress.total,
      }),
    ];
    if (progress.remaining !== null) {
      details.push(
        sections.length > 1 && skill
          ? t('taking.intro.timeLeftIn', {
              time: formatClock(progress.remaining),
              section: t(`exam.skill.${skill}`),
            })
          : t('taking.intro.timeLeft', {
              time: formatClock(progress.remaining),
            }),
      );
    }
    if (progress.flagged > 0) {
      details.push(t('taking.intro.flaggedCount', { count: progress.flagged }));
    }
  }

  const sectionMeta = (section: OverviewSection) =>
    [
      t('taking.intro.questionCount', { count: section.questionCount }),
      section.minutes !== null &&
        t('tests.minutes', { count: section.minutes }),
    ]
      .filter(Boolean)
      .join(' · ');

  const percent =
    progress && progress.total > 0
      ? Math.round((progress.answered / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-6">
      {progress && (
        <div className="bg-surface shadow-surface flex flex-col gap-3 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="bg-warning/15 flex size-9 flex-none items-center justify-center rounded-full">
              <span aria-hidden className="bg-warning size-2 rounded-full" />
            </span>
            <div className="min-w-0 flex-auto">
              <p className="font-semibold">
                {t('taking.intro.inProgressTitle')}
              </p>
              <p
                className="text-muted mt-0.5 text-sm tabular-nums"
                data-testid="draft-progress"
              >
                {details.join(' · ')}
              </p>
            </div>
            <span className="text-muted hidden text-sm font-medium tabular-nums sm:block">
              {percent}%
            </span>
          </div>
          <div
            aria-hidden
            className="bg-default h-1.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-brand-navy h-full rounded-full transition-[width]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <section aria-labelledby="mode-heading" className={cn(CARD, 'gap-5')}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="mode-heading" className="text-lg font-semibold">
                {t(
                  progress
                    ? 'taking.intro.modeLocked'
                    : 'taking.intro.modeTitle',
                )}
              </h2>
              {progress && (
                <span className="bg-default rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {t(
                    isFull
                      ? 'taking.intro.modeFull'
                      : 'taking.intro.modePractice',
                  )}
                </span>
              )}
            </div>
            {!progress && (
              <RadioGroup
                aria-labelledby="mode-heading"
                value={mode}
                onChange={(value) => setMode(value as Mode)}
                className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3"
              >
                {(['full', 'practice'] as const).map((value) => (
                  <Radio
                    key={value}
                    value={value}
                    className={cn(
                      'rounded-xl border transition-colors',
                      mode === value
                        ? 'border-brand-navy bg-brand-navy-soft/60'
                        : 'border-border bg-surface hover:border-field-border',
                    )}
                  >
                    <Radio.Content className="flex w-full items-start gap-3 p-4">
                      <Radio.Control className="mt-0.5">
                        <Radio.Indicator />
                      </Radio.Control>
                      <span>
                        <span className="block font-semibold">
                          {t(
                            value === 'full'
                              ? 'taking.intro.modeFull'
                              : 'taking.intro.modePractice',
                          )}
                        </span>
                        <span className="text-muted mt-0.5 block text-sm">
                          {t(
                            value === 'full'
                              ? 'taking.intro.modeFullHint'
                              : 'taking.intro.modePracticeHint',
                          )}
                        </span>
                      </span>
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
            )}
            {isFull || progress ? (
              <div className="flex flex-col gap-2">
                <p className="eyebrow">
                  {t(
                    isFull
                      ? 'taking.intro.sectionsInOrder'
                      : 'taking.intro.sections',
                  )}
                </p>
                <ol className="flex flex-col gap-2">
                  {(isFull ? sections : chosen).map((section, index) => {
                    const current = progress?.sectionId === section.id;
                    return (
                      <li
                        key={section.id}
                        aria-current={current ? 'step' : undefined}
                        className={cn(
                          'flex min-h-13 items-center gap-3 rounded-xl border px-3.5 py-2.5',
                          current
                            ? 'border-brand-navy/40 bg-brand-navy-soft/40'
                            : 'border-border',
                        )}
                      >
                        <span className="text-muted w-4 text-sm tabular-nums">
                          {index + 1}
                        </span>
                        <SkillTile skill={section.skill} />
                        <span className="flex-auto font-medium">
                          {t(`exam.skill.${section.skill}`)}
                        </span>
                        <span className="text-muted text-sm">
                          {sectionMeta(section)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <CheckboxGroup
                value={picked}
                onChange={setPicked}
                className="flex flex-col gap-2"
              >
                <Label className="eyebrow mb-1">
                  {t('taking.intro.chooseSections')}
                </Label>
                {sections.map((section) => {
                  const selected = picked.includes(String(section.id));
                  return (
                    <Checkbox
                      key={section.id}
                      value={String(section.id)}
                      className={cn(
                        'rounded-xl border transition-colors',
                        selected
                          ? 'border-brand-navy bg-brand-navy-soft/60'
                          : 'border-border bg-surface hover:border-field-border',
                      )}
                    >
                      <Checkbox.Content className="flex min-h-13 w-full items-center gap-3 px-3.5 py-2.5">
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <SkillTile skill={section.skill} />
                        <span className="flex-auto font-medium">
                          {t(`exam.skill.${section.skill}`)}
                        </span>
                        <span className="text-muted text-sm">
                          {sectionMeta(section)}
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                  );
                })}
              </CheckboxGroup>
            )}
          </section>
          {rules}
        </div>
        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 lg:sticky lg:top-20">
          {chosen.some((s) => s.skill === 'LISTENING') && <HeadphoneCheck />}
          <section className={cn(CARD, 'gap-4')}>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t('taking.intro.youTake')}</dt>
                <dd className="text-right font-medium">
                  {isFull
                    ? t('taking.intro.modeFull')
                    : nothingChosen
                      ? t('taking.intro.noSections')
                      : chosen
                          .map((s) => t(`exam.skill.${s.skill}`))
                          .join(', ')}
                </dd>
              </div>
              {minutes > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t('taking.intro.time')}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatDuration(minutes)}
                  </dd>
                </div>
              )}
            </dl>
            {nothingChosen ? (
              <Button variant="primary" size="lg" fullWidth isDisabled>
                {t('taking.intro.start')}
              </Button>
            ) : (
              <Link
                href={href}
                className={buttonVariants({
                  variant: 'primary',
                  size: 'lg',
                  fullWidth: true,
                })}
              >
                {t(progress ? 'taking.intro.resume' : 'taking.intro.start')}
                <LuArrowRight aria-hidden />
              </Link>
            )}
            {progress && (
              <>
                <RestartButton
                  onConfirm={() => {
                    clearExamDraft(slug);
                    setRestarts((n) => n + 1);
                  }}
                />
                <p className="text-muted -mt-1 text-center text-xs leading-relaxed">
                  {t('taking.intro.lockedHint')}
                </p>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SkillTile({ skill }: { skill: SkillType }) {
  const Icon = SKILL_ICONS[skill];
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 flex-none items-center justify-center rounded-lg',
        SKILL_CLASSES[skill],
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function RestartButton({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations('taking.intro');
  return (
    <AlertDialog>
      <Button variant="ghost" size="sm" className="text-muted self-center">
        <LuRotateCcw aria-hidden />
        {t('restart')}
      </Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{t('restartTitle')}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>{t('restartBody')}</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                {t('cancel')}
              </Button>
              <Button slot="close" variant="danger" onPress={onConfirm}>
                {t('restartConfirm')}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

function HeadphoneCheck() {
  const t = useTranslations('taking.intro');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = () => {
    // Created on first press so the sample isn't downloaded unless asked for.
    if (!audioRef.current) {
      const audio = new Audio(SAMPLE_AUDIO_SRC);
      audio.volume = volume / 100;
      audio.addEventListener('ended', () => setPlaying(false));
      audio.addEventListener('pause', () => setPlaying(false));
      audio.addEventListener('play', () => setPlaying(true));
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  };

  return (
    <section aria-labelledby="audio-heading" className={cn(CARD, 'gap-3.5')}>
      <h2
        id="audio-heading"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <LuHeadphones aria-hidden className="size-5" />
        {t('audioTitle')}
      </h2>
      <p className="text-muted text-sm">{t('audioHint')}</p>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onPress={toggle} className="flex-none">
          {playing ? (
            <LuPause aria-hidden className="fill-current" />
          ) : (
            <LuPlay aria-hidden className="fill-current" />
          )}
          {playing ? t('pauseSample') : t('playSample')}
        </Button>
        <div className="text-muted flex flex-auto items-center gap-2">
          <LuVolume2 aria-hidden className="size-4.5 flex-none" />
          <Slider
            aria-label={t('volume')}
            value={volume}
            onChange={(value) => setVolume(value as number)}
            className="min-w-0 flex-auto"
          >
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </div>
      </div>
      <Checkbox className="text-sm">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {t('audioOk')}
        </Checkbox.Content>
      </Checkbox>
    </section>
  );
}
