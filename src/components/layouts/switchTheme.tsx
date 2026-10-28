'use client';

import { Button } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';

const subscribe = () => () => {};

export default function ThemeSwitch() {
  const t = useTranslations('common');
  const { setTheme, resolvedTheme } = useTheme();
  // A click on the server-rendered button before hydration has no handler and is silently lost.
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <Button
      variant="tertiary"
      isIconOnly
      isDisabled={!isHydrated}
      aria-label={t('toggleTheme')}
      className="rounded-full"
      onPress={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <IoSunnyOutline size={12} data-hide-on-theme="dark" />
      <IoMoonOutline size={12} data-hide-on-theme="light" />
    </Button>
  );
}
