import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { logger } from '../utils/logger.js';

export const quoteCategories = [
  'motivasi',
  'lucu',
  'islami',
  'cinta',
  'galau',
] as const;

export type QuoteCategory = typeof quoteCategories[number];

export type Quote = {
  text: string;
  author: string;
};

export type QuoteResult =
  | {
      status: 'success';
      category?: QuoteCategory;
      quote: Quote;
    }
  | {
      status: 'invalid_category';
    }
  | {
      status: 'unavailable';
    };

type QuoteEntry = Quote & {
  category: QuoteCategory;
  identifier: string;
};

const quoteFilePath = path.join(process.cwd(), 'quotes.json');
const lastQuoteByGroup = new Map<string, string>();

export async function getRandomQuote(params: {
  groupJid: string;
  category?: string;
}): Promise<QuoteResult> {
  const category = normalizeCategory(params.category);

  if (params.category && !category) {
    return {
      status: 'invalid_category',
    };
  }

  try {
    const entries = await loadQuoteEntries(category);

    if (entries.length === 0) {
      return {
        status: 'unavailable',
      };
    }

    const quote = pickQuote(params.groupJid, entries);

    return {
      status: 'success',
      category,
      quote: {
        text: quote.text,
        author: quote.author,
      },
    };
  } catch (error) {
    logger.error({ error, quoteFilePath }, 'Gagal mengambil data quote');

    return {
      status: 'unavailable',
    };
  }
}

export function clearQuoteMemory(): void {
  lastQuoteByGroup.clear();
}

function normalizeCategory(category: string | undefined): QuoteCategory | undefined {
  if (!category) {
    return undefined;
  }

  const normalizedCategory = category.trim().toLowerCase();

  return quoteCategories.find((item) => item === normalizedCategory);
}

async function loadQuoteEntries(category: QuoteCategory | undefined): Promise<QuoteEntry[]> {
  const rawFile = await readFile(quoteFilePath, 'utf8');
  const parsedData: unknown = JSON.parse(rawFile);

  if (!isRecord(parsedData)) {
    return [];
  }

  const categories = category ? [category] : quoteCategories;

  return categories.flatMap((item) => {
    const rawQuotes = parsedData[item];

    if (!Array.isArray(rawQuotes)) {
      return [];
    }

    return rawQuotes
      .map((rawQuote) => normalizeQuote(item, rawQuote))
      .filter((quote): quote is QuoteEntry => Boolean(quote));
  });
}

function normalizeQuote(category: QuoteCategory, rawQuote: unknown): QuoteEntry | undefined {
  if (typeof rawQuote === 'string') {
    const text = rawQuote.trim();

    if (!text) {
      return undefined;
    }

    return createQuoteEntry(category, text, 'Anonim');
  }

  if (!isRecord(rawQuote)) {
    return undefined;
  }

  const text = typeof rawQuote.text === 'string' ? rawQuote.text.trim() : '';
  const author = typeof rawQuote.author === 'string' && rawQuote.author.trim()
    ? rawQuote.author.trim()
    : 'Anonim';

  if (!text) {
    return undefined;
  }

  return createQuoteEntry(category, text, author);
}

function createQuoteEntry(
  category: QuoteCategory,
  text: string,
  author: string,
): QuoteEntry {
  return {
    category,
    text,
    author,
    identifier: `${category}:${text}:${author}`,
  };
}

function pickQuote(groupJid: string, entries: QuoteEntry[]): QuoteEntry {
  const lastIdentifier = lastQuoteByGroup.get(groupJid);
  const candidates = entries.length > 1
    ? entries.filter((entry) => entry.identifier !== lastIdentifier)
    : entries;
  const fallbackQuote = entries[0];

  if (!fallbackQuote) {
    throw new Error('Tidak ada quote yang tersedia');
  }

  const quote = candidates[Math.floor(Math.random() * candidates.length)] ?? fallbackQuote;

  lastQuoteByGroup.set(groupJid, quote.identifier);

  return quote;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
