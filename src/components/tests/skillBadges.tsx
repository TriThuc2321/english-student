import type { IconType } from 'react-icons';

import { useTranslations } from 'next-intl';
import {
  IoBookOutline,
  IoCreateOutline,
  IoHeadsetOutline,
  IoMicOutline,
} from 'react-icons/io5';

import type { SkillType, StudentTestSection } from '@/types/student-test';

export const SKILL_ICONS: Record<SkillType, IconType> = {
  LISTENING: IoHeadsetOutline,
  READING: IoBookOutline,
  WRITING: IoCreateOutline,
  SPEAKING: IoMicOutline,
};

type SkillBadgesProps = {
  sections: StudentTestSection[];
};

export default function SkillBadges({ sections }: SkillBadgesProps) {
  const t = useTranslations();

  return (
    <ul aria-label={t('tests.sections')} className="flex flex-wrap gap-1.5">
      {sections.map((section) => {
        const Icon = SKILL_ICONS[section.skill];
        return (
          <li
            key={section.id}
            className="bg-surface-secondary flex items-center gap-1.5 rounded px-2 py-1 text-[13px] leading-[18px]"
          >
            <Icon size={14} aria-hidden className="text-muted" />
            {t(`exam.skill.${section.skill}`)}
            {section.durationMinutes !== null && (
              <b>{t('tests.minutes', { count: section.durationMinutes })}</b>
            )}
          </li>
        );
      })}
    </ul>
  );
}
