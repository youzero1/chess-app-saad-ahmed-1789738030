import type { GameState, Move, Square } from "@/types/chess";
import { fileOf, kingSquare, rankOf } from "@/lib/chess/board";
import { isInCheck } from "@/lib/chess/rules";
import { ChessPiece } from "./ChessPiece";

interface ChessBoardProps {
  state: GameState;
  selected: Square | null;
  legalTargets: Map<Square, Move>;
  lastMove: Move | null;
  interactive: boolean;
  onSelect: (sq: Square) => void;
}

const FILES = "abcdefgh";

export function ChessBoard({ state, selected, legalTargets, lastMove, interactive, onSelect }: ChessBoardProps) {
  const checkedKing = isInCheck(state, state.turn) ? kingSquare(state, state.turn) : -1;

  const squares: Square[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      squares.push(row * 8 + col); // row 0 = rank 8 (top), White at bottom
    }
  }

  return (
    <div className="rounded-xl bg-frame p-3 shadow-2xl ring-4 ring-black/30 sm:p-4">
      <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-md shadow-inner">
        {squares.map((sq) => {
          const file = fileOf(sq);
          const rank = rankOf(sq);
          const isLight = (file + rank) % 2 === 1;
          const piece = state.board[sq];
          const isSelected = selected === sq;
          const target = legalTargets.get(sq);
          const isLastMove = lastMove !== null && (lastMove.from === sq || lastMove.to === sq);
          const isCheckedKing = checkedKing === sq;

          return (
            <button
              key={sq}
              type="button"
              onClick={() => onSelect(sq)}
              disabled={!interactive}
              className={`relative flex items-center justify-center ${
                isLight ? "bg-board-light" : "bg-board-dark"
              } ${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
            >
              {isLastMove && <span className="absolute inset-0 bg-accent/30" />}
              {isSelected && (
                <span className="absolute inset-0 ring-4 ring-inset ring-accent/90" />
              )}
              {isCheckedKing && (
                <span className="absolute inset-0 animate-pulse bg-accent/60" />
              )}

              {/* Coordinate labels on edge squares */}
              {file === 0 && (
                <span
                  className={`absolute left-0.5 top-0.5 text-[0.55rem] font-bold sm:text-xs ${
                    isLight ? "text-board-dark" : "text-board-light"
                  }`}
                >
                  {rank + 1}
                </span>
              )}
              {rank === 0 && (
                <span
                  className={`absolute bottom-0.5 right-0.5 text-[0.55rem] font-bold sm:text-xs ${
                    isLight ? "text-board-dark" : "text-board-light"
                  }`}
                >
                  {FILES[file]}
                </span>
              )}

              {piece && <ChessPiece piece={piece} />}

              {/* Legal move indicators */}
              {target && !piece && (
                <span className="absolute h-1/4 w-1/4 rounded-full bg-accent/50" />
              )}
              {target && piece && (
                <span className="absolute inset-0 rounded-full ring-4 ring-inset ring-accent/80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
