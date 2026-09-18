import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameState, GameStatus, Move, Square } from "@/types/chess";
import { applyMoveWithHistory, initialState } from "@/lib/chess/board";
import { getGameStatus, legalMoves } from "@/lib/chess/rules";
import { toSan } from "@/lib/chess/notation";
import { chooseAiMove } from "@/lib/chess/ai";

const AI_DELAY_MS = 500;

export interface ChessGame {
  state: GameState;
  status: GameStatus;
  selected: Square | null;
  /** Legal destination squares for the current selection. */
  legalTargets: Map<Square, Move>;
  lastMove: Move | null;
  isAiTurn: boolean;
  isGameOver: boolean;
  selectSquare: (sq: Square) => void;
  newGame: () => void;
}

export function useChessGame(): ChessGame {
  const [state, setState] = useState<GameState>(() => initialState());
  const [selected, setSelected] = useState<Square | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = useMemo(() => getGameStatus(state), [state]);
  const isGameOver = status === "checkmate" || status === "stalemate" || status === "draw";
  const isAiTurn = state.turn === "b" && !isGameOver;

  const legalTargets = useMemo(() => {
    const map = new Map<Square, Move>();
    if (selected === null) return map;
    for (const move of legalMoves(state, selected)) {
      map.set(move.to, move);
    }
    return map;
  }, [state, selected]);

  const lastMove = state.history.length > 0 ? state.history[state.history.length - 1].move : null;

  const clearAiTimer = useCallback(() => {
    if (aiTimer.current !== null) {
      clearTimeout(aiTimer.current);
      aiTimer.current = null;
    }
  }, []);

  const playMove = useCallback((current: GameState, move: Move): GameState => {
    return applyMoveWithHistory(current, move, toSan(current, move));
  }, []);

  // Schedule the AI reply whenever it becomes Black's turn.
  useEffect(() => {
    if (!isAiTurn) return;
    clearAiTimer();
    aiTimer.current = setTimeout(() => {
      aiTimer.current = null;
      setState((current) => {
        if (current.turn !== "b") return current;
        const currentStatus = getGameStatus(current);
        if (currentStatus !== "playing" && currentStatus !== "check") return current;
        const aiMove = chooseAiMove(current);
        if (!aiMove) return current;
        return playMove(current, aiMove);
      });
    }, AI_DELAY_MS);
    return clearAiTimer;
  }, [isAiTurn, state, clearAiTimer, playMove]);

  const selectSquare = useCallback(
    (sq: Square) => {
      if (isGameOver || state.turn !== "w") return;

      // Clicking a highlighted destination applies the move.
      const target = legalTargets.get(sq);
      if (selected !== null && target) {
        setState((current) => playMove(current, target));
        setSelected(null);
        return;
      }

      // Select own piece, otherwise deselect.
      const piece = state.board[sq];
      if (piece && piece.color === "w") {
        setSelected(sq === selected ? null : sq);
      } else {
        setSelected(null);
      }
    },
    [isGameOver, state, selected, legalTargets, playMove],
  );

  const newGame = useCallback(() => {
    clearAiTimer();
    setState(initialState());
    setSelected(null);
  }, [clearAiTimer]);

  return {
    state,
    status,
    selected,
    legalTargets,
    lastMove,
    isAiTurn,
    isGameOver,
    selectSquare,
    newGame,
  };
}
