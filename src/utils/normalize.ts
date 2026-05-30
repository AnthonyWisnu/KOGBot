export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()[\]{}'"`~_\-]/g, '')
    .replace(/\s+/g, ' ');
}
