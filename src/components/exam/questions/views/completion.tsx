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
  <div className="mb-2 leading-10">{children}</div>
);

const BULLET = /^[-•*·–]\s+/;

// A bare heading must also open a block (start, after a blank line or after another
// heading) and have content under it, so a short sentence inside a note stays a line.
const isBareHeading = (line: string, opensBlock: boolean, next?: string) =>
  opensBlock &&
  !!next?.trim() &&
  !line.includes('{{') &&
  line.length <= 60 &&
  !/[.:;,?!]$/.test(line);

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
              <div className="border-border w-full rounded-xl border px-4 py-2 text-center leading-10">
                {fillTemplate(line, textBlank)}
              </div>
            </Fragment>
          ))}
        </div>
      </>
    );
  }

  // '# ' starts a heading and '- ' a bullet. Imported notes often use '•' bullets and bare
  // short lines as headings, so those are recognised too.
  const blocks: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  let headings = 0;
  let opensBlock = true;
  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul
        key={blocks.length}
        className="marker:text-muted mb-3 list-disc space-y-1 pl-6"
      >
        {bullets}
      </ul>,
    );
    bullets = [];
  };
  const heading = (text: string) => {
    flush();
    const isTitle = headings === 0;
    headings += 1;
    blocks.push(
      isTitle ? (
        <h5
          key={blocks.length}
          className="mb-3 text-lg font-semibold tracking-tight"
        >
          {fillTemplate(text, textBlank)}
        </h5>
      ) : (
        <h6
          key={blocks.length}
          className="text-muted mt-4 mb-1.5 text-sm font-semibold tracking-wide uppercase"
        >
          {fillTemplate(text, textBlank)}
        </h6>
      ),
    );
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const bullet = BULLET.exec(line);
    const atBlockStart = opensBlock;
    opensBlock = false;
    if (!line) {
      flush();
      opensBlock = true;
    } else if (line.startsWith('# ')) {
      heading(line.slice(2));
      opensBlock = true;
    } else if (bullet) {
      bullets.push(
        <li key={i} className="pl-1 leading-10">
          {fillTemplate(line.slice(bullet[0].length), textBlank)}
        </li>,
      );
    } else if (isBareHeading(line, atBlockStart, lines[i + 1])) {
      heading(line);
      opensBlock = true;
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
            ? 'border-border mx-auto max-w-xl rounded-xl border p-5'
            : 'px-2.5 py-1'
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
          <div className="leading-10">
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
      <p className="mb-3 leading-10">
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
                    className="border-border bg-surface-secondary border px-3 py-2 text-left font-semibold"
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
                  <td key={c} className="border-border border px-3 py-2">
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
