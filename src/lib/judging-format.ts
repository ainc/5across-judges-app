export function firstPhrase(name: string) {
  const parts = name.split("/").map((part) => part.trim()).filter(Boolean);
  if (parts[0]?.toLowerCase() === "quality of overall pitch") {
    return parts[parts.length - 1] ?? name;
  }
  return parts[0] || name;
}

export function formatScoreValue(value: number | null) {
  return value === null ? "empty" : value.toFixed(1);
}

export function formatTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

function minutesSince(value: string, nowMs: number) {
  return Math.floor((nowMs - new Date(value).getTime()) / 60_000);
}

function hoursSince(minutes: number) {
  return Math.floor(minutes / 60);
}

function daysSince(minutes: number) {
  return Math.floor(minutes / (60 * 24));
}

function formatAgeSuffix(minutes: number) {
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  if (minutes < 60 * 24) {
    const hours = hoursSince(minutes);
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  const days = daysSince(minutes);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatSaveAge(updatedAt: string | null, nowMs = Date.now()) {
  if (!updatedAt) return "Current version saved";
  const minutes = minutesSince(updatedAt, nowMs);
  if (minutes < 1) return "Current version saved";
  return `Saved ${formatAgeSuffix(minutes)}`;
}

export function formatFinalSubmitAge(submittedAt: string | null, nowMs = Date.now()) {
  if (!submittedAt) return "Final scores submitted";
  const minutes = minutesSince(submittedAt, nowMs);
  if (minutes < 1) return "Final scores submitted just now";
  return `Final scores submitted ${formatAgeSuffix(minutes)}`;
}
