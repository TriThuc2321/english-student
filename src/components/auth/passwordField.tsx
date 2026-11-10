'use client';

import {
  Description,
  FieldError,
  Input,
  Label,
  TextField,
  type TextFieldProps,
} from '@heroui/react';
import { useTranslations } from 'next-intl';

import { PASSWORD_RULE } from '@/lib/auth/constants';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'children'> & {
  label: string;
  hint?: string;
};

export default function PasswordField({
  label,
  hint,
  validate,
  ...props
}: PasswordFieldProps) {
  const t = useTranslations('auth.formErrors');

  return (
    <TextField
      isRequired
      type="password"
      autoComplete="new-password"
      maxLength={PASSWORD_RULE.maxLength}
      className="flex flex-col gap-2"
      validate={(value) =>
        value && value.length < PASSWORD_RULE.minLength
          ? t('passwordLength', PASSWORD_RULE)
          : validate?.(value)
      }
      {...props}
    >
      <Label>{label}</Label>
      <Input className="h-11 text-base" />
      {hint && <Description>{hint}</Description>}
      <FieldError />
    </TextField>
  );
}
