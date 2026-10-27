import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';

import type { StudentTestSection } from '@/types/student-test';

type SkillBadgesProps = {
  sections: StudentTestSection[];
};

export default function SkillBadges({ sections }: SkillBadgesProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap gap-1.5">
      {sections.map((section) => (
        <Chip key={section.id} size="sm" variant="soft">
          {section.durationMinutes === null
            ? t(`exam.skill.${section.skill}`)
            : `${t(`exam.skill.${section.skill}`)} · ${t('tests.minutes', { count: section.durationMinutes })}`}
        </Chip>
      ))}
    </div>
  );
}
