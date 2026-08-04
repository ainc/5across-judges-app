import "next-auth";

type UserRole = "ADMIN" | "JUDGE";

declare module "next-auth" {
  interface User {
    role: UserRole;
    judgeId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      role: UserRole;
      judgeId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    judgeId?: string | null;
  }
}
