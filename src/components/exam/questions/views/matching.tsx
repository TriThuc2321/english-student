import { useTranslations } from 'next-intl';

import { useExamGroup } from '../context';
import { FlagToggle, Hint, KeySelect, OptionsBox, QNum, QRow } from '../parts';
import { GroupAudio, GroupImage } from './groupMedia';

export const MatchingView = () => {
  const t = useTranslations('taking');
  const { group, answers } = useExamGroup();
  const { options = [], allowReuse } = group.content ?? {};
  const hasText = options.some((o) => o.text);

  const takenByOthers = (n: number) =>
    allowReuse
      ? undefined
      : group.questions
          .filter((q) => q.n !== n)
          .map((q) => answers[q.n])
          .filter((v): v is string => typeof v === 'string' && v !== '');

  return (
    <>
      {hasText && (
        <OptionsBox
          title={group.boxTitle && t(`boxTitle.${group.boxTitle}`)}
          options={options}
        />
      )}
      {allowReuse && <Hint>{t('allowReuse')}</Hint>}
      {group.questions.map((q) => (
        <QRow key={q.n} n={q.n}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <span className="mt-0.5">{q.prompt}</span>
            <KeySelect
              n={q.n}
              options={options}
              disabledKeys={takenByOthers(q.n)}
            />
          </div>
        </QRow>
      ))}
    </>
  );
};

// Map / plan labelling: one row per place, one radio column per letter
export const MapView = () => {
  const t = useTranslations('taking');
  const { group, answers, setAnswer, readOnly } = useExamGroup();
  const options = group.content?.options ?? [];
  const optionLabel = (n: number, key: string) =>
    t('answerLabel', { n: `${n} ${key}` });

  return (
    <>
      <GroupAudio />
      <GroupImage className="mb-4 max-w-md" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <td aria-hidden className="border-border border p-2" />
              {options.map((o) => (
                <th key={o.key} className="border-border border p-2">
                  {o.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.questions.map((q) => (
              <tr key={q.n} id={`q-${q.n}`}>
                <td className="border-border border p-2">
                  <div className="flex items-center gap-2">
                    <QNum>{q.n}</QNum>
                    <span className="min-w-0 flex-1">{q.prompt}</span>
                    <FlagToggle n={q.n} />
                  </div>
                </td>
                {options.map((o) => (
                  <td
                    key={o.key}
                    className="border-border border p-2 text-center"
                  >
                    <input
                      type="radio"
                      className="accent-accent"
                      name={`${group.id}-${q.n}`}
                      aria-label={optionLabel(q.n, o.key)}
                      checked={answers[q.n] === o.key}
                      disabled={readOnly}
                      onChange={() => setAnswer(q.n, o.key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
