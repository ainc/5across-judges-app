import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export async function saltAndHashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const hashBuffer = Buffer.from(hash, "hex");
  const derived = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, derived);
}
