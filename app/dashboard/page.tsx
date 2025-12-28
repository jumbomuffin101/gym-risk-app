import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Logged in as {(session.user?.email ?? "unknown")}
      </p>
    </div>
  );
}
