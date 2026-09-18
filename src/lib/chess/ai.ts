import type { GameState, Move, PieceType } from "@/types/chess";
import { applyMove } from "./board";
import { getGameStatus, legalMoves } from "./rules";

const PIECE_VALUE: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function scoreMove(state: GameState, move: Move): number {
  let score = Math.random() * 0.5; // jitter for variety

  if (move.captured) {
    score += PIECE_VALUE[move.captured.type] * 10 - PIECE_VALUE[move.piece.type] * 0.1;
  }
  if (move.promotion) {
    score += PIECE_VALUE[move.promotion] * 8;
  }

  const next = applyMove(state, move);
  const status = getGameStatus(next);
  if (status === "checkmate") score += 10000;
  else if (status === "check") score += 4;

  return score;
}

/** Depth-1 heuristic move choice for the side to move (used for Black). */
export function chooseAiMove(state: GameState): Move | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;

  let best: Move[] = [];
  let bestScore = -Infinity;
  for (const move of moves) {
    const score = scoreMove(state, move);
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = [move];
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      best.push(move);
    }
  }
  return best[Math.floor(Math.random() * best.length)];
}
