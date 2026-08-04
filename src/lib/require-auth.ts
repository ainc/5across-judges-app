import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}

export async function requireAdmin() {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult;
  }

  if (authResult.session?.user.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return authResult;
}

export async function requireJudge() {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult;
  }

  if (authResult.session?.user.role !== "JUDGE" || !authResult.session.user.judgeId) {
    return {
      session: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return authResult;
}

/** Judges access their own scores; admins may access any judge. */
export async function requireScorer() {
  const authResult = await requireAuth();
  if (authResult.response) {
    return authResult;
  }

  const role = authResult.session?.user.role;
  if (role === "ADMIN") {
    return authResult;
  }

  if (role === "JUDGE" && authResult.session?.user.judgeId) {
    return authResult;
  }

  return {
    session: null,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
