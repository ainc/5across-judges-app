import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { authConfig } from "@/auth.config";
import { getUserFromDb } from "@/lib/auth-users";
import { signInSchema } from "@/lib/zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { username, password } = await signInSchema.parseAsync(credentials);
          return getUserFromDb(username, password);
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
});
