import type { Piece, PieceType } from "@/types/chess";

const GLYPHS: Record<PieceType, string> = {
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F",
};

export function ChessPiece({ piece }: { piece: Piece }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none leading-none ${
        piece.color === "w" ? "piece-white" : "piece-black"
      } text-[clamp(1.6rem,6.5vw,3.4rem)]`}
    >
      {GLYPHS[piece.type]}
    </span>
  );
}
