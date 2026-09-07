import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Resolves the acting user's id from the verified NextAuth session —
 * never from a client-supplied body/query field. Every mutating route
 * should call this instead of reading `userId`/`currentUserId` off the
 * request, so "who is doing this" is always proven server-side rather
 * than merely asserted by the caller.
 *
 * @returns {Promise<string|null>} the session user's id, or null if unauthenticated
 */
export async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export function unauthorizedResponse(NextResponse) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
