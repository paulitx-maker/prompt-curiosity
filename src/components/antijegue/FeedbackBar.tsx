import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star, ThumbsDown } from "lucide-react";
import { enviarFeedback } from "@/lib/antijegue.functions";

interface FeedbackBarProps {
  executionId: string;
}

export function FeedbackBar({ executionId }: FeedbackBarProps) {
  const send = useServerFn(enviarFeedback);
  const [estado, setEstado] = useState<"idle" | "input" | "enviado">("idle");
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);

  const gostei = async () => {
    setLoading(true);
    try {
      await send({ data: { executionId, nota: 5 } });
      setEstado("enviado");
    } finally {
      setLoading(false);
    }
  };

  const deuRuim = async () => {
    setLoading(true);
    try {
      await send({ data: { executionId, nota: 1, oQueFaltou: texto.trim() || undefined } });
      setEstado("enviado");
    } finally {
      setLoading(false);
    }
  };

  if (estado === "enviado") {
    return (
      <p className="rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
        Valeu pelo feedback — ele calibra a próxima aula.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted-foreground">Esse post resolveu?</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={gostei}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Gostei
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setEstado("input")}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-destructive/50 disabled:opacity-50"
        >
          <ThumbsDown className="h-4 w-4" />
          Deu ruim
        </button>
      </div>
      {estado === "input" && (
        <div className="space-y-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que faltou?"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
          />
          <button
            type="button"
            disabled={loading}
            onClick={deuRuim}
            className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
