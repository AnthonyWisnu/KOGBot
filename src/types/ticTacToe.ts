export type TicTacToeMark = 'X' | 'O';
export type TicTacToeCell = TicTacToeMark | '';

export type TicTacToePayload = {
  playerX: string;
  playerO: string;
  turn: string;
  board: TicTacToeCell[];
};
