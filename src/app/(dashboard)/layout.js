import { auth } from "@clerk/nextjs/server";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const dynamic = "force-dynamic";

export default async function Layout({ children }) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
