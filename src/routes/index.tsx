import { createFileRoute } from "@tanstack/react-router";
import { useChessGame } from "@/hooks/useChessGame";
import { ChessBoard } from "@/components/ChessBoard";
import { MoveHistory } from "@/components/MoveHistory";
import { GameStatus } from "@/components/GameStatus";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const game = useChessGame();
  const interactive = !game.isGameOver && !game.isAiTurn;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center px-4 py-8">
      <header className="mb-6 text-center">
        <h1 className="font-serif text-4xl font-bold tracking-wide text-parchment drop-shadow-md sm:text-5xl">
          ♞ Chess
        </h1>
        <p className="mt-1 text-sm text-parchment/80">You play White — the AI plays Black</p>
      </header>

      <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full max-w-[34rem]">
          <ChessBoard
            state={game.state}
            selected={game.selected}
            legalTargets={game.legalTargets}
            lastMove={game.lastMove}
            interactive={interactive}
            onSelect={game.selectSquare}
          />
        </div>
        <div className="flex w-full max-w-[34rem] flex-col gap-4 lg:w-80">
          <GameStatus status={game.status} turn={game.state.turn} onNewGame={game.newGame} />
          <MoveHistory history={game.state.history} />
        </div>
      </div>
    </main>
  );
}
