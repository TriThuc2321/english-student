import type { QuestionView } from '@/lib/exam/group-view';

import { useExamGroup } from '../context';
import { ExamAudio, ExamImage, QuestionAudioButton } from '../media';

export const GroupAudio = () => {
  const { group } = useExamGroup();
  return group.audio ? <ExamAudio media={group.audio} /> : null;
};

export const GroupImage = ({ className }: { className?: string }) => {
  const { group } = useExamGroup();
  return group.image ? (
    <ExamImage media={group.image} className={className} />
  ) : null;
};

// A question's own clip wins; otherwise a start offset seeks into the group's audio
export const QuestionAudio = ({ q }: { q: QuestionView }) => {
  const { group } = useExamGroup();
  const media = q.audio ?? (q.audioStartMs != null ? group.audio : null);
  return media ? (
    <div className="mb-2">
      <QuestionAudioButton media={media} startMs={q.audioStartMs ?? 0} />
    </div>
  ) : null;
};

export const QuestionImage = ({ q }: { q: QuestionView }) =>
  q.image ? <ExamImage media={q.image} className="mb-2 max-w-sm" /> : null;
