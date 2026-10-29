'use client';

import { Button, Modal, Spinner } from '@heroui/react';
import { useTranslations } from 'next-intl';

import type { PartGroup } from './questionNavigator';

import { formatClock } from './examTimer';
import { NavNumber } from './questionNavigator';

type SubmitModalProps = {
  isOpen: boolean;
  sectionName: string;
  groups: PartGroup[];
  flagged: number[];
  remaining: number | null;
  isSubmitting?: boolean;
  hasError?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoTo: (partId: number, from: number) => void;
};

export function SubmitModal({
  isOpen,
  sectionName,
  groups,
  flagged,
  remaining,
  isSubmitting = false,
  hasError = false,
  onClose,
  onConfirm,
  onGoTo,
}: SubmitModalProps) {
  const t = useTranslations('taking.submit');
  const numbers = groups.flatMap((g) =>
    g.numbers.map((x) => ({ ...x, partId: g.id })),
  );
  const unanswered = numbers.filter((x) => !x.answered);
  // A multi-answer question is flagged by its first number, so list it once.
  const flaggedNumbers = numbers.filter(
    (x) => x.n === x.from && flagged.includes(x.from),
  );

  const stats = [
    { label: t('answered'), value: numbers.length - unanswered.length },
    { label: t('unanswered'), value: unanswered.length },
    { label: t('flagged'), value: flaggedNumbers.length },
  ];

  const goTo = (partId: number, from: number) => {
    onClose();
    onGoTo(partId, from);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[560px]">
          <Modal.CloseTrigger aria-label={t('close')} />
          <Modal.Header>
            <Modal.Heading>
              {t('title', { section: sectionName })}
            </Modal.Heading>
            <p className="text-muted text-sm">{t('body')}</p>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-5">
            <dl className="grid grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-surface-secondary flex flex-col-reverse rounded-xl px-3.5 py-3"
                >
                  <dt className="text-muted text-xs">{stat.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
            {unanswered.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">{t('unanswered')}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {unanswered.map((x) => (
                    <li key={x.n}>
                      <NavNumber
                        n={x.n}
                        answered={false}
                        flagged={false}
                        label={t('goTo', { n: x.n })}
                        onPress={() => goTo(x.partId, x.from)}
                        className="w-10"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {flaggedNumbers.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">
                  {t('flaggedTitle')}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {flaggedNumbers.map((x) => (
                    <li key={x.n}>
                      <NavNumber
                        n={x.n}
                        answered={x.answered}
                        flagged
                        label={t('goTo', { n: x.n })}
                        onPress={() => goTo(x.partId, x.from)}
                        className="w-10"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {remaining !== null && (
              <p className="text-muted text-sm">
                {t('timerRunning', { time: formatClock(remaining) })}
              </p>
            )}
            {hasError && (
              <p role="alert" className="text-danger text-sm">
                {t('error')}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              isDisabled={isSubmitting}
              onPress={onClose}
            >
              {t('back')}
            </Button>
            <Button isPending={isSubmitting} onPress={onConfirm}>
              {isSubmitting ? (
                <>
                  <Spinner color="current" size="sm" />
                  {t('submitting')}
                </>
              ) : (
                t('confirm')
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
