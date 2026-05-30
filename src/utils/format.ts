export function formatMention(jid: string): string {
  const number = jid.split('@')[0]?.split(':')[0];

  return number ? `@${number}` : '@user';
}
