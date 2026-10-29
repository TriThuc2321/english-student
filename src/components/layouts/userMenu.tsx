'use client';

import { Avatar, Dropdown, Label } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import type { Profile } from '@/types/student-test';

import defaultAvatar from '@/assets/images/default-avatar.jpg';
import { logout } from '@/lib/auth/actions';

type UserMenuProps = {
  profile: Profile | null;
};

export default function UserMenu({ profile }: UserMenuProps) {
  const t = useTranslations();
  const [, startTransition] = useTransition();

  const fullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ');
  const avatarSrc = profile?.avatar ?? defaultAvatar.src;

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={t('common.userMenu')}
        className="rounded-full"
      >
        <Avatar size="sm">
          <Avatar.Image alt="" src={avatarSrc} />
          <Avatar.Fallback>{fullName.charAt(0)}</Avatar.Fallback>
        </Avatar>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        {(fullName || profile?.email) && (
          <div className="flex flex-col px-3 pt-3 pb-1">
            {fullName && (
              <p className="text-sm leading-5 font-medium">{fullName}</p>
            )}
            {profile?.email && (
              <p className="text-muted text-xs">{profile.email}</p>
            )}
          </div>
        )}
        <Dropdown.Menu aria-label={t('common.userMenu')}>
          <Dropdown.Item
            id="logout"
            textValue={t('auth.logout')}
            variant="danger"
            onAction={() => startTransition(() => logout())}
          >
            <Label>{t('auth.logout')}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
