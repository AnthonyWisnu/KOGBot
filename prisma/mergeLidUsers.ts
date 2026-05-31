import { prisma } from '../src/database/prisma.js';
import { mergeLegacyLidUserRecords } from '../src/services/userIdentity.service.js';

async function main(): Promise<void> {
  const mappings = process.argv.slice(2).map(parseMapping);

  for (const mapping of mappings) {
    await mergeLegacyLidUserRecords(mapping);
  }

  const remainingLidJids = await findRemainingLidJids();

  if (remainingLidJids.length === 0) {
    console.log('Tidak ada record @lid tersisa.');
    return;
  }

  console.log('Record @lid yang belum dapat di-resolve:');

  for (const lidJid of remainingLidJids) {
    console.log(`- ${lidJid}`);
  }

  console.log('');
  console.log('Jalankan bot agar metadata grup melakukan merge otomatis, atau gunakan:');
  console.log('npm run jid:merge -- "123456@lid=628123456789@s.whatsapp.net"');
}

function parseMapping(value: string): { lidJid: string; phoneJid: string } {
  const [lidJid, phoneJid] = value.split('=');

  if (!lidJid?.endsWith('@lid') || !phoneJid) {
    throw new Error(`Mapping tidak valid: ${value}`);
  }

  return {
    lidJid,
    phoneJid,
  };
}

async function findRemainingLidJids(): Promise<string[]> {
  const [scores, limits, stats, users, games] = await Promise.all([
    prisma.weeklyScore.findMany({
      where: {
        userJid: {
          endsWith: '@lid',
        },
      },
      select: {
        userJid: true,
      },
    }),
    prisma.userDownloadLimit.findMany({
      where: {
        userJid: {
          endsWith: '@lid',
        },
      },
      select: {
        userJid: true,
      },
    }),
    prisma.userStats.findMany({
      where: {
        userJid: {
          endsWith: '@lid',
        },
      },
      select: {
        userJid: true,
      },
    }),
    prisma.user.findMany({
      where: {
        jid: {
          endsWith: '@lid',
        },
      },
      select: {
        jid: true,
      },
    }),
    prisma.activeGame.findMany({
      where: {
        startedBy: {
          endsWith: '@lid',
        },
      },
      select: {
        startedBy: true,
      },
    }),
  ]);

  return [
    ...new Set([
      ...scores.map((score) => score.userJid),
      ...limits.map((limit) => limit.userJid),
      ...stats.map((userStats) => userStats.userJid),
      ...users.map((user) => user.jid),
      ...games.map((game) => game.startedBy),
    ]),
  ];
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
