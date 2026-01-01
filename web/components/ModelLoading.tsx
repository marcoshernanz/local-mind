import { InitProgress } from "../types";

interface ModelLoadingProps {
  ready: boolean;
  initProgress: InitProgress | null;
}

export default function ModelLoading({
  ready,
  initProgress,
}: ModelLoadingProps) {
  if (ready) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-8 animate-fade-in">
      <div className="flex justify-between text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
        <span>{initProgress?.status || "Initializing..."}</span>
        <span>{Math.round(initProgress?.percent || 0)}%</span>
      </div>
      <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
        <div
          className="bg-indigo-500 h-1 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${initProgress?.percent || 0}%` }}
        ></div>
      </div>
      <p className="text-[10px] text-zinc-600 mt-2 text-center">
        First load may take a while (90MB). Subsequent loads will be instant.
      </p>
    </div>
  );
}
