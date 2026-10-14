import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SearchShortcut from "@/components/SearchShortcut";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-[#070a13] overflow-hidden">
      <Sidebar adminName={session.name} adminEmail={session.email} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#080b11]">
        {children}
      </main>
      <SearchShortcut />
    </div>
  );
}
