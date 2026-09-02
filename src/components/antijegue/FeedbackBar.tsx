import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Star } from "lucide-react";
import { enviarFeedback } from "@/lib/antijegue.functions";
import { getDeviceId } from "@/lib/device";

interface FeedbackBarProps {
  executionId: string;
}

export function FeedbackBar({ executionId }: FeedbackBarProps) {
  const send = useServerFn(enviarFeedback);
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [texto, setTexto] = useState("");
  const [podeUsar, setPodeUsar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (nota === 0) return;
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      await send({ 
        data: { 
          executionId, 
          deviceId,
          nota, 
          oQueFaltou: texto.trim() || undefined,
          podeUsarPublico: podeUsar 
        } 
      });
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <p className="rounded-2xl border border-border bg-surface p-4 text-center text-xs text-muted-foreground">
        Valeu! Nota {nota} salva {podeUsar ? "e liberado pra galeria anônima." : " - só uso interno."} Isso calibra o Pack.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Quanto esse resultado resolveu? (1-5)</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => { setNota(n); if(n>=4) setPodeUsar(true); }}
              className="p-1"
            >
              <Star className={`h-7 w-7 transition-colors ${ (hover||nota) >= n ? "fill-primary text-primary" : "text-muted-foreground" }`} />
            </button>
          ))}
        </div>
      </div>

      {nota > 0 && nota <= 3 && (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O que faltou pra ser 5?"
          rows={2}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
        />
      )}

      {nota > 0 && (
        <>
          <label className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs">
            <input type="checkbox" checked={podeUsar} onChange={(e) => setPodeUsar(e.target.checked)} className="mt-0.5" />
            <span className="text-muted-foreground">Pode usar meu post como exemplo anônimo na galeria? (sem seu nome/foto, só o texto gerado)</span>
          </label>

          <button
            type="button"
            disabled={loading || nota===0}
            onClick={enviar}
            className="w-full rounded-xl bg-gradient-neon px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Enviar nota ${nota}`}
          </button>
        </>
      )}
    </div>
  );
}