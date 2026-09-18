import type { Color, GameState, GameStatus, Move, Square } from "@/types/chess";
import { applyMove, fileOf, inBounds, kingSquare, makeSquare, rankOf } from "./board";
import { pseudoLegalMoves, pseudoLegalMovesFrom } from "./moves";

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

export function isSquareAttacked(state: GameState, sq: Square, byColor: Color): boolean {
  const file = fileOf(sq);
  const rank = rankOf(sq);

  // Pawns: a white pawn attacks one rank up; black one rank down.
  const pawnDir = byColor === "w" ? -1 : 1;
  for (const df of [-1, 1]) {
    const pf = file + df;
    const pr = rank + pawnDir;
    if (inBounds(pf, pr)) {
      const p = state.board[makeSquare(pf, pr)];
      if (p && p.color === byColor && p.type === "p") return true;
    }
  }

  // Knights
  for (const [df, dr] of KNIGHT_OFFSETS) {
    const tf = file + df;
    const tr = rank + dr;
    if (!inBounds(tf, tr)) continue;
    const p = state.board[makeSquare(tf, tr)];
    if (p && p.color === byColor && p.type === "n") return true;
  }

  // King
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const tf = file + df;
      const tr = rank + dr;
      if (!inBounds(tf, tr)) continue;
      const p = state.board[makeSquare(tf, tr)];
      if (p && p.color === byColor && p.type === "k") return true;
    }
  }

  // Sliding: diagonals (b/q) and straights (r/q)
  const rays: { dirs: [number, number][]; types: string[] }[] = [
    { dirs: [[1, 1], [1, -1], [-1, 1], [-1, -1]], types: ["b", "q"] },
    { dirs: [[1, 0], [-1, 0], [0, 1], [0, -1]], types: ["r", "q"] },
  ];
  for (const { dirs, types } of rays) {
    for (const [df, dr] of dirs) {
      let tf = file + df;
      let tr = rank + dr;
      while (inBounds(tf, tr)) {
        const p = state.board[makeSquare(tf, tr)];
        if (p) {
          if (p.color === byColor && types.includes(p.type)) return true;
          break;
        }
        tf += df;
        tr += dr;
      }
    }
  }

  return false;
}

export function isInCheck(state: GameState, color: Color): boolean {
  const king = kingSquare(state, color);
  if (king < 0) return false;
  return isSquareAttacked(state, king, color === "w" ? "b" : "w");
}

function leavesKingSafe(state: GameState, move: Move): boolean {
  const next = applyMove(state, move);
  return !isInCheck(next, move.piece.color);
}

/** Fully legal moves for the side to move, optionally restricted to one square. */
export function legalMoves(state: GameState, square?: Square): Move[] {
  const candidates = square !== undefined
    ? (() => {
        const piece = state.board[square];
        return piece && piece.color === state.turn ? pseudoLegalMovesFrom(state, square) : [];
      })()
    : pseudoLegalMoves(state);

  return candidates.filter((move) => {
    // Castling: king may not castle out of, through, or into check.
    if (move.isCastleKingside || move.isCastleQueenside) {
      const rank = rankOf(move.from);
      const enemy = move.piece.color === "w" ? "b" : "w";
      if (isSquareAttacked(state, move.from, enemy)) return false;
      const transit = move.isCastleKingside
        ? [makeSquare(5, rank), makeSquare(6, rank)]
        : [makeSquare(3, rank), makeSquare(2, rank)];
      if (transit.some((sq) => isSquareAttacked(state, sq, enemy))) return false;
      return true; // destination covered by transit check; applyMove keeps king safe
    }
    return leavesKingSafe(state, move);
  });
}

function insufficientMaterial(state: GameState): boolean {
  const rest = state.board.filter((p): p is NonNullable<typeof p> => p !== null && p.type !== "k");
  if (rest.length === 0) return true;
  if (rest.length === 1 && (rest[0].type === "b" || rest[0].type === "n")) return true;
  return false;
}

export function getGameStatus(state: GameState): GameStatus {
  const moves = legalMoves(state);
  const inCheck = isInCheck(state, state.turn);

  if (moves.length === 0) {
    return inCheck ? "checkmate" : "stalemate";
  }
  if (state.halfmoveClock >= 100) return "draw";
  if (insufficientMaterial(state)) return "draw";
  return inCheck ? "check" : "playing";
}
