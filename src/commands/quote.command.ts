import {
  getRandomQuote,
  quoteCategories,
} from '../services/quote.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

const categoryListText = quoteCategories.join(', ');

export async function handleQuoteCommand(context: CommandContext): Promise<void> {
  try {
    const category = context.command.args[0]?.toLowerCase();
    const result = await getRandomQuote({
      groupJid: context.chatJid,
      category,
    });

    if (result.status === 'invalid_category') {
      await context.reply(
        [
          'Kategori tidak tersedia.',
          `Kategori yang ada: ${categoryListText}`,
        ].join('\n'),
      );
      return;
    }

    if (result.status === 'unavailable') {
      await context.reply('Maaf, data quote sedang tidak tersedia.');
      return;
    }

    await context.reply(
      [
        result.category
          ? `\u{1F4AC} Quote ${formatCategoryTitle(result.category)}`
          : '\u{1F4AC} Quote of the Day',
        '',
        `"${result.quote.text}"`,
        '',
        `— ${result.quote.author}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command quote',
    );

    await context.reply('Maaf, data quote sedang tidak tersedia.');
  }
}

function formatCategoryTitle(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}
