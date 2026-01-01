import { UploadStatus } from "../types";

interface UploadProgressProps {
  uploads: Record<string, UploadStatus>;
}

export default function UploadProgress({ uploads }: UploadProgressProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 w-80 pointer-events-none z-50">
      {Object.values(uploads).map((upload) => (
        <div
          key={upload.filename}
          className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-zinc-800/50 animate-fade-in pointer-events-auto"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-lg">
                {upload.status === "completed"
                  ? "✅"
                  : upload.status === "error"
                  ? "❌"
                  : "📄"}
              </span>
              <span
                className="font-medium text-xs text-zinc-200 truncate"
                title={upload.filename}
              >
                {upload.filename}
              </span>
            </div>
            {upload.status === "processing" && (
              <div className="animate-spin h-3 w-3 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
            )}
          </div>

          {upload.status === "pending" && (
            <div className="text-[10px] text-zinc-500 pl-7">
              Waiting in queue...
            </div>
          )}

          {(upload.status === "processing" || upload.status === "completed") &&
            upload.progress && (
              <div className="pl-7">
                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                  <span>{Math.round(upload.progress.percent)}%</span>
                  <span>{upload.progress.etr}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      upload.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-indigo-500"
                    }`}
                    style={{ width: `${upload.progress.percent}%` }}
                  ></div>
                </div>
              </div>
            )}
          {upload.status === "error" && (
            <div className="text-[10px] text-red-400 pl-7">
              Error: {upload.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
