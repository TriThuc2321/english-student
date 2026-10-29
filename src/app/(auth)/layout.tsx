type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      {children}
    </div>
  );
}
