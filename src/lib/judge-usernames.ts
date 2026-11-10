export function usernameKey(username: string) {
  return username.trim().toLowerCase();
}

export function takenUsernameMessage(options: {
  username: string;
  savedUsername?: string | null;
  reusedUsername?: string | null;
  otherUsernames: string[];
  reservedUsernames: string[];
}) {
  const key = usernameKey(options.username);
  if (!key) return null;
  if (options.otherUsernames.some((name) => usernameKey(name) === key)) {
    return "This username is already in use.";
  }
  const savedKey = usernameKey(options.savedUsername ?? "");
  if (savedKey && savedKey === key) return null;
  const reusedKey = usernameKey(options.reusedUsername ?? "");
  if (reusedKey && reusedKey === key) return null;
  if (options.reservedUsernames.some((name) => usernameKey(name) === key)) {
    return "This username is already in use.";
  }
  return null;
}
