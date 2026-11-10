'use client';

import { Button, Form } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';

import { verifyEmail } from '@/lib/auth/actions';
import { CODE_LENGTH } from '@/lib/auth/constants';

import CodeInput from './codeInput';
import FormErrorAlert from './formErrorAlert';

export default function VerifyEmailForm({ email }: { email: string }) {
  const t = useTranslations('auth.verify');
  const [state, formAction, pending] = useActionState(verifyEmail, undefined);
  const [code, setCode] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <FormErrorAlert error={state?.error} />
      <input type="hidden" name="email" value={email} />

      <CodeInput
        label={t('code')}
        value={code}
        onChange={setCode}
        onComplete={() => formRef.current?.requestSubmit()}
        isInvalid={Boolean(state?.error)}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        isPending={pending}
        isDisabled={code.length !== CODE_LENGTH}
      >
        {t('submit')}
      </Button>
    </Form>
  );
}
