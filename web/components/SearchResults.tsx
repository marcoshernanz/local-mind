import { SearchResult } from "../types";

interface SearchResultsProps {
  results: SearchResult[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
        Found {results.length} results
      </h3>
      <div className="space-y-3">
        {results.map((r, i) => (
          <div
            key={i}
            className="group p-4 bg-zinc-900/30 hover:bg-zinc-900/60 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-medium text-indigo-400">
                  {(r.sender || "U")[0].toUpperCase()}
                </div>
                <span className="font-medium text-zinc-200 text-sm">
                  {r.sender || "Unknown"}
                </span>
                <span className="text-xs text-zinc-500">
                  {r.date || "No date"}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-zinc-800/50 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
                {r.score.toFixed(2)}
              </span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap pl-8 border-l-2 border-zinc-800 group-hover:border-zinc-700 transition-colors">
              {r.content}
            </p>
            <div className="mt-3 pl-8 flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                Source
              </span>
              <span className="text-xs text-zinc-500 font-medium truncate max-w-[200px]">
                {r.doc_id}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
