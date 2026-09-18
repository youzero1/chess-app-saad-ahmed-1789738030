import { useEffect, useRef } from "react";
import type { HistoryEntry } from "@/types/chess";

export function MoveHistory({ history }: { history: HistoryEntry[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history.length]);

  const rows: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      white: history[i].san,
      black: history[i + 1]?.san,
    });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border-2 border-frame/60 bg-panel p-4 shadow-lg">
      <h2 className="mb-2 border-b border-frame/30 pb-2 font-serif text-lg font-bold tracking-wide text-ink">
        Moves
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm italic text-ink/60">No moves yet — White to play.</p>
      ) : (
        <div className="max-h-72 min-h-0 overflow-y-auto pr-1 lg:max-h-96">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.num} className="odd:bg-frame/10">
                  <td className="w-8 py-0.5 pl-1 font-semibold text-ink/60">{row.num}.</td>
                  <td className="py-0.5 pl-2 font-medium text-ink">{row.white}</td>
                  <td className="py-0.5 pl-2 font-medium text-ink">{row.black ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}
