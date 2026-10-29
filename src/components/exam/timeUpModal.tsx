'use client';

import { AlertDialog, Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { LuCircleCheck, LuClock } from 'react-icons/lu';

const AUTO_CONTINUE_SECONDS = 10;

type TimeUpModalProps = {
  isOpen: boolean;
  sectionName: string;
  answered: number;
  total: number;
  nextSectionName: string | null;
  onContinue: () => void;
};

export function TimeUpModal({
  isOpen,
  sectionName,
  answered,
  total,
  nextSectionName,
  onContinue,
}: TimeUpModalProps) {
  const t = useTranslations('taking.timeUp');
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="items-center text-center sm:max-w-[480px]">
          <AlertDialog.Header className="items-center">
            <span
              aria-hidden
              className="bg-brand-navy-soft text-brand-navy grid size-14 place-items-center rounded-full"
            >
              <LuClock className="size-7" />
            </span>
            <AlertDialog.Heading className="text-2xl">
              {t('title')}
            </AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="flex flex-col items-center gap-4">
            <p className="text-muted">{t('body', { section: sectionName })}</p>
            <p className="bg-surface-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
              <LuCircleCheck aria-hidden className="text-success size-4" />
              {t('answeredOf', { answered, total })}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex-col items-stretch gap-3">
            <Button size="lg" fullWidth onPress={onContinue}>
              {nextSectionName
                ? t('continueTo', { section: nextSectionName })
                : t('finish')}
            </Button>
            {isOpen && nextSectionName && (
              <AutoContinue section={nextSectionName} onDone={onContinue} />
            )}
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

// Mounted only while the dialog is open, so each opening starts a fresh countdown.
function AutoContinue({
  section,
  onDone,
}: {
  section: string;
  onDone: () => void;
}) {
  const t = useTranslations('taking.timeUp');
  const [left, setLeft] = useState(AUTO_CONTINUE_SECONDS);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left === 0) onDoneRef.current();
  }, [left]);

  return (
    <p aria-live="polite" className="text-muted text-xs">
      {t('autoContinue', { section, seconds: left })}
    </p>
  );
}
