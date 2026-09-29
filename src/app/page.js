import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/modules/auth/auth.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const clerkUser = await currentUser();
  const dbUser = await getCurrentUser(userId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-6">
      <header className="flex justify-between items-center pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold">WorkDashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            {clerkUser?.emailAddresses?.[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </header>

      <main className="mt-8 space-y-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-sm text-emerald-400 font-medium">
            ✅ Clerk Authentication is working.
          </p>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Clerk ID: {userId}
          </p>
        </div>

        {dbUser ? (
          <div className="p-4 bg-zinc-900 border border-emerald-900/40 rounded-lg">
            <p className="text-sm text-emerald-400 font-medium">
              ✅ Database Profile Synced (Just-In-Time Provisioned)
            </p>
            <div className="mt-2 text-xs font-mono space-y-1 text-zinc-300">
              <p><span className="text-zinc-500">DB User ID:</span> {dbUser.id}</p>
              <p><span className="text-zinc-500">Full Name:</span> {dbUser.full_name}</p>
              <p><span className="text-zinc-500">Email:</span> {dbUser.email}</p>
              <p><span className="text-zinc-500">Role:</span> {dbUser.role_title} ({dbUser.system_role})</p>
              <p><span className="text-zinc-500">Capacity:</span> {dbUser.weekly_capacity_hours} hrs/week</p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900 border border-amber-900/40 rounded-lg">
            <p className="text-sm text-amber-400 font-medium">
              ⚠️ User not found in database yet. Refresh to auto-provision.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
