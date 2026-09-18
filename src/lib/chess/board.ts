import type {
  CastlingRights,
  Color,
  GameState,
  Move,
  Piece,
  PieceType,
  Square,
} from "@/types/chess";

export const FILES = "abcdefgh";

export function fileOf(sq: Square): number {
  return sq % 8;
}

export function rankOf(sq: Square): number {
  return 7 - Math.floor(sq / 8);
}

export function makeSquare(file: number, rank: number): Square {
  return (7 - rank) * 8 + file;
}

export function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function squareName(sq: Square): string {
  return FILES[fileOf(sq)] + String(rankOf(sq) + 1);
}

export function parseSquare(name: string): Square | null {
  if (name.length !== 2) return null;
  const file = FILES.indexOf(name[0]);
  const rank = name.charCodeAt(1) - 49;
  if (!inBounds(file, rank)) return null;
  return makeSquare(file, rank);
}

export function pieceAt(state: GameState, sq: Square): Piece | null {
  return state.board[sq];
}

export function kingSquare(state: GameState, color: Color): Square {
  for (let sq = 0; sq < 64; sq++) {
    const p = state.board[sq];
    if (p && p.color === color && p.type === "k") return sq;
  }
  return -1;
}

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

const BACK_RANK: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];

export function initialState(): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null);
  for (let file = 0; file < 8; file++) {
    board[makeSquare(file, 7)] = { color: "b", type: BACK_RANK[file] };
    board[makeSquare(file, 6)] = { color: "b", type: "p" };
    board[makeSquare(file, 1)] = { color: "w", type: "p" };
    board[makeSquare(file, 0)] = { color: "w", type: BACK_RANK[file] };
  }
  return {
    board,
    turn: "w",
    castling: { wk: true, wq: true, bk: true, bq: true },
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    history: [],
  };
}

/** Applies a move, returning a NEW state. Does not record SAN (caller appends history). */
export function applyMove(state: GameState, move: Move): GameState {
  const board = state.board.slice();
  const castling: CastlingRights = { ...state.castling };
  const moving = move.piece;

  board[move.from] = null;

  // En passant capture: remove the pawn behind the destination square.
  if (move.isEnPassant) {
    const capturedSq = makeSquare(fileOf(move.to), rankOf(move.from));
    board[capturedSq] = null;
  }

  const placed: Piece = move.promotion
    ? { color: moving.color, type: move.promotion }
    : moving;
  board[move.to] = placed;

  // Castling: relocate the rook.
  if (move.isCastleKingside) {
    const rank = rankOf(move.from);
    const rookFrom = makeSquare(7, rank);
    const rookTo = makeSquare(5, rank);
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  } else if (move.isCastleQueenside) {
    const rank = rankOf(move.from);
    const rookFrom = makeSquare(0, rank);
    const rookTo = makeSquare(3, rank);
    board[rookTo] = board[rookFrom];
    board[rookFrom] = null;
  }

  // Update castling rights.
  if (moving.type === "k") {
    if (moving.color === "w") {
      castling.wk = false;
      castling.wq = false;
    } else {
      castling.bk = false;
      castling.bq = false;
    }
  }
  const touchRook = (sq: Square) => {
    if (sq === makeSquare(0, 0)) castling.wq = false;
    else if (sq === makeSquare(7, 0)) castling.wk = false;
    else if (sq === makeSquare(0, 7)) castling.bq = false;
    else if (sq === makeSquare(7, 7)) castling.bk = false;
  };
  touchRook(move.from);
  if (move.captured) touchRook(move.to);

  const enPassant = move.isDoublePush
    ? makeSquare(fileOf(move.from), (rankOf(move.from) + rankOf(move.to)) / 2)
    : null;

  const isCaptureOrPawn = move.captured !== undefined || moving.type === "p";

  return {
    board,
    turn: opposite(state.turn),
    castling,
    enPassant,
    halfmoveClock: isCaptureOrPawn ? 0 : state.halfmoveClock + 1,
    fullmoveNumber: state.turn === "b" ? state.fullmoveNumber + 1 : state.fullmoveNumber,
    history: state.history,
  };
}

/** applyMove + record the SAN history entry. */
export function applyMoveWithHistory(state: GameState, move: Move, san: string): GameState {
  const next = applyMove(state, move);
  return { ...next, history: [...state.history, { move, san }] };
}
