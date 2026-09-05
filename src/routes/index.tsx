import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image as ImageIcon, Lock, Mic, Sparkles, RefreshCw, Zap } from "lucide-react";
import { FotoPost } from "@/components/antijegue/FotoPost";
import { AudioResumo } from "@/components/antijegue/AudioResumo";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDeviceId } from "@/hooks/use-device-id";
import { useTracking } from "@/hooks/use-tracking";
import { useCredits } from "@/hooks/use-credits";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const [tab, setTab] = useState<"foto" | "audio">("foto");
  const [lastPost, setLastPost] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(99);
  const [consuming, setConsuming] = useState(false);

  const { getId } = useDeviceId();
  const { track } = useTracking();
  const { consume } = useCredits() as any; // seu hook real

  const loadCredits = async () => {
    const dId = getId();
    const { data } = await supabase.from("users").select("credits").eq("device_id", dId).single();
    if (data) setCredits(data.credits);
  };

  useEffect(() => {
    loadCredits();
    const h1 = (e: any) => setLastPost(e.detail);
    const h2 = () => loadCredits();
    window.addEventListener("post-gerado", h1);
    window.addEventListener("credits-updated", h2);
    return () => {
      window.removeEventListener("post-gerado", h1);
      window.removeEventListener("credits-updated", h2);
    };
  }, []);

  async function gastarCredito(tipo: 'geracao_post' | 'variacao' = 'geracao_post') {
    if (consuming) return;
    setConsuming(true);
    const dId = getId();
    try {
      const hoje = new Date().toISOString().slice(0,10);
      const { count } = await supabase.from("executions").select("*", { count: "exact", head: true }).eq("device_id", dId).gte("created_at", `${hoje}T00:00:00`);
      if ((count || 0) >= 10) {
        toast.error("Limite de 10 hoje atingido.");
        throw new Error("LIMITE");
      }
      if (credits <= 0) {
        await track('click_gerar_bloqueado', { tipo } as any);
        window.dispatchEvent(new Event("abrir-paywall"));
        throw new Error("SEM_CREDITO");
      }
      // usa seu hook que já faz charge_credit + credit_transactions
      await consume(tipo === 'variacao' ? 'consumo_variacao' : 'consumo_geracao', 'gerar-page', undefined);
      await supabase.from("executions").insert({ device_id: dId, tipo } as any);
      await loadCredits();
      window.dispatchEvent(new Event("credits-updated"));
    } finally {
      setConsuming(false);
    }
  }

  async function handleVariacao() {
    try {
      await gastarCredito('variacao');
      window.dispatchEvent(new Event("gerar-variacao"));
      toast.success("Variação -1 crédito");
    } catch {}
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-[88px] pt-10">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Aula 1</p>
          {credits <= 0 && (
            <button onClick={() => window.dispatchEvent(new Event("abrir-paywall"))} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white animate-pulse">
              <Zap className="h-3 w-3" /> Comprar R$4,90
            </button>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Anti-<span className="text-gradient-neon">Jegue</span></h1>
        <p className="text-sm text-muted-foreground">Aqui você não escreve prompt. Responde 3 perguntas, a IA executa no modelo mais barato e você vê quanto custou.</p>
      </header>
      <nav className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5">
        <button onClick={() => setTab("foto")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="foto"? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground")}><ImageIcon className="h-4 w-4" />Foto → Post</button>
        <button onClick={() => setTab("audio")} className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-all", tab==="audio"? "bg-gradient-neon text-white glow-soft" : "text-muted-foreground")}><Mic className="h-4 w-4" />Áudio → Resumo</button>
      </nav>
      <section className="mt-7">
        <div className={tab !== "foto" ? "hidden" : ""}><FotoPost /></div>
        <div className={tab !== "audio" ? "hidden" : ""}><AudioResumo /></div>
      </section>
      {lastPost && (
        <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Gerado</div>
          <p className="text-sm whitespace-pre-wrap">{lastPost}</p>
          <div className="flex gap-2 pt-2">
            <button disabled={consuming} onClick={handleVariacao} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black text-white py-3 text-sm font-medium disabled:opacity-50"><RefreshCw className={cn("h-4 w-4", consuming && "animate-spin")} />{consuming? "..." : "Variação (1 crédito)"}</button>
            <Link to="/pack" className="flex flex-1 items-center justify-center rounded-xl border bg-white py-3 text-sm">Ver Biblioteca →</Link>
          </div>
        </section>
      )}
      <BottomNav />
    </main>
  );
}