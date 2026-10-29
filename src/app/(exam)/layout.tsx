import { Toast } from '@heroui/react';

export default function ExamLayout({ children }: LayoutProps<'/'>) {
  return (
    <main className="h-dvh">
      {children}
      <Toast.Provider placement="top end" />
    </main>
  );
}
