import { AuthGuard } from "@/features/auth/components/auth-guard";
import { MainShell } from "@/components/layout/main-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MainShell>{children}</MainShell>
    </AuthGuard>
  );
}
