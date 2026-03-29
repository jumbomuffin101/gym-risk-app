export function formatSessionStartedAt(startedAt: string) {
  return new Date(startedAt).toLocaleString();
}
