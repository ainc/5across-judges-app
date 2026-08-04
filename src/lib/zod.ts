import { object, string } from "zod";

export const signInSchema = object({
  username: string({ error: "Username is required" }).min(1, "Username is required"),
  password: string({ error: "Password is required" }).min(1, "Password is required"),
});
