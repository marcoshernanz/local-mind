interface ChatFilterProps {
  documents: string[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
}

export default function ChatFilter({
  documents,
  selected,
  onToggle,
  onToggleAll,
}: ChatFilterProps) {
  if (documents.length === 0) return null;

  const allSelected =
    documents.length > 0 && documents.every((doc) => selected.has(doc));

  return (
    <div className="w-full mb-2">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Active Context
        </h3>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          {allSelected ? "Clear selection" : "Select all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent pr-2">
        {documents.map((doc) => (
          <label
            key={doc}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border transition-all duration-200 select-none
              ${
                selected.has(doc)
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
              }
            `}
          >
            <input
              type="checkbox"
              checked={selected.has(doc)}
              onChange={() => onToggle(doc)}
              className="hidden"
            />
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            <span className="truncate max-w-[150px]">{doc}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
