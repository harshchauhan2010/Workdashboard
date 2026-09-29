import { currentUser } from "@clerk/nextjs/server";
import { findUserByClerkId } from "./auth.repository.js";
import { ensureUserFromClerk } from "@/modules/users/users.service.js";
import * as usersRepo from "@/modules/users/users.repository.js";

// Fetch current user profile; auto-creates if first login from Clerk, auto-syncs on profile change
export async function getCurrentUser(clerkId) {
  if (!clerkId) {
    throw new Error("Clerk ID is required");
  }

  // 1. Fetch Clerk user profile if available in request context
  let clerkUser = null;
  try {
    clerkUser = await currentUser();
  } catch (err) {
    // Context may not have currentUser (e.g. testing)
  }

  // 2. Check if user already exists in DB
  let user = await findUserByClerkId(clerkId);

  if (user) {
    // If user exists, sync any name/email changes from Clerk into DB
    if (clerkUser) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || user.email;
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || user.full_name;

      if (user.full_name !== fullName || user.email !== email) {
        user = await usersRepo.updateUser(user.id, {
          full_name: fullName,
          email: email,
        });
      }
    }
    return user;
  }

  // 3. If first login, auto-create DB row from Clerk profile
  try {
    if (clerkUser) {
      const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
      const fullName =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        email.split("@")[0] ||
        "Team Member";
      const rolePreference =
        clerkUser.unsafeMetadata?.role || clerkUser.publicMetadata?.role;

      user = await ensureUserFromClerk({
        clerkId,
        email,
        fullName,
        rolePreference,
      });
    }
  } catch (err) {
    console.error("[auth.service.getCurrentUser] Auto-provisioning error:", err);
  }

  return user;
}

