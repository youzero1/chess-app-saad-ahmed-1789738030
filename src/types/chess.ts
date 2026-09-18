export type Color = "w" | "b";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  color: Color;
  type: PieceType;
}

/**
 * Board squares are 0-63 indices. Index 0 = a8, index 63 = h1.
 * file = sq % 8 (0 = a-file), rank = 7 - floor(sq / 8) (0 = rank 1).
 */
export type Square = number;

export interface Move {
  from: Square;
  to: Square;
  piece: Piece;
  captured?: Piece;
  /** Piece type to promote to (defaults to queen when omitted at apply time). */
  promotion?: PieceType;
  isCastleKingside?: boolean;
  isCastleQueenside?: boolean;
  isEnPassant?: boolean;
  isDoublePush?: boolean;
}

export type GameStatus = "playing" | "check" | "checkmate" | "stalemate" | "draw";

export interface CastlingRights {
  wk: boolean;
  wq: boolean;
  bk: boolean;
  bq: boolean;
}

export interface HistoryEntry {
  move: Move;
  san: string;
}

export interface GameState {
  /** 64 entries, index 0 = a8 ... index 63 = h1. null = empty. */
  board: (Piece | null)[];
  turn: Color;
  castling: CastlingRights;
  /** Square index behind a pawn that just double-pushed, else null. */
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  history: HistoryEntry[];
}
