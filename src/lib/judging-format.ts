export function formatScoreValue(value: number | null) {
  return value === null ? "empty" : value.toFixed(1);
}

export function formatTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export function formatSaveAge(updatedAt: string | null, nowMs = Date.now()) {
  if (!updatedAt) return "Current version saved";
  const minutes = Math.floor((nowMs - new Date(updatedAt).getTime()) / 60_000);
  if (minutes < 1) return "Current version saved";
  if (minutes === 1) return "Saved 1 minute ago";
  return `Saved ${minutes} minutes ago`;
}
