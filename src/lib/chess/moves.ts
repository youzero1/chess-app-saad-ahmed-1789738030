import type { GameState, Move, Piece, Square } from "@/types/chess";
import { fileOf, inBounds, makeSquare, rankOf } from "./board";

const KNIGHT_OFFSETS: [number, number][] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

const KING_OFFSETS: [number, number][] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];

const DIAGONAL: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const STRAIGHT: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function pushMove(moves: Move[], from: Square, to: Square, piece: Piece, state: GameState, extra?: Partial<Move>): void {
  const captured = state.board[to] ?? undefined;
  moves.push({ from, to, piece, captured, ...extra });
}

function pawnMoves(state: GameState, from: Square, piece: Piece, moves: Move[]): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  const dir = piece.color === "w" ? 1 : -1;
  const startRank = piece.color === "w" ? 1 : 6;
  const promoRank = piece.color === "w" ? 7 : 0;

  const addPawnMove = (to: Square, extra?: Partial<Move>) => {
    if (rankOf(to) === promoRank) {
      for (const promotion of ["q", "r", "b", "n"] as const) {
        pushMove(moves, from, to, piece, state, { ...extra, promotion });
      }
    } else {
      pushMove(moves, from, to, piece, state, extra);
    }
  };

  // Single push
  if (inBounds(file, rank + dir)) {
    const one = makeSquare(file, rank + dir);
    if (!state.board[one]) {
      addPawnMove(one);
      // Double push
      if (rank === startRank) {
        const two = makeSquare(file, rank + 2 * dir);
        if (!state.board[two]) {
          pushMove(moves, from, two, piece, state, { isDoublePush: true });
        }
      }
    }
  }

  // Captures (incl. en passant)
  for (const df of [-1, 1]) {
    const tf = file + df;
    const tr = rank + dir;
    if (!inBounds(tf, tr)) continue;
    const to = makeSquare(tf, tr);
    const target = state.board[to];
    if (target && target.color !== piece.color) {
      addPawnMove(to);
    } else if (state.enPassant === to) {
      const capturedSq = makeSquare(tf, rank);
      const captured = state.board[capturedSq];
      if (captured && captured.type === "p" && captured.color !== piece.color) {
        pushMove(moves, from, to, piece, state, { isEnPassant: true, captured });
      }
    }
  }
}

function slidingMoves(
  state: GameState,
  from: Square,
  piece: Piece,
  moves: Move[],
  directions: [number, number][],
): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  for (const [df, dr] of directions) {
    let tf = file + df;
    let tr = rank + dr;
    while (inBounds(tf, tr)) {
      const to = makeSquare(tf, tr);
      const target = state.board[to];
      if (!target) {
        pushMove(moves, from, to, piece, state);
      } else {
        if (target.color !== piece.color) pushMove(moves, from, to, piece, state);
        break;
      }
      tf += df;
      tr += dr;
    }
  }
}

function jumpMoves(
  state: GameState,
  from: Square,
  piece: Piece,
  moves: Move[],
  offsets: [number, number][],
): void {
  const file = fileOf(from);
  const rank = rankOf(from);
  for (const [df, dr] of offsets) {
    const tf = file + df;
    const tr = rank + dr;
    if (!inBounds(tf, tr)) continue;
    const to = makeSquare(tf, tr);
    const target = state.board[to];
    if (!target || target.color !== piece.color) {
      pushMove(moves, from, to, piece, state);
    }
  }
}

function castleMoves(state: GameState, from: Square, piece: Piece, moves: Move[]): void {
  const rank = rankOf(from);
  const homeRank = piece.color === "w" ? 0 : 7;
  if (rank !== homeRank || fileOf(from) !== 4) return;

  const rights = piece.color === "w"
    ? { k: state.castling.wk, q: state.castling.wq }
    : { k: state.castling.bk, q: state.castling.bq };

  const rookAt = (file: number): boolean => {
    const p = state.board[makeSquare(file, homeRank)];
    return !!p && p.type === "r" && p.color === piece.color;
  };
  const empty = (...files: number[]): boolean =>
    files.every((f) => !state.board[makeSquare(f, homeRank)]);

  // Attack checks are finalized in rules.ts (legalMoves filters king-through-check);
  // here we only require rights + empty squares + rook presence.
  if (rights.k && rookAt(7) && empty(5, 6)) {
    pushMove(moves, from, makeSquare(6, homeRank), piece, state, { isCastleKingside: true });
  }
  if (rights.q && rookAt(0) && empty(1, 2, 3)) {
    pushMove(moves, from, makeSquare(2, homeRank), piece, state, { isCastleQueenside: true });
  }
}

/** Pseudo-legal moves for the piece on `from` (ignores own-king safety). */
export function pseudoLegalMovesFrom(state: GameState, from: Square): Move[] {
  const piece = state.board[from];
  if (!piece) return [];
  const moves: Move[] = [];
  switch (piece.type) {
    case "p":
      pawnMoves(state, from, piece, moves);
      break;
    case "n":
      jumpMoves(state, from, piece, moves, KNIGHT_OFFSETS);
      break;
    case "b":
      slidingMoves(state, from, piece, moves, DIAGONAL);
      break;
    case "r":
      slidingMoves(state, from, piece, moves, STRAIGHT);
      break;
    case "q":
      slidingMoves(state, from, piece, moves, [...DIAGONAL, ...STRAIGHT]);
      break;
    case "k":
      jumpMoves(state, from, piece, moves, KING_OFFSETS);
      castleMoves(state, from, piece, moves);
      break;
  }
  return moves;
}

/** All pseudo-legal moves for the side to move. */
export function pseudoLegalMoves(state: GameState): Move[] {
  const moves: Move[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const piece = state.board[sq];
    if (piece && piece.color === state.turn) {
      moves.push(...pseudoLegalMovesFrom(state, sq));
    }
  }
  return moves;
}
