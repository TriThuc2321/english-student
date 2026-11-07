import type { IconType } from 'react-icons';

import { useTranslations } from 'next-intl';
import {
  IoBookOutline,
  IoCreateOutline,
  IoHeadsetOutline,
  IoMicOutline,
} from 'react-icons/io5';

import type { SkillType, StudentTestSection } from '@/types/student-test';

import { SKILL_CLASSES } from '@/constants/exam';

export const SKILL_ICONS: Record<SkillType, IconType> = {
  LISTENING: IoHeadsetOutline,
  READING: IoBookOutline,
  WRITING: IoCreateOutline,
  SPEAKING: IoMicOutline,
};

type SkillBadgesProps = {
  sections: StudentTestSection[];
  // A section without its own duration runs on the test's.
  fallbackMinutes?: number | null;
};

export default function SkillBadges({
  sections,
  fallbackMinutes = null,
}: SkillBadgesProps) {
  const t = useTranslations();

  return (
    <ul aria-label={t('tests.sections')} className="flex flex-wrap gap-1.5">
      {sections.map((section) => {
        const Icon = SKILL_ICONS[section.skill];
        const minutes = section.durationMinutes ?? fallbackMinutes;
        return (
          <li
            key={section.id}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${SKILL_CLASSES[section.skill]}`}
          >
            <Icon size={13} aria-hidden />
            {t(`exam.skill.${section.skill}`)}
            {minutes !== null && (
              <span className="opacity-75">
                {t('tests.minutes', { count: minutes })}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
