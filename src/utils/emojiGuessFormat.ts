import type { EmojiGuessPayload } from '../types/emojiGuess.js';

export function formatEmojiGuessQuestion(payload: EmojiGuessPayload): string {
  return [
    'Tebak Emoji',
    '',
    payload.emoji,
    '',
    'Jawabannya apa?',
  ].join('\n');
}

export function formatEmojiGuessAnswer(payload: EmojiGuessPayload): string {
  return payload.answer;
}
