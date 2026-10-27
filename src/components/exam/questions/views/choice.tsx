import { useTranslations } from 'next-intl';

import { useExamGroup } from '../context';
import { Choices, formatRange, Hint, Prompt, QRow } from '../parts';
import {
  GroupAudio,
  GroupImage,
  QuestionAudio,
  QuestionImage,
} from './groupMedia';

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

const FIXED_KEYS = {
  TRUE_FALSE_NOT_GIVEN: ['TRUE', 'FALSE', 'NOT GIVEN'],
  YES_NO_NOT_GIVEN: ['YES', 'NO', 'NOT GIVEN'],
} as const;

export const McqView = () => {
  const { group } = useExamGroup();
  return (
    <>
      <GroupAudio />
      {group.questions.map((q) => (
        <QRow key={q.n} n={q.n}>
          <QuestionAudio q={q} />
          <Prompt>{q.prompt}</Prompt>
          <Choices n={q.n} options={q.content?.options ?? []} />
        </QRow>
      ))}
    </>
  );
};

export const MultiView = () => {
  const t = useTranslations('taking');
  const { group } = useExamGroup();
  return (
    <>
      <GroupAudio />
      {group.questions.map((q) => {
        const count = q.nTo - q.n + 1;
        return (
          <QRow key={q.n} n={q.n} label={formatRange(q)}>
            <Prompt>{q.prompt}</Prompt>
            <Hint>
              {t('chooseN', {
                count: NUM_WORDS[count]?.toUpperCase() ?? count,
              })}
            </Hint>
            <Choices
              n={q.n}
              options={q.content?.options ?? []}
              multi
              limit={count}
            />
          </QRow>
        );
      })}
    </>
  );
};

export const JudgeView = () => {
  const { group } = useExamGroup();
  const keys =
    group.type === 'TRUE_FALSE_NOT_GIVEN' || group.type === 'YES_NO_NOT_GIVEN'
      ? FIXED_KEYS[group.type]
      : [];
  const options = keys.map((key) => ({ key, text: key }));
  return group.questions.map((q) => (
    <QRow key={q.n} n={q.n}>
      <Prompt>{q.prompt}</Prompt>
      <Choices n={q.n} options={options} variant="pills" />
    </QRow>
  ));
};

export const PhotoView = () => {
  const t = useTranslations('taking');
  const { group } = useExamGroup();
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <GroupImage />
      <div>
        <GroupAudio />
        {group.questions.map((q) => (
          <QRow key={q.n} n={q.n}>
            <QuestionImage q={q} />
            <QuestionAudio q={q} />
            <Hint>{t('photoHint')}</Hint>
            <Choices
              n={q.n}
              options={q.content?.options ?? []}
              variant="bubbles"
            />
          </QRow>
        ))}
      </div>
    </div>
  );
};

export const QuestionResponseView = () => {
  const { group } = useExamGroup();
  return (
    <>
      <GroupAudio />
      {group.questions.map((q) => (
        <QRow key={q.n} n={q.n}>
          <QuestionAudio q={q} />
          <Prompt>{q.prompt}</Prompt>
          <Choices
            n={q.n}
            options={q.content?.options ?? []}
            variant="bubbles"
          />
        </QRow>
      ))}
    </>
  );
};

// TOEIC Part 6: picking an option fills the numbered gap in the passage
export const TextCompletionView = () => {
  const { group, answers } = useExamGroup();
  const parts = (group.passageText ?? '').split(/\[\[(\d+)\]\]/);

  const gap = (n: number) => {
    const q = group.questions.find((x) => x.n === n);
    const picked = q?.content?.options?.find((o) => o.key === answers[n]);
    return (
      <span className="border-accent text-accent mx-0.5 inline-block min-w-12 border-b-2 px-1 text-center font-semibold">
        {picked?.text ?? n}
      </span>
    );
  };

  return (
    <>
      <div className="border-border rounded-field mb-4 border p-4 text-sm leading-7 whitespace-pre-line">
        {parts.map((part, i) =>
          i % 2 ? <span key={i}>{gap(Number(part))}</span> : part,
        )}
      </div>
      {group.questions.map((q) => (
        <QRow key={q.n} n={q.n}>
          <Choices n={q.n} options={q.content?.options ?? []} />
        </QRow>
      ))}
    </>
  );
};
