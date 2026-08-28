import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  accept: string;
  title: string;
  hint: string;
  icon: ReactNode;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ accept, title, hint, icon, onFile, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition-all",
          over
            ? "border-primary bg-primary/10 glow-soft"
            : "border-border bg-surface hover:border-primary/50",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon text-primary-foreground glow-soft">
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="max-w-[16rem] text-xs text-muted-foreground">{hint}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
