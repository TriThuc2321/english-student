import { useTranslations } from 'next-intl';
import { Fragment, type ReactNode } from 'react';
import { LuArrowDown } from 'react-icons/lu';

import { useExamGroup } from '../context';
import {
  Blank,
  fillTemplate,
  FlagToggle,
  OptionsBox,
  Prompt,
  QRow,
  TextAnswer,
} from '../parts';
import { GroupAudio, GroupImage } from './groupMedia';

const textBlank = (n: number) => <Blank n={n} />;

const Line = ({ children }: { children: ReactNode }) => (
  <div className="mb-2 leading-[3rem]">{children}</div>
);

// Form / note / flow-chart: one template, every {{n}} is a text box
export const TemplateView = () => {
  const { group } = useExamGroup();
  const lines = (group.content?.template ?? '').split('\n');

  if (group.variant === 'flow') {
    return (
      <>
        <GroupAudio />
        <div className="mx-auto flex max-w-xl flex-col items-center">
          {lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <LuArrowDown className="text-muted my-1 size-4" />}
              <div className="border-border rounded-field w-full border px-4 py-2 text-center leading-[3rem]">
                {fillTemplate(line, textBlank)}
              </div>
            </Fragment>
          ))}
        </div>
      </>
    );
  }

  // '# ' starts a heading, '- ' a bullet; anything else is a plain line
  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={blocks.length} className="mb-2 list-disc pl-6">
        {bullets}
      </ul>,
    );
    bullets = [];
  };
  lines.forEach((line, i) => {
    if (line.startsWith('# ')) {
      flush();
      blocks.push(
        <h5 key={blocks.length} className="mt-2 mb-1 font-bold">
          {fillTemplate(line.slice(2), textBlank)}
        </h5>,
      );
    } else if (line.startsWith('- ')) {
      bullets.push(
        <li key={i} className="leading-[3rem]">
          {fillTemplate(line.slice(2), textBlank)}
        </li>,
      );
    } else {
      flush();
      blocks.push(
        <Line key={blocks.length}>{fillTemplate(line, textBlank)}</Line>,
      );
    }
  });
  flush();

  return (
    <>
      <GroupAudio />
      <div
        className={
          group.variant === 'form'
            ? 'border-border rounded-field mx-auto max-w-xl border p-4'
            : ''
        }
      >
        {blocks}
      </div>
    </>
  );
};

export const SentenceView = () => {
  const { group } = useExamGroup();
  return (
    <>
      <GroupAudio />
      {group.questions.map((q) => (
        <div
          key={q.n}
          className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2"
        >
          <div className="leading-[3rem]">
            {fillTemplate(q.prompt ?? '', (n) => (
              <Blank n={n} withFlag={n !== q.n} />
            ))}
          </div>
          <div className="pt-1">
            <FlagToggle n={q.n} />
          </div>
        </div>
      ))}
    </>
  );
};

export const SummaryView = () => {
  const t = useTranslations('taking');
  const { group } = useExamGroup();
  const { template = '', options } = group.content ?? {};
  return (
    <>
      <GroupAudio />
      <p className="mb-3 leading-[3rem]">
        {fillTemplate(template, (n) => (
          <Blank n={n} options={options} />
        ))}
      </p>
      {options && (
        <OptionsBox
          title={group.boxTitle && t(`boxTitle.${group.boxTitle}`)}
          options={options}
        />
      )}
    </>
  );
};

export const TableView = () => {
  const { group } = useExamGroup();
  const { headers, rows = [] } = group.content?.table ?? {};
  return (
    <>
      <GroupAudio />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {headers && (
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className="border-border bg-default border p-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border-border border p-2">
                    {fillTemplate(cell, textBlank)}
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

export const DiagramView = () => {
  const { group } = useExamGroup();
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <GroupImage />
      <div>
        {group.questions.map((q) => (
          <Line key={q.n}>{textBlank(q.n)}</Line>
        ))}
      </div>
    </div>
  );
};

export const ShortAnswerView = () => {
  const { group } = useExamGroup();
  return (
    <>
      <GroupAudio />
      {group.questions.map((q) => (
        <QRow key={q.n} n={q.n}>
          <Prompt>{q.prompt}</Prompt>
          <TextAnswer n={q.n} />
        </QRow>
      ))}
    </>
  );
};
