import { cn, linkVariants } from '@heroui/react';
import Link from 'next/link';

type AuthLinkProps = React.ComponentProps<typeof Link>;

export default function AuthLink({ className, ...props }: AuthLinkProps) {
  return (
    <Link
      className={cn(
        linkVariants().base(),
        'text-accent font-semibold',
        className,
      )}
      {...props}
    />
  );
}
