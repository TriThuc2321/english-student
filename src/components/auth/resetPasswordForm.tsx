'use client';

import { Button, Form } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';

import { resetPassword } from '@/lib/auth/actions';
import { CODE_LENGTH } from '@/lib/auth/constants';
import { AuthFormError } from '@/lib/auth/form-state';

import CodeInput from './codeInput';
import FormErrorAlert from './formErrorAlert';
import PasswordField from './passwordField';

export default function ResetPasswordForm({ email }: { email: string }) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <FormErrorAlert error={state?.error} />
      <input type="hidden" name="email" value={email} />

      <CodeInput
        label={t('reset.code')}
        value={code}
        onChange={setCode}
        isInvalid={state?.error === AuthFormError.INVALID_CODE}
      />

      <PasswordField
        name="newPassword"
        label={t('reset.newPassword')}
        hint={t('passwordHint')}
        value={newPassword}
        onChange={setNewPassword}
      />

      <PasswordField
        name="confirmPassword"
        label={t('reset.confirmPassword')}
        value={confirmPassword}
        onChange={setConfirmPassword}
        validate={(value) =>
          value === newPassword ? null : t('formErrors.passwordMismatch')
        }
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        isPending={pending}
        isDisabled={code.length !== CODE_LENGTH}
      >
        {t('reset.submit')}
      </Button>
    </Form>
  );
}
