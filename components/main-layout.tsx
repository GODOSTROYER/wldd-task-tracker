"use client";

import { useUser } from "@/lib/contexts/AuthContext";
import { Sidebar } from "@/components/sidebar";
import { usePathname } from "next/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  
  // Don't show sidebar on login/register pages
  // Also wait for auth check? For now assuming if signed in, show layout.
  // Don't show sidebar on login/register/landing pages
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/signup" || pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Always show layout for app pages. Auth protection is handled by the pages themselves or middleware.
  // This prevents the sidebar from disappearing during initial load or if auth is slightly delayed.

  return (
    <div className="flex h-screen bg-[#F8F9FD] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
