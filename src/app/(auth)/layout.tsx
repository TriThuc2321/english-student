type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="bg-background relative isolate flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)] [background-size:44px_44px] opacity-60"
      />
      <div
        aria-hidden
        className="bg-brand-navy/10 absolute -top-40 left-1/2 -z-10 h-80 w-[640px] -translate-x-1/2 rounded-full blur-3xl"
      />
      {children}
    </div>
  );
}
