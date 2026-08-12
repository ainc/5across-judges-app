import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/auth-users";

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth");
}

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-only-auth-secret-change-in-production" : undefined);

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const authConfig = {
  secret: authSecret,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.judgeId = user.judgeId ?? null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole | undefined) ?? "JUDGE";
        session.user.judgeId = (token.judgeId as string | null | undefined) ?? null;
      }

      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;
      const role = auth?.user?.role;
      const isLoggedIn = !!auth?.user;
      const isApiRoute = pathname.startsWith("/api/");

      if (isPublicPath(pathname)) {
        return true;
      }

      // API clients expect JSON. Redirecting them to /login returns HTML and
      // breaks fetch(...).json() (and admin/results polling).
      if (!isLoggedIn) {
        if (isApiRoute) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        return false;
      }

      if (isAdminPath(pathname)) {
        if (role === "ADMIN") return true;
        if (isApiRoute) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        return false;
      }

      if (pathname.startsWith("/api/scores")) {
        if (role === "JUDGE" || role === "ADMIN") return true;
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
