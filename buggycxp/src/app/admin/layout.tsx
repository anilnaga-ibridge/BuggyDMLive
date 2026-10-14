import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CxpWorkflowBar from "@/components/CxpWorkflowBar";
import { getSession } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar adminName={session.name} adminEmail={session.email} />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#080b11]">
        <CxpWorkflowBar />
        {children}
      </main>
    </div>
  );
}
