import type { IconType } from 'react-icons';

import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import {
  IoBookOutline,
  IoCreateOutline,
  IoHeadsetOutline,
  IoMicOutline,
} from 'react-icons/io5';

import type { SkillType, StudentTestSection } from '@/types/student-test';

import { SKILL_CLASSES } from '@/constants/exam';

const SKILL_ICONS: Record<SkillType, IconType> = {
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
    <div className="flex flex-wrap gap-1.5">
      {sections.map((section) => {
        const Icon = SKILL_ICONS[section.skill];
        return (
          <Chip
            key={section.id}
            size="sm"
            variant="soft"
            className={SKILL_CLASSES[section.skill]}
          >
            <Icon size={12} aria-hidden />
            <Chip.Label>
              {section.durationMinutes === null
                ? t(`exam.skill.${section.skill}`)
                : `${t(`exam.skill.${section.skill}`)} · ${t('tests.minutes', { count: section.durationMinutes })}`}
            </Chip.Label>
          </Chip>
        );
      })}
    </div>
  );
}
