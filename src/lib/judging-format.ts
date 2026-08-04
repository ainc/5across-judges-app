export function formatScoreValue(value: number | null) {
  return value === null ? "empty" : value.toFixed(1);
}

export function formatTimestamp(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}
