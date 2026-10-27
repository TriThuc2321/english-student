'use client';

import { Button, Modal } from '@heroui/react';
import { useTranslations } from 'next-intl';

type TimeUpModalProps = {
  isOpen: boolean;
  onReview: () => void;
  onNextSection: (() => void) | null;
};

export function TimeUpModal({
  isOpen,
  onReview,
  onNextSection,
}: TimeUpModalProps) {
  const t = useTranslations('taking.timeUp');
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{t('title')}</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p>{t('body')}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onReview}>
              {t('review')}
            </Button>
            {onNextSection && (
              <Button onPress={onNextSection}>{t('nextSection')}</Button>
            )}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
