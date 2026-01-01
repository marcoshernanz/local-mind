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
    <div className="w-full max-w-2xl mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Filter Chats</h3>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {documents.map((doc) => (
          <label
            key={doc}
            className={`
              flex items-center gap-2 px-3 py-1 rounded-full text-xs cursor-pointer border transition-colors select-none
              ${
                selected.has(doc)
                  ? "bg-blue-900/50 border-blue-500 text-blue-100"
                  : "bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600"
              }
            `}
          >
            <input
              type="checkbox"
              checked={selected.has(doc)}
              onChange={() => onToggle(doc)}
              className="hidden"
            />
            <span className="truncate max-w-[150px]">{doc}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
