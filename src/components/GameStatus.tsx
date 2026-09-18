import type { GameStatus } from "@/types/chess";

interface GameStatusProps {
  status: GameStatus;
  /** Color of the side to move (the side that is checkmated, when status is checkmate). */
  turn: "w" | "b";
  onNewGame: () => void;
}

export function GameStatus({ status, turn, onNewGame }: GameStatusProps) {
  let banner: { text: string; className: string } | null = null;
  let turnText: string;

  if (status === "checkmate") {
    banner =
      turn === "w"
        ? { text: "Checkmate — AI wins", className: "bg-red-800 text-red-50" }
        : { text: "Checkmate — You win! 🏆", className: "bg-emerald-700 text-emerald-50" };
    turnText = "Game over";
  } else if (status === "stalemate") {
    banner = { text: "Stalemate — Draw", className: "bg-amber-600 text-amber-50" };
    turnText = "Game over";
  } else if (status === "draw") {
    banner = { text: "Draw", className: "bg-amber-600 text-amber-50" };
    turnText = "Game over";
  } else {
    turnText = turn === "w" ? "White to move" : "Black (AI) is thinking…";
  }

  return (
    <section className="rounded-lg border-2 border-wood-frame/60 bg-parchment p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-lg font-bold text-ink">{turnText}</p>
        <button
          type="button"
          onClick={onNewGame}
          className="rounded-md bg-wood-frame px-4 py-2 text-sm font-semibold text-parchment shadow transition-colors hover:bg-wood-dark focus:outline-none focus:ring-2 focus:ring-parchment/70"
        >
          New Game
        </button>
      </div>

      {status === "check" && (
        <p className="mt-2 inline-block rounded bg-red-700/15 px-2 py-1 text-sm font-bold text-red-800">
          Check!
        </p>
      )}

      {banner && (
        <p className={`mt-3 rounded-md px-3 py-2 text-center font-serif text-lg font-bold shadow ${banner.className}`}>
          {banner.text}
        </p>
      )}
    </section>
  );
}
