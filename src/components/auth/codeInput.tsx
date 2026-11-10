'use client';

import { InputOTP, Label, REGEXP_ONLY_DIGITS } from '@heroui/react';
import { useId } from 'react';

import { CODE_LENGTH } from '@/lib/auth/constants';

type CodeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  isInvalid?: boolean;
};

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, i) => i);
const HALF = CODE_LENGTH / 2;

export default function CodeInput({
  label,
  value,
  onChange,
  onComplete,
  isInvalid,
}: CodeInputProps) {
  const id = useId();

  return (
    <div className="flex flex-col items-center gap-2">
      <Label id={id}>{label}</Label>
      <InputOTP
        aria-labelledby={id}
        className="justify-center"
        name="code"
        maxLength={CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        autoComplete="one-time-code"
        value={value}
        onChange={onChange}
        onComplete={onComplete}
        isInvalid={isInvalid}
      >
        <InputOTP.Group>
          {SLOTS.slice(0, HALF).map((i) => (
            <InputOTP.Slot key={i} index={i} />
          ))}
        </InputOTP.Group>
        <InputOTP.Separator />
        <InputOTP.Group>
          {SLOTS.slice(HALF).map((i) => (
            <InputOTP.Slot key={i} index={i} />
          ))}
        </InputOTP.Group>
      </InputOTP>
    </div>
  );
}
