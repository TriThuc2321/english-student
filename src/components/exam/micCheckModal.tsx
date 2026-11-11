'use client';

import { AlertDialog, Button, Meter, Spinner } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { LuCircleCheck, LuMic } from 'react-icons/lu';

import { SAMPLE_MS, useMicCheck } from './useMicCheck';

type MicCheckModalProps = {
  isOpen: boolean;
  onDone: () => void;
};

export function MicCheckModal({ isOpen, onDone }: MicCheckModalProps) {
  const t = useTranslations('taking.micCheck');
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-[480px]">
          <AlertDialog.Header className="items-center text-center">
            <span
              aria-hidden
              className="bg-skill-speaking-soft text-skill-speaking grid size-14 place-items-center rounded-full"
            >
              <LuMic className="size-7" />
            </span>
            <AlertDialog.Heading className="text-2xl">
              {t('title')}
            </AlertDialog.Heading>
          </AlertDialog.Header>
          {/* Mounted only while open, so closing the dialog releases the microphone. */}
          {isOpen && <MicCheckBody onDone={onDone} />}
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

function MicCheckBody({ onDone }: { onDone: () => void }) {
  const t = useTranslations('taking');
  const mic = useMicCheck();
  const listening = mic.state === 'listening';
  const ready = mic.heard || mic.sampleUrl !== null;

  return (
    <>
      <AlertDialog.Body className="flex flex-col gap-4">
        <p className="text-muted text-center">{t('micCheck.body')}</p>
        {mic.state === 'idle' && (
          <Button fullWidth onPress={() => void mic.start()}>
            <LuMic aria-hidden className="size-4" />
            {t('micCheck.allow')}
          </Button>
        )}
        {mic.state === 'requesting' && (
          <p className="text-muted flex items-center justify-center gap-2 text-sm">
            <Spinner size="sm" color="current" />
            {t('micCheck.requesting')}
          </p>
        )}
        {mic.state === 'error' && (
          <div role="alert" className="flex flex-col gap-3 text-sm">
            <p className="text-danger">
              {mic.error === 'unsupported'
                ? t('micUnsupported')
                : t('micCheck.denied')}
            </p>
            {mic.error === 'permission' && (
              <Button variant="secondary" onPress={() => void mic.start()}>
                {t('micCheck.retry')}
              </Button>
            )}
          </div>
        )}
        {listening && (
          <>
            <p className="text-sm">{t('micCheck.speakPrompt')}</p>
            <Meter
              aria-label={t('micCheck.level')}
              value={mic.level * 100}
              color={mic.heard ? 'success' : 'accent'}
            >
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
            <p aria-live="polite" className="text-sm empty:hidden">
              {mic.heard && (
                <span className="text-success flex items-center gap-2 font-semibold">
                  <LuCircleCheck aria-hidden className="size-4" />
                  {t('micCheck.heard')}
                </span>
              )}
            </p>
            <div className="bg-surface-secondary flex flex-col gap-3 rounded-xl px-4 py-3 text-sm">
              <p className="text-muted">
                {t('micCheck.sampleHint', { seconds: SAMPLE_MS / 1000 })}
              </p>
              <Button
                size="sm"
                variant="secondary"
                isDisabled={mic.sampling}
                onPress={mic.recordSample}
              >
                {mic.sampling ? (
                  <>
                    <Spinner size="sm" color="current" />
                    {t('micCheck.sampling')}
                  </>
                ) : mic.sampleUrl ? (
                  t('micCheck.recordAgain')
                ) : (
                  t('micCheck.recordSample')
                )}
              </Button>
              {mic.sampleUrl && (
                // oxlint-disable-next-line jsx-a11y/media-has-caption -- the student's own sample has no captions to offer
                <audio
                  controls
                  src={mic.sampleUrl}
                  aria-label={t('micCheck.playback')}
                  className="w-full"
                />
              )}
            </div>
          </>
        )}
      </AlertDialog.Body>
      <AlertDialog.Footer className="flex-col items-stretch gap-2">
        <Button size="lg" fullWidth isDisabled={!ready} onPress={onDone}>
          {t('micCheck.confirm')}
        </Button>
        <Button variant="ghost" fullWidth onPress={onDone}>
          {t('micCheck.skip')}
        </Button>
      </AlertDialog.Footer>
    </>
  );
}
