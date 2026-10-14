"use client";

import { AlertCircle } from "lucide-react";

interface Props {
  type: string;
  id?: string;
  version?: string;
}

export function UnsupportedWidget({ type, id, version }: Props) {
  return (
    <div className="p-3 my-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 text-amber-900 shadow-xs text-left">
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Unsupported widget</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-mono text-amber-800">
        <span className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
          type: <strong>{type}</strong>
        </span>
        {id && (
          <span className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
            id: {id}
          </span>
        )}
        {version && (
          <span className="bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
            v{version}
          </span>
        )}
      </div>
    </div>
  );
}
