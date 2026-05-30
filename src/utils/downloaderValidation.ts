const tiktokHosts = [
  'tiktok.com',
  'www.tiktok.com',
  'm.tiktok.com',
  'vm.tiktok.com',
  'vt.tiktok.com',
];

const instagramHosts = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
];

export function isTikTokUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return tiktokHosts.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function isInstagramReelUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    return instagramHosts.includes(hostname)
      && (pathname.startsWith('/reel/') || pathname.startsWith('/reels/'));
  } catch {
    return false;
  }
}

export function assertTikTokUrl(value: string): void {
  if (!isTikTokUrl(value)) {
    throw new Error('Link TikTok tidak valid');
  }
}

export function assertInstagramReelUrl(value: string): void {
  if (!isInstagramReelUrl(value)) {
    throw new Error('Link Instagram Reels tidak valid');
  }
}
