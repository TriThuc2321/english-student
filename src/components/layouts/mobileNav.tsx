'use client';

import { Button, Drawer } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { IoMenuOutline } from 'react-icons/io5';

import NavLinks from './navLinks';

export default function MobileNav() {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="tertiary"
        isIconOnly
        aria-label={t('nav.openMenu')}
        className="rounded-full md:hidden"
        onPress={() => setIsOpen(true)}
      >
        <IoMenuOutline size={18} />
      </Button>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>{t('appName')}</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <NavLinks
                orientation="vertical"
                onNavigate={() => setIsOpen(false)}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
