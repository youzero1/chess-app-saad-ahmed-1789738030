import type { GameState, Move, PieceType } from "@/types/chess";
import { applyMove, fileOf, rankOf, squareName } from "./board";
import { getGameStatus, isInCheck, legalMoves } from "./rules";

const PIECE_LETTERS: Record<Exclude<PieceType, "p">, string> = {
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};

/** Standard algebraic notation for `move` in `state` (state is BEFORE the move). */
export function toSan(state: GameState, move: Move): string {
  if (move.isCastleKingside) return withSuffix(state, move, "O-O");
  if (move.isCastleQueenside) return withSuffix(state, move, "O-O-O");

  const dest = squareName(move.to);
  const isCapture = move.captured !== undefined || move.isEnPassant === true;

  let san: string;
  if (move.piece.type === "p") {
    san = isCapture ? `${"abcdefgh"[fileOf(move.from)]}x${dest}` : dest;
  } else {
    const letter = PIECE_LETTERS[move.piece.type as Exclude<PieceType, "p">];
    san = letter + disambiguation(state, move) + (isCapture ? "x" : "") + dest;
  }

  if (move.promotion) {
    san += `=${PIECE_LETTERS[move.promotion as Exclude<PieceType, "p">] ?? "Q"}`;
  }

  return withSuffix(state, move, san);
}

/** Adds trailing + / # based on the position after the move. */
function withSuffix(state: GameState, move: Move, san: string): string {
  const next = applyMove(state, move);
  const status = getGameStatus(next);
  if (status === "checkmate") return san + "#";
  if (status === "check" || isInCheck(next, next.turn)) return san + "+";
  return san;
}

/** File/rank disambiguation when another same-type piece can also reach the destination. */
function disambiguation(state: GameState, move: Move): string {
  const others = legalMoves(state).filter(
    (m) =>
      m.piece.type === move.piece.type &&
      m.piece.color === move.piece.color &&
      m.to === move.to &&
      m.from !== move.from,
  );
  if (others.length === 0) return "";

  const sameFile = others.some((m) => fileOf(m.from) === fileOf(move.from));
  const sameRank = others.some((m) => rankOf(m.from) === rankOf(move.from));

  if (!sameFile) return "abcdefgh"[fileOf(move.from)];
  if (!sameRank) return String(rankOf(move.from) + 1);
  return squareName(move.from);
}
