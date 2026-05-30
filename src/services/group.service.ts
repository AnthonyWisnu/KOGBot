import type { Group } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';

export async function ensureGroup(groupJid: string, name?: string): Promise<Group> {
  try {
    return await prisma.group.upsert({
      where: {
        jid: groupJid,
      },
      create: {
        jid: groupJid,
        name,
      },
      update: {
        ...(name ? { name } : {}),
      },
    });
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal memastikan data grup');
    throw error;
  }
}

export async function isGroupApproved(groupJid: string): Promise<boolean> {
  try {
    const group = await prisma.group.findUnique({
      where: {
        jid: groupJid,
      },
      select: {
        isApproved: true,
      },
    });

    return group?.isApproved ?? false;
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal memeriksa whitelist grup');
    throw error;
  }
}

export async function approveGroup(groupJid: string, name?: string): Promise<Group> {
  try {
    return await prisma.group.upsert({
      where: {
        jid: groupJid,
      },
      create: {
        jid: groupJid,
        name,
        isApproved: true,
      },
      update: {
        ...(name ? { name } : {}),
        isApproved: true,
      },
    });
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal approve grup');
    throw error;
  }
}

export async function removeGroup(groupJid: string, name?: string): Promise<Group> {
  try {
    return await prisma.group.upsert({
      where: {
        jid: groupJid,
      },
      create: {
        jid: groupJid,
        name,
        isApproved: false,
      },
      update: {
        ...(name ? { name } : {}),
        isApproved: false,
      },
    });
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal remove grup dari whitelist');
    throw error;
  }
}

export async function listApprovedGroups(): Promise<Group[]> {
  try {
    return await prisma.group.findMany({
      where: {
        isApproved: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Gagal mengambil daftar grup approved');
    throw error;
  }
}
